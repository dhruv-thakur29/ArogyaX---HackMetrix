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

    def chat_symptoms(self, conversation: list, patient_context: dict = None) -> Dict[str, Any]:
        if self.model is None or self.tokenizer is None:
            if self.is_loading:
                raise RuntimeError("Model is currently loading in background. Please retry in a few seconds.")
            self.load_model()
            if self.model is None:
                raise RuntimeError(f"Model failed to load: {self.loading_error or 'Unknown error'}")

        system_prompt = (
            "You are ArogyaX AI Health Assistant, an intelligent preliminary health evaluation assistant.\n"
            "You engage in an empathetic, multi-turn clinical inquiry with the user.\n"
            "Strict Medical Rules:\n"
            "1. NEVER make a definitive medical diagnosis or claim certainty (e.g. NEVER say 'You have X disease'). Use non-committal terms such as 'Possible causes may include' or 'This pattern can sometimes be associated with'.\n"
            "2. NEVER prescribe medications or generate specific drug dosages.\n"
            "3. If medication is relevant, state clearly that only a qualified doctor or licensed pharmacist can advise on medications.\n"
            "4. Provide safe, low-risk supportive self-care guidance (e.g., hydration, adequate rest, body temperature monitoring, avoiding triggers, warm salt gargles).\n"
            "5. If symptoms are incomplete, ask 1-2 focused, intelligent follow-up questions (e.g., exact location, duration, aggravating factors), set stage='collecting_information' and needs_more_information=true.\n"
            "6. If enough information is gathered or user requests assessment, set stage='assessment', needs_more_information=false, list 1-3 possible causes with reasons, warning signs, and supportive care.\n"
            "7. If critical red flags (chest pain, shortness of breath, unconsciousness, severe bleeding, stroke signs, seizure, severe allergic reaction) are present, immediately set risk_level='URGENT' and emergency=true.\n"
            "Respond ONLY with a single valid JSON object strictly matching this schema:\n"
            "{\n"
            '  "message": "Conversational assistant message to the patient",\n'
            '  "stage": "collecting_information" | "assessment",\n'
            '  "needs_more_information": true | false,\n'
            '  "follow_up_question": "Optional 1-2 focused follow-up questions",\n'
            '  "risk_level": "LOW" | "MODERATE" | "URGENT",\n'
            '  "possible_conditions": [{"name": "Possible cause name", "reason": "Why it might fit"}],\n'
            '  "red_flags": ["Warning sign to monitor"],\n'
            '  "self_care_guidance": ["Safe supportive recommendation"],\n'
            '  "recommended_action": "Clear next step",\n'
            '  "doctor_contact_recommended": true | false,\n'
            '  "emergency": true | false\n'
            "}"
        )

        formatted_messages = [{"role": "system", "content": system_prompt}]
        for msg in conversation:
            formatted_messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        try:
            formatted_prompt = self.tokenizer.apply_chat_template(
                formatted_messages,
                tokenize=False,
                add_generation_prompt=True
            )
        except Exception:
            formatted_prompt = system_prompt + "\n" + "\n".join([f"{m['role'].upper()}: {m['content']}" for m in conversation])

        inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.3,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        prompt_len = inputs.input_ids.shape[1]
        generated_tokens = outputs[0][prompt_len:]
        raw_response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

        parsed = self._extract_json(raw_response)
        if not parsed or "message" not in parsed:
            parsed = self._fallback_chat_parse(raw_response, conversation)

        parsed["disclaimer"] = (
            "This AI health assistant provides preliminary informational guidance only and is NOT a medical diagnosis. "
            "Always consult a qualified healthcare professional."
        )
        parsed["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        return parsed

    def _fallback_chat_parse(self, text: str, conversation: list) -> Dict[str, Any]:
        last_user_msg = next((m["content"] for m in reversed(conversation) if m.get("role") == "user"), "").lower()
        
        is_urgent = any(w in last_user_msg for w in ["chest pain", "shortness of breath", "severe pain", "unconscious", "bleeding", "stroke"])
        
        if is_urgent:
            return {
                "message": "I detected potential warning symptoms that require immediate evaluation. Please seek emergency medical care.",
                "stage": "assessment",
                "needs_more_information": False,
                "risk_level": "URGENT",
                "possible_conditions": [{"name": "Acute Medical Condition", "reason": "Red flag symptoms reported requiring immediate evaluation."}],
                "red_flags": ["Severe chest pain or acute difficulty breathing"],
                "self_care_guidance": ["Keep calm and avoid physical exertion", "Seek immediate emergency transportation"],
                "recommended_action": "Seek immediate emergency care or tap Emergency Referral.",
                "doctor_contact_recommended": True,
                "emergency": True
            }
        
        return {
            "message": text if text else "Thank you for sharing your symptoms. To better evaluate your situation, how long have you been experiencing these symptoms?",
            "stage": "collecting_information",
            "needs_more_information": True,
            "follow_up_question": "How long have you had these symptoms and how severe are they on a scale of 1 to 10?",
            "risk_level": "MODERATE" if any(w in last_user_msg for w in ["fever", "cough", "vomiting", "pain"]) else "LOW",
            "possible_conditions": [{"name": "Common Viral / Seasonal Illness", "reason": "Reported symptoms match typical mild-to-moderate presentation."}],
            "red_flags": ["Difficulty breathing or high persistent fever"],
            "self_care_guidance": ["Stay hydrated with oral fluids", "Get sufficient rest"],
            "recommended_action": "Monitor symptoms and consider consulting a doctor if they persist.",
            "doctor_contact_recommended": False,
            "emergency": False
        }

# Global singleton model instance
llama_model_instance = LlamaTriageModel()
