'use client'

import { useState } from 'react'
import { X, Shield, Check, FileText, PenLine } from 'lucide-react'

interface VIPTermsModalProps {
  isOpen: boolean
  onClose: () => void
  onSign: (signature: string) => void
  clientName?: string
  agreementType?: 'nda' | 'pact' | 'vip_terms'
}

const TERMS_CONTENT = {
  nda: {
    title: 'Confidentiality Agreement (NDA)',
    content: `CONFIDENTIALITY AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into by and between Discreet Courier Columbus ("Provider") and the Client.

1. CONFIDENTIAL INFORMATION
The Client agrees that all information shared with Provider regarding deliveries, tasks, or services is confidential.

2. PROVIDER OBLIGATIONS
Provider agrees to:
• Maintain complete confidentiality about all client matters
• Not disclose any client information to third parties
• Delete all records upon client request (No Trace Mode)
• Never discuss client business with anyone

3. MUTUAL PROTECTION
Both parties agree to maintain confidentiality for the duration of their relationship and indefinitely thereafter.

4. BREACH
Any breach of this agreement will result in immediate termination of services.`
  },
  pact: {
    title: 'Mutual Loyalty Pact',
    content: `PACTO DE LEALDADE MÚTUA (MUTUAL LOYALTY PACT)

This Mutual Loyalty Pact is a binding agreement between Discreet Courier Columbus ("Provider") and the Client.

1. PROVIDER PROMISES
• Complete confidentiality about all client matters
• No judgment, no questions about nature of tasks
• Priority service at all times
• Direct communication line
• Immediate response to emergencies

2. CLIENT PROMISES
• Honest communication about task requirements
• Timely payment for services
• No illegal activities
• Respect for Provider's safety and boundaries

3. MUTUAL TRUST
Both parties enter this pact understanding that trust is the foundation of our relationship.

"What happens with us, stays with us. Forever."`
  },
  vip_terms: {
    title: 'VIP Service Terms',
    content: `VIP SERVICE TERMS

Welcome to VIP status at Discreet Courier Columbus.

1. VIP BENEFITS
• 24/7 Guardian Mode availability
• Direct phone line to your dedicated driver
• Priority handling for all requests
• No Trace Mode on all services
• Vault storage access
• Last Will service eligibility

2. VIP RESPONSIBILITIES
• Monthly retainer payment
• Minimum 30-day notice for cancellation
• Honest disclosure of task requirements

3. PRICING
• Base retainer: $500/month
• Additional services billed separately
• Emergency calls: Included in retainer

4. TERMINATION
Either party may terminate with 30 days notice.
All client data will be destroyed upon termination if requested.

5. LEGAL PROTECTION
Both parties agree this service is for legal purposes only.
Provider reserves the right to refuse any request.`
  }
}

export default function VIPTermsModal({ 
  isOpen, 
  onClose, 
  onSign, 
  clientName = 'Client',
  agreementType = 'vip_terms'
}: VIPTermsModalProps) {
  const [signature, setSignature] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [signing, setSigning] = useState(false)

  if (!isOpen) return null

  const terms = TERMS_CONTENT[agreementType]

  const handleSign = async () => {
    if (!signature || !agreed) return
    
    setSigning(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    onSign(signature)
    setSigning(false)
    setSignature('')
    setAgreed(false)
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0f] border border-[#2d3748] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2d3748]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#e94560]/20">
              <FileText className="h-5 w-5 text-[#e94560]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{terms.title}</h2>
              <p className="text-sm text-gray-400">Please read and sign below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2d3748]">
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
              {terms.content}
            </pre>
          </div>

          {/* Date and Parties */}
          <div className="mt-6 p-4 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="text-white">{new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              <div>
                <p className="text-gray-500">Client</p>
                <p className="text-white">{clientName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="p-6 border-t border-[#2d3748] space-y-4">
          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-[#2d3748] bg-[#1a1a2e] text-[#e94560] focus:ring-[#e94560]"
            />
            <span className="text-sm text-gray-400">
              I have read and understood the terms above. I agree to be bound by this agreement.
            </span>
          </label>

          {/* Signature Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <PenLine className="h-4 w-4 inline mr-1" />
              Type your full name to sign
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Your full legal name"
              className="w-full p-4 bg-[#1a1a2e] border border-[#2d3748] rounded-xl text-white text-lg font-serif italic focus:border-[#e94560] outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-[#2d3748] rounded-xl text-gray-400 hover:bg-[#1a1a2e] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSign}
              disabled={!signature || !agreed || signing}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                signature && agreed && !signing
                  ? 'bg-[#e94560] hover:bg-[#d63d56] text-white'
                  : 'bg-[#2d3748] text-gray-500 cursor-not-allowed'
              }`}
            >
              {signing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Sign Agreement
                </>
              )}
            </button>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
            <Shield className="h-4 w-4" />
            <span>Your signature is securely stored and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}
