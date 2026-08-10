import os
import json
import re
import time
import threading
from typing import Dict, Any, Optional
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

MODEL_ID = os.getenv("LLAMA_MODEL_ID", "meta-llama/Llama-3.2-3B-Instruct")

class LlamaTriageModel:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.is_quantized = False
        self.vram_allocated_mb = 0.0
        self.is_loading = False
        self.loading_error = None
        self.load_lock = threading.Lock()

    def start_background_load(self):
        with self.load_lock:
            if self.model is not None or self.is_loading:
                return
            self.is_loading = True
            self.loading_error = None

        thread = threading.Thread(target=self._do_load_model, daemon=True)
        thread.start()

    def _do_load_model(self):
        try:
            print(f"[ArogyaX Llama Service] Background loading model '{MODEL_ID}' on device: {self.device}...")
            
            # Load Tokenizer using cached HF auth token
            self.tokenizer = AutoTokenizer.from_pretrained(
                MODEL_ID,
                trust_remote_code=True,
                token=True
            )
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            if self.device == "cuda":
                # 4-bit NF4 Quantization via BitsAndBytes for 6GB VRAM efficiency
                try:
                    print("[ArogyaX Llama Service] Configuring 4-bit NF4 Quantization (BitsAndBytes)...")
                    bnb_config = BitsAndBytesConfig(
                        load_in_4bit=True,
                        bnb_4bit_quant_type="nf4",
                        bnb_4bit_use_double_quant=True,
                        bnb_4bit_compute_dtype=torch.float16,
                    )
                    self.model = AutoModelForCausalLM.from_pretrained(
                        MODEL_ID,
                        quantization_config=bnb_config,
                        device_map="auto",
                        torch_dtype=torch.float16,
                        trust_remote_code=True,
                        token=True
                    )
                    self.is_quantized = True
                    print("[ArogyaX Llama Service] 4-bit Quantized Model loaded successfully.")
                except Exception as e:
                    print(f"[ArogyaX Llama Service] BitsAndBytes 4-bit load failed: {e}. Falling back to float16 device_map='auto'.")
                    self.model = AutoModelForCausalLM.from_pretrained(
                        MODEL_ID,
                        torch_dtype=torch.float16,
                        device_map="auto",
                        trust_remote_code=True,
                        token=True
                    )
                    self.is_quantized = False

                self.vram_allocated_mb = torch.cuda.memory_allocated(0) / (1024 * 1024)
                print(f"[ArogyaX Llama Service] GPU VRAM allocated: {self.vram_allocated_mb:.2f} MB")
            else:
                print("[ArogyaX Llama Service] CUDA unavailable. Loading model on CPU (float32)...")
                self.model = AutoModelForCausalLM.from_pretrained(
                    MODEL_ID,
                    torch_dtype=torch.float32,
                    trust_remote_code=True,
                    token=True
                )
        except Exception as err:
            print(f"[ArogyaX Llama Service] ERROR loading model: {err}")
            self.loading_error = str(err)
        finally:
            self.is_loading = False

    def load_model(self):
        if self.model is not None:
            return
        self._do_load_model()

    def get_status(self) -> Dict[str, Any]:
        gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None (CPU)"
        vram_mb = torch.cuda.memory_allocated(0) / (1024 * 1024) if torch.cuda.is_available() else 0.0
        return {
            "model_id": MODEL_ID,
            "device": self.device,
            "gpu_name": gpu_name,
            "is_quantized": self.is_quantized,
            "vram_allocated_mb": round(vram_mb, 2),
            "loaded": self.model is not None,
            "is_loading": self.is_loading,
            "loading_error": self.loading_error,
        }

    def analyze_symptoms(self, symptoms: str) -> Dict[str, Any]:
        if self.model is None or self.tokenizer is None:
            if self.is_loading:
                raise RuntimeError("Model is currently loading in background. Please retry in a few seconds.")
            # Trigger load if not loaded yet
            self.load_model()
            if self.model is None:
                raise RuntimeError(f"Model failed to load: {self.loading_error or 'Unknown error'}")

        system_prompt = (
            "You are ArogyaX AI Clinical Triage Assistant, an expert medical AI system.\n"
            "Analyze the patient's symptoms and classify into one of three triage levels:\n"
            "- LOW: Mild symptoms, self-limiting, routine care.\n"
            "- MODERATE: Symptoms needing doctor review within 24-48 hours.\n"
            "- URGENT: Severe red-flag symptoms requiring immediate emergency medical attention.\n\n"
            "Respond ONLY with a single JSON object. Do not include markdown code block syntax or extra text outside JSON.\n"
            "The JSON structure MUST strictly follow this exact schema:\n"
            "{\n"
            '  "level": "LOW" | "MODERATE" | "URGENT",\n'
            '  "title": "Short descriptive title",\n'
            '  "summary": "One sentence summary of the symptom assessment",\n'
            '  "explanation": ["Point 1", "Point 2"],\n'
            '  "recommendedActions": ["Action 1", "Action 2"],\n'
            '  "seekImmediateCare": true or false\n'
            "}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Patient symptoms: {symptoms}"},
        ]

        formatted_prompt = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=384,
                temperature=0.2,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        prompt_len = inputs.input_ids.shape[1]
        generated_tokens = outputs[0][prompt_len:]
        raw_response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

        parsed = self._extract_json(raw_response)
        
        if not parsed or "level" not in parsed:
            parsed = self._fallback_parse(raw_response, symptoms)

        parsed["disclaimer"] = (
            "This local Llama AI model provides informational triage guidance only and is NOT a medical diagnosis. "
            "Always consult a qualified healthcare professional."
        )
        parsed["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        return parsed

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE | re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass
        return None

    def _fallback_parse(self, text: str, symptoms: str) -> Dict[str, Any]:
        text_lower = (symptoms + " " + text).lower()
        if any(w in text_lower for w in ["chest pain", "shortness of breath", "severe pain", "unconscious", "bleeding"]):
            level = "URGENT"
            title = "Urgent Medical Review Needed"
            seek_care = True
        elif any(w in text_lower for w in ["fever", "vomiting", "cough", "diarrhea", "pain"]):
            level = "MODERATE"
            title = "Moderate Priority - Consultation Recommended"
            seek_care = False
        else:
            level = "LOW"
            title = "Mild Priority"
            seek_care = False

        return {
            "level": level,
            "title": title,
            "summary": "Informational triage based on patient reported symptoms.",
            "explanation": [
                "Symptoms processed by local Llama-3.2-3B-Instruct model.",
                f"Generated clinical guidance: {text[:150]}..." if text else "Clinical review advised."
            ],
            "recommendedActions": [
                "Monitor your condition closely.",
                "Seek medical evaluation if symptoms worsen or persist."
            ],
            "seekImmediateCare": seek_care
        }

# Global singleton model instance
llama_model_instance = LlamaTriageModel()
