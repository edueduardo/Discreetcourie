'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Shield, Clock, Trash2 } from 'lucide-react'

type Step = 1 | 2 | 3 | 4

interface FormData {
  description: string
  service_type: string
  urgency: string
  scheduled_date: string
  location: string
  privacy_level: 'normal' | 'discreet' | 'no_trace'
  phone: string
  agreed_terms: boolean
}

function RequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLevel = searchParams.get('level') || '1'
  
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    description: '',
    service_type: '',
    urgency: '',
    scheduled_date: '',
    location: '',
    privacy_level: 'discreet',
    phone: '',
    agreed_terms: false
  })

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (step) {
      case 1: return formData.description.length > 10
      case 2: return formData.service_type !== ''
      case 3: return formData.urgency !== ''
      case 4: return formData.phone.length >= 10 && formData.agreed_terms
      default: return false
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/concierge/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          service_level: parseInt(initialLevel),
          no_trace_mode: formData.privacy_level === 'no_trace'
        })
      })
      
      const data = await response.json()
      setOrderCode(data.reference || 'DC-' + Date.now().toString(36).toUpperCase())
    } catch (error) {
      console.error('Error:', error)
      setOrderCode('DC-' + Date.now().toString(36).toUpperCase())
    }
    
    setIsSubmitting(false)
  }

  // Success Screen
  if (orderCode) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Recebido.</h1>
          <p className="text-gray-400 mb-8">
            Você receberá uma mensagem minha em até 30 minutos.
            <br />
            Se for urgente, ligue: (614) 500-3080
          </p>
          
          <div className="p-6 rounded-xl bg-[#1a1a2e] border border-[#2d3748] mb-8">
            <p className="text-sm text-gray-400 mb-2">Código do seu pedido:</p>
            <p className="text-2xl font-mono font-bold text-[#e94560]">{orderCode}</p>
            <p className="text-xs text-gray-500 mt-2">
              Guarde este código. É a única forma de rastrear.
            </p>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="p-6 border-b border-[#2d3748]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep((step - 1) as Step) : router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {step > 1 ? 'Voltar' : 'Início'}
          </button>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-[#e94560]' : 'bg-[#2d3748]'
                }`}
              />
            ))}
          </div>
          
          <span className="text-sm text-gray-500">
            Passo {step} de 4
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          
          {/* STEP 1: ATTENTION - "O que você precisa?" */}
          {step === 1 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Conte-me.</h1>
              <p className="text-gray-400 mb-8">Sem julgamentos.</p>
              
              <textarea
                value={formData.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Descreva o que você precisa. Pode ser vago. Pode ser específico. Ninguém além de mim vai ler isso."
                className="w-full h-48 p-6 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none resize-none text-lg placeholder:text-gray-600"
              />
              
              <p className="text-sm text-gray-600 mt-4">
                <Shield className="w-4 h-4 inline mr-1" />
                Esta mensagem é confidencial e pode ser deletada após leitura.
              </p>
            </div>
          )}

          {/* STEP 2: INTEREST - "Como posso ajudar?" */}
          {step === 2 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Entendi.</h1>
              <p className="text-gray-400 mb-8">Posso ajudar de algumas formas:</p>
              
              <div className="space-y-4">
                {[
                  { id: 'delivery', label: 'Apenas entregar algo', desc: 'Documentos, pacotes, itens' },
                  { id: 'purchase', label: 'Comprar algo para você', desc: 'Farmácia, lojas, presentes' },
                  { id: 'representation', label: 'Fazer algo no seu lugar', desc: 'Buscar, devolver, resolver' },
                  { id: 'storage', label: 'Guardar algo seguro', desc: 'Cofre Humano - itens e segredos' },
                  { id: 'complex', label: 'Situação mais complexa', desc: 'Vamos conversar sobre' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateForm('service_type', option.id)}
                    className={`w-full p-6 rounded-xl border text-left transition-all ${
                      formData.service_type === option.id
                        ? 'bg-[#e94560]/10 border-[#e94560]'
                        : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{option.label}</p>
                        <p className="text-sm text-gray-400">{option.desc}</p>
                      </div>
                      {formData.service_type === option.id && (
                        <Check className="w-5 h-5 text-[#e94560]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: DESIRE - "Quando e como?" */}
          {step === 3 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Perfeito.</h1>
              <p className="text-gray-400 mb-8">Só preciso de alguns detalhes:</p>
              
              {/* Urgência */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">Quando precisa?</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'now', label: 'Agora / Urgente', icon: '🔴' },
                    { id: 'today', label: 'Hoje', icon: '🟡' },
                    { id: 'week', label: 'Esta semana', icon: '🟢' },
                    { id: 'schedule', label: 'Agendar', icon: '📅' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateForm('urgency', option.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.urgency === option.id
                          ? 'bg-[#e94560]/10 border-[#e94560]'
                          : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                      }`}
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Privacidade */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">Nível de privacidade</label>
                <div className="space-y-3">
                  {[
                    { id: 'normal', label: 'Normal', desc: 'Registro mantido', icon: <Shield className="w-5 h-5" /> },
                    { id: 'discreet', label: 'Discreto', desc: 'Dados mínimos', icon: <Clock className="w-5 h-5" /> },
                    { id: 'no_trace', label: 'Sem rastro', desc: 'Deletado após 7 dias', icon: <Trash2 className="w-5 h-5 text-[#e94560]" /> },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateForm('privacy_level', option.id as FormData['privacy_level'])}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        formData.privacy_level === option.id
                          ? 'bg-[#e94560]/10 border-[#e94560]'
                          : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {option.icon}
                        <div>
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-sm text-gray-400">{option.desc}</p>
                        </div>
                      </div>
                      {formData.privacy_level === option.id && (
                        <Check className="w-5 h-5 text-[#e94560]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Localização (opcional) */}
              <div>
                <label className="block text-sm font-medium mb-2">Onde? (opcional)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateForm('location', e.target.value)}
                  placeholder="Endereço ou 'Combinar depois'"
                  className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: ACTION - "Confirmar" */}
          {step === 4 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Última coisa.</h1>
              <p className="text-gray-400 mb-8">Como entro em contato?</p>
              
              {/* Telefone */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="(___) ___-____"
                  className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none text-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Usarei apenas para confirmar. 
                  {formData.privacy_level === 'no_trace' && ' Número será deletado em 7 dias.'}
                </p>
              </div>
              
              {/* Termos */}
              <div className="mb-8">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreed_terms}
                    onChange={(e) => updateForm('agreed_terms', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-[#2d3748] bg-[#1a1a2e] text-[#e94560] focus:ring-[#e94560]"
                  />
                  <span className="text-sm text-gray-400">
                    Li e aceito os termos de confidencialidade. 
                    Entendo que minha solicitação será tratada com sigilo absoluto.
                  </span>
                </label>
              </div>
              
              {/* Resumo */}
              <div className="p-6 rounded-xl bg-[#1a1a2e] border border-[#2d3748] mb-8">
                <h3 className="font-semibold mb-4">Resumo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tipo:</span>
                    <span>{formData.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Urgência:</span>
                    <span>{formData.urgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Privacidade:</span>
                    <span className={formData.privacy_level === 'no_trace' ? 'text-[#e94560]' : ''}>
                      {formData.privacy_level}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t border-[#2d3748]">
            {step > 1 ? (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}
            
            {step < 4 ? (
              <button
                onClick={() => setStep((step + 1) as Step)}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  canProceed()
                    ? 'bg-[#e94560] hover:bg-[#d63d56]'
                    : 'bg-[#2d3748] text-gray-500 cursor-not-allowed'
                }`}
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  canProceed() && !isSubmitting
                    ? 'bg-[#e94560] hover:bg-[#d63d56]'
                    : 'bg-[#2d3748] text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Enviando...' : 'Solicitar Discretamente'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ConciergeRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <RequestForm />
    </Suspense>
  )
}
