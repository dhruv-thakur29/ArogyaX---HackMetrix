'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Filter,
  HeartPulse,
  Info,
  Lightbulb,
  Menu,
  Mic,
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  UserCheck,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AIChatMessage, AIChatResponse, AIChatAssessment } from '@/lib/types'
import type { DoctorProfile } from '@/lib/services/doctorService'
import {
  getAvailableDoctorsAction,
  bookDoctorAppointmentAction,
  requestConsultationAction,
} from '@/lib/ai/actions'

interface SymptomChatProps {
  patientName?: string
  patientAge?: number
  patientGender?: string
  patientVillage?: string
}

interface HistoryAssessmentItem {
  id: string
  title: string
  timestamp: string
  riskLevel: 'LOW' | 'MODERATE' | 'URGENT'
  messages: AIChatMessage[]
  assessment?: AIChatAssessment
}

const STORAGE_KEY = 'arogyax_patient_assessments'

export function SymptomChat({
  patientName = 'Asha Devi',
  patientAge = 34,
  patientGender = 'Female',
  patientVillage = 'Rampur',
}: SymptomChatProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Function to generate clean initial welcome message
  const createWelcomeMessage = (): AIChatMessage => ({
    id: `welcome-${Date.now()}`,
    role: 'assistant',
    content: `Namaste ${patientName}! I'm ArogyaX AI Health Assistant. Tell me what symptoms you're experiencing today. You can describe them naturally.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })

  // History & active assessment states (loaded dynamically)
  const [historyItems, setHistoryItems] = useState<HistoryAssessmentItem[]>([])
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)

  const [messages, setMessages] = useState<AIChatMessage[]>([createWelcomeMessage()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeProvider, setActiveProvider] = useState<'llama' | 'mock'>('llama')

  // Modals state
  const [showDoctorCallModal, setShowDoctorCallModal] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showDirectoryModal, setShowDirectoryModal] = useState(false)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)

  const samplePrompts = [
    'Headache & fever',
    'Cough for 3 days',
    'Stomach pain',
    'Dizziness & weakness',
    'Skin rash & itching',
  ]

  // Load persistent history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setHistoryItems(parsed)
        }
      }
    } catch (err) {
      console.error('[SymptomChat] Error loading history:', err)
    }
  }, [])

  // Auto-scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Select history assessment item
  const handleSelectHistory = (item: HistoryAssessmentItem) => {
    setActiveHistoryId(item.id)
    setMessages(item.messages)
    setMobileDrawerOpen(false)
  }

  // Reset / Start New Assessment
  const handleNewAssessment = () => {
    setActiveHistoryId(null)
    setMessages([createWelcomeMessage()])
    setError(null)
    setActionSuccessMsg(null)
    setInput('')
    setMobileDrawerOpen(false)
    inputRef.current?.focus()
  }

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim()
    if (!messageContent || loading) return

    setError(null)
    setInput('')

    const userMessage: AIChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const apiConversation = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: apiConversation,
          patientContext: {
            age: patientAge,
            gender: patientGender,
            village: patientVillage,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`)
      }

      const data: AIChatResponse = await response.json()
      setActiveProvider(data.provider || 'llama')

      const assistantMessage: AIChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        assessment: data.assessment,
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)

      // If assessment ready, dynamically add/update real history item!
      if (data.assessment) {
        const firstUserMsg = updatedMessages.find((m) => m.role === 'user')
        const assessmentTitle = firstUserMsg ? firstUserMsg.content.slice(0, 32) : 'Symptom Assessment'
        
        const newHistoryItem: HistoryAssessmentItem = {
          id: activeHistoryId || `assessment-${Date.now()}`,
          title: assessmentTitle,
          timestamp: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          riskLevel: data.assessment.riskLevel,
          messages: finalMessages,
          assessment: data.assessment,
        }

        setHistoryItems((prev) => {
          const filtered = prev.filter((item) => item.id !== newHistoryItem.id)
          const updated = [newHistoryItem, ...filtered]
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          } catch (e) {
            console.error('Failed to save history to storage', e)
          }
          return updated
        })

        setActiveHistoryId(newHistoryItem.id)
      }
    } catch (err: any) {
      console.error('[SymptomChat] Error sending message:', err)
      setError('AI service temporary issue — please try again or click Retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRequestConsultation = async (symptomsSummary?: string) => {
    const res = await requestConsultationAction('pat_1', patientName, symptomsSummary || 'AI Symptom Assessment Follow-up')
    if (res.success) {
      setActionSuccessMsg('Tele-consultation request submitted! A doctor will review your queue entry shortly.')
      setTimeout(() => setActionSuccessMsg(null), 6000)
    }
  }

  const handleExportChat = () => {
    const chatText = messages
      .map((m) => `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n')
    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ArogyaX_Assessment_${Date.now()}.txt`
    a.click()
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background font-sans text-foreground rounded-2xl border border-border shadow-md">
      {/* Desktop Sidebar (Persistent & Collapsible) */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ${
          sidebarOpen ? 'w-72 lg:w-80' : 'w-20'
        } shrink-0 h-full overflow-hidden`}
      >
        {/* Sidebar Header: Back Button replacing branding */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {sidebarOpen ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/patient')}
              className="gap-2 text-xs font-semibold hover:bg-muted text-foreground border-border flex-1 mr-2"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Back to Dashboard</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/dashboard/patient')}
              className="h-9 w-9 text-emerald-700 hover:bg-muted"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 text-muted-foreground hover:bg-muted shrink-0"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
        </div>

        {/* New Assessment Button */}
        <div className="p-3">
          <Button
            onClick={handleNewAssessment}
            className={`w-full justify-start gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs text-xs rounded-xl h-10 ${
              !sidebarOpen && 'px-0 justify-center'
            }`}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {sidebarOpen && (
              <span className="flex-1 flex items-center justify-between">
                <span>New Assessment</span>
                <span className="text-[10px] bg-emerald-900/50 px-1.5 py-0.5 rounded border border-emerald-700/50">
                  ⌘ N
                </span>
              </span>
            )}
          </Button>
        </div>

        {/* Recent Assessments History Section (Real State) */}
        {sidebarOpen ? (
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
            <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Recent Assessments</span>
              <Filter className="h-3 w-3" />
            </div>

            {historyItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border/70 my-2">
                <Clock className="h-5 w-5 mx-auto mb-1.5 opacity-50 text-muted-foreground" />
                <p className="font-medium text-foreground text-xs">No recent assessments</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Completed assessments will appear here.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {historyItems.map((item) => {
                  const isActive = item.id === activeHistoryId
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectHistory(item)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between gap-2 text-xs ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 font-medium text-foreground shadow-xs'
                          : 'border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden min-w-0">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-emerald-700 text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <HeartPulse className="h-3.5 w-3.5" />
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <p className="truncate font-semibold text-xs leading-snug">{item.title}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{item.timestamp}</p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          item.riskLevel === 'URGENT'
                            ? 'destructive'
                            : item.riskLevel === 'MODERATE'
                            ? 'warning'
                            : 'success'
                        }
                        className="text-[9px] font-bold px-1.5 py-0 shrink-0"
                      >
                        {item.riskLevel}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center py-4 space-y-3 overflow-y-auto">
            {historyItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectHistory(item)}
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                  item.id === activeHistoryId
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                title={item.title}
              >
                <HeartPulse className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}

        {/* Sidebar Tips Section */}
        {sidebarOpen && (
          <div className="p-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs space-y-1.5 text-emerald-950 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900 dark:text-emerald-100">
                <Lightbulb className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Tips for better guidance</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-900/90 dark:text-emerald-200/90">
                Be specific about your symptoms, duration, and severity for accurate triage.
              </p>
            </div>
          </div>
        )}

        {/* Patient Profile Footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-2.5 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005c4b] text-white font-bold text-xs">
                A
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden text-xs">
                  <p className="font-bold truncate text-foreground leading-tight">{patientName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">Patient</p>
                </div>
              )}
            </div>
            {sidebarOpen && <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full bg-background overflow-hidden relative">
        {/* Fixed Header Bar (No duplicate Back button) */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 md:px-6 backdrop-blur z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Back Button */}
            <button
              onClick={() => router.push('/dashboard/patient')}
              className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted shrink-0"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Title & Status Badge */}
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base md:text-lg text-foreground truncate">
                  ArogyaX AI Health Assistant
                </h1>
                <Badge
                  variant="outline"
                  className={
                    activeProvider === 'llama'
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 text-[10px] font-semibold shrink-0'
                      : 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400 text-[10px] font-semibold shrink-0'
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  {activeProvider === 'llama' ? 'Local Llama 3.2 • GPU' : 'Safe Fallback AI'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                Conversational health evaluation &amp; intelligent triage assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleExportChat} className="gap-1.5 text-xs font-semibold hidden sm:flex">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>

            <Button
              onClick={handleNewAssessment}
              size="sm"
              className="gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Assessment</span>
            </Button>
          </div>
        </header>

        {/* Action Success Toast Banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)}>
              <X className="h-3.5 w-3.5 text-white/80 hover:text-white" />
            </button>
          </div>
        )}

        {/* Independently Scrollable Conversation Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar bg-background">
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#005c4b] text-white font-bold text-xs'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  {msg.role === 'user' ? (
                    'A'
                  ) : (
                    <HeartPulse className="h-5 w-5" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className="space-y-2 max-w-[85%] sm:max-w-[75%] min-w-0">
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-[#005c4b] text-white rounded-tr-none font-sans'
                        : 'bg-card border border-border text-foreground rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        msg.role === 'user' ? 'text-white/70 text-right' : 'text-muted-foreground'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Render Assessment Card inside conversation when present */}
                  {msg.role === 'assistant' && msg.assessment && (
                    <AssessmentSummaryCard
                      assessment={msg.assessment}
                      onRequestConsultation={() => handleRequestConsultation(msg.assessment?.summary)}
                      onCallDoctor={() => setShowDoctorCallModal(true)}
                      onBookAppointment={() => setShowAppointmentModal(true)}
                      onFindDoctor={() => setShowDirectoryModal(true)}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Thinking / Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-card border border-border px-4 py-3 text-xs text-muted-foreground shadow-xs flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse delay-300" />
                  </span>
                  <span className="font-medium text-xs text-foreground">
                    ArogyaX Assistant is evaluating symptoms...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={() => handleSend()} className="h-7 text-xs gap-1">
                  <RefreshCw className="h-3 w-3" /> Retry
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Prompts Row (Compact directly above composer) */}
        <div className="bg-background px-4 py-1.5 shrink-0 border-t border-border/40">
          <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-700" /> Try:
            </span>
            {samplePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-800 hover:border-emerald-500/30 transition-all shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Anchored Message Composer (No large bottom empty space) */}
        <div className="border-t border-border bg-card p-2 md:p-3 shrink-0 z-10">
          <div className="max-w-3xl mx-auto space-y-1">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2 rounded-2xl border border-input bg-background p-2 shadow-xs focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all"
            >
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted shrink-0"
                title="Attach document/record"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your symptoms here... Press Enter to send • Shift + Enter for new line"
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent border-0 p-1.5 text-xs focus:outline-none focus:ring-0 resize-none min-h-[38px] max-h-[120px] text-foreground placeholder:text-muted-foreground"
              />

              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted shrink-0 hidden sm:block"
                title="Voice input"
              >
                <Mic className="h-4 w-4" />
              </button>

              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="icon"
                className="h-9 w-9 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white shrink-0 shadow-xs"
              >
                {loading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>

            <p className="text-[10px] text-center text-muted-foreground pt-0.5">
              ArogyaX provides preliminary guidance only and is not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm md:hidden">
          <div className="w-72 border-r border-border bg-card p-4 space-y-4 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMobileDrawerOpen(false)
                  router.push('/dashboard/patient')
                }}
                className="gap-2 text-xs font-semibold"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
              <button onClick={() => setMobileDrawerOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <Button onClick={handleNewAssessment} className="w-full gap-2 bg-emerald-800 text-white font-semibold text-xs">
              <Plus className="h-4 w-4" /> New Assessment
            </Button>

            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
              {historyItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No recent assessments</div>
              ) : (
                historyItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectHistory(item)}
                    className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between ${
                      item.id === activeHistoryId
                        ? 'bg-emerald-500/10 border-emerald-500/30 font-semibold text-foreground'
                        : 'border-transparent text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">{item.title}</span>
                    <Badge variant={item.riskLevel === 'URGENT' ? 'destructive' : item.riskLevel === 'MODERATE' ? 'warning' : 'success'} className="text-[9px]">
                      {item.riskLevel}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Action Modals */}
      {showDoctorCallModal && (
        <DoctorCallModal
          onClose={() => setShowDoctorCallModal(false)}
          onRequestConsultation={() => {
            setShowDoctorCallModal(false)
            handleRequestConsultation()
          }}
        />
      )}

      {showAppointmentModal && (
        <BookAppointmentModal
          patientName={patientName}
          onClose={() => setShowAppointmentModal(false)}
          onBooked={(msg) => setActionSuccessMsg(msg)}
        />
      )}

      {showDirectoryModal && (
        <DoctorDirectoryModal
          onClose={() => setShowDirectoryModal(false)}
          onSelectBook={() => {
            setShowDirectoryModal(false)
            setShowAppointmentModal(true)
          }}
          onSelectCall={() => {
            setShowDirectoryModal(false)
            setShowDoctorCallModal(true)
          }}
        />
      )}
    </div>
  )
}

// Inline Assessment Card Component
function AssessmentSummaryCard({
  assessment,
  onRequestConsultation,
  onCallDoctor,
  onBookAppointment,
  onFindDoctor,
}: {
  assessment: AIChatAssessment
  onRequestConsultation: () => void
  onCallDoctor: () => void
  onBookAppointment: () => void
  onFindDoctor: () => void
}) {
  const isUrgent = assessment.riskLevel === 'URGENT'
  const isModerate = assessment.riskLevel === 'MODERATE'

  return (
    <Card
      className={`border shadow-xs text-xs mt-3 overflow-hidden ${
        isUrgent
          ? 'border-destructive/60 bg-destructive/5'
          : isModerate
          ? 'border-amber-500/50 bg-amber-500/5'
          : 'border-emerald-500/50 bg-emerald-500/5'
      }`}
    >
      <CardHeader className="p-4 pb-2 border-b border-border/50 bg-card/60">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-700" /> Preliminary Health Evaluation
          </span>
          <Badge
            variant={isUrgent ? 'destructive' : isModerate ? 'warning' : 'success'}
            className="text-[11px] font-bold px-2.5 py-0.5"
          >
            {assessment.riskLevel} RISK LEVEL
          </Badge>
        </div>
        {assessment.summary && (
          <p className="text-xs text-foreground font-medium mt-1">{assessment.summary}</p>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Possible Causes */}
        {assessment.possibleConditions && assessment.possibleConditions.length > 0 && (
          <div className="space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
              <Stethoscope className="h-3.5 w-3.5 text-emerald-700" /> Possible Associated Causes (Informational):
            </p>
            <div className="space-y-1.5">
              {assessment.possibleConditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-background p-2.5 text-xs space-y-0.5"
                >
                  <p className="font-bold text-foreground">{cond.name}</p>
                  <p className="text-muted-foreground text-[11px]">{cond.reason}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Note: These are preliminary possibilities for evaluation, NOT a medical diagnosis.
            </p>
          </div>
        )}

        {/* Warning Signs */}
        {assessment.redFlags && assessment.redFlags.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1 text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Important Warning Signs to Monitor:
            </p>
            <ul className="list-disc list-inside text-amber-950 dark:text-amber-100 text-[11px] space-y-0.5">
              {assessment.redFlags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Remedies & Safe Self Care */}
        {assessment.selfCareGuidance && assessment.selfCareGuidance.length > 0 && (
          <div className="space-y-1 bg-background p-2.5 rounded-lg border border-border">
            <p className="font-semibold text-foreground text-[11px] flex items-center gap-1">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-600" /> Safe Supportive Measures:
            </p>
            <ul className="space-y-1 text-muted-foreground text-[11px]">
              {assessment.selfCareGuidance.map((care, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{care}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Doctor Actions */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          <p className="text-[11px] font-semibold text-foreground">Recommended Next Steps:</p>
          {isUrgent ? (
            <Link
              href="/dashboard/patient/emergency"
              className={buttonVariants({ variant: 'destructive', className: 'w-full gap-2 font-bold text-xs' })}
            >
              <Siren className="h-4 w-4 animate-bounce" />
              Initiate Emergency Referral
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                size="sm"
                onClick={onRequestConsultation}
                className="gap-1 text-[11px] font-semibold px-2 bg-emerald-800 hover:bg-emerald-900 text-white"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Consultation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCallDoctor}
                className="gap-1 text-[11px] font-semibold px-2"
              >
                <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                Call Doctor
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onBookAppointment}
                className="gap-1 text-[11px] font-semibold px-2"
              >
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                Book Slot
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onFindDoctor}
                className="gap-1 text-[11px] font-semibold px-2 text-muted-foreground hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
                Directory
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Doctor Call Modal
function DoctorCallModal({
  onClose,
  onRequestConsultation,
}: {
  onClose: () => void
  onRequestConsultation: () => void
}) {
  const primaryDoctor = {
    name: 'Dr. Rohan Mehta',
    specialization: 'Senior General Physician',
    phone: '+91 98765 12345',
    availability: 'Available Today (09:00 AM - 06:00 PM)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-emerald-600" />
            <h3 className="font-display font-bold text-base text-foreground">Call Primary Doctor</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white font-bold text-base">
              DR
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{primaryDoctor.name}</p>
              <p className="text-xs text-muted-foreground">{primaryDoctor.specialization}</p>
              <p className="text-[11px] text-emerald-700 font-semibold dark:text-emerald-400 mt-0.5">
                {primaryDoctor.availability}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Direct Line:</span>
            <span className="text-xs font-bold text-foreground">{primaryDoctor.phone}</span>
          </div>
        </div>

        <div className="space-y-2">
          <a
            href={`tel:${primaryDoctor.phone.replace(/\s+/g, '')}`}
            className={buttonVariants({ className: 'w-full gap-2 font-bold bg-emerald-700 hover:bg-emerald-800 text-white' })}
          >
            <PhoneCall className="h-4 w-4" />
            Call {primaryDoctor.name} ({primaryDoctor.phone})
          </a>

          <Button
            variant="outline"
            onClick={onRequestConsultation}
            className="w-full gap-2 text-xs font-semibold"
          >
            <Stethoscope className="h-4 w-4" />
            Request Tele-Consultation Queue Entry
          </Button>
        </div>
      </div>
    </div>
  )
}

// Book Appointment Modal
function BookAppointmentModal({
  patientName,
  onClose,
  onBooked,
}: {
  patientName: string
  onClose: () => void
  onBooked: (msg: string) => void
}) {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [reason, setReason] = useState('Routine consultation following AI symptom check.')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    getAvailableDoctorsAction().then((docs) => {
      setDoctors(docs)
      if (docs.length > 0) {
        setSelectedDoctorId(docs[0].id)
        if (docs[0].availableSlots.length > 0) {
          setSelectedSlot(docs[0].availableSlots[0])
        }
      }
    })
  }, [])

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0]

  const handleBook = async () => {
    if (!selectedSlot) return
    setBooking(true)
    try {
      const res = await bookDoctorAppointmentAction('pat_1', patientName, selectedDoctorId, selectedSlot, reason)
      if (res.success) {
        onBooked(`Appointment booked with ${selectedDoctor?.name} for ${selectedSlot} today!`)
        onClose()
      }
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-display font-bold text-base text-foreground">Book Doctor Appointment</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground">Select Doctor:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {doctors.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  setSelectedDoctorId(doc.id)
                  if (doc.availableSlots.length > 0) setSelectedSlot(doc.availableSlots[0])
                }}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  selectedDoctorId === doc.id
                    ? 'border-emerald-600 bg-emerald-500/10 font-medium'
                    : 'border-border bg-background hover:bg-muted/40'
                }`}
              >
                <p className="font-bold text-foreground">{doc.name}</p>
                <p className="text-[11px] text-muted-foreground">{doc.specialization}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Available Today</p>
              </button>
            ))}
          </div>
        </div>

        {selectedDoctor && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">Select Available Time Slot (Today):</label>
            <div className="flex flex-wrap gap-2">
              {selectedDoctor.availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    selectedSlot === slot
                      ? 'border-emerald-700 bg-emerald-700 text-white shadow-xs'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Clock className="h-3 w-3 inline mr-1" />
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-foreground">Consultation Reason:</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-input bg-background p-2.5 text-xs shadow-xs focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <Button
          onClick={handleBook}
          disabled={booking || !selectedSlot}
          className="w-full gap-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white text-xs h-10"
        >
          {booking ? <Sparkles className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Confirm Appointment with {selectedDoctor?.name} ({selectedSlot})
        </Button>
      </div>
    </div>
  )
}

// Doctor Directory Modal
function DoctorDirectoryModal({
  onClose,
  onSelectBook,
  onSelectCall,
}: {
  onClose: () => void
  onSelectBook: () => void
  onSelectCall: () => void
}) {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([])

  useEffect(() => {
    getAvailableDoctorsAction().then(setDoctors)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-emerald-700" />
            <h3 className="font-display font-bold text-base text-foreground">Available ArogyaX Doctors</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {doctors.map((doc) => (
            <div key={doc.id} className="p-4 rounded-xl border border-border bg-background space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.specialization} &middot; {doc.experienceYears} yrs exp.</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Available Today for Tele-consultation</p>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 text-[10px]">
                  Online
                </Badge>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button size="sm" onClick={onSelectBook} className="h-8 text-xs font-semibold gap-1 bg-emerald-800 text-white">
                  <Calendar className="h-3.5 w-3.5" /> Book Slot
                </Button>
                <Button size="sm" variant="outline" onClick={onSelectCall} className="h-8 text-xs font-semibold gap-1">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-600" /> Direct Call
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
