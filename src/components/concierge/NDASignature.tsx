'use client'

import { useState, useRef } from 'react'
import { Shield, FileSignature, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NDASignatureProps {
  onSign?: (data: NDAData) => void
  version?: string
}

interface NDAData {
  fullName: string
  signature: string
  termsAccepted: string[]
  signedAt: string
}

const NDA_TERMS = [
  {
    id: 'confidentiality',
    title: 'Confidentiality Agreement',
    description: 'I agree that all information shared with Discreet Courier Columbus regarding my tasks, purchases, and personal matters will be kept strictly confidential.'
  },
  {
    id: 'mutual_privacy',
    title: 'Mutual Privacy Protection',
    description: 'I understand that both parties agree to never disclose details of services rendered to any third party without explicit written consent.'
  },
  {
    id: 'no_records',
    title: 'Optional No-Records Policy',
    description: 'I understand I may request "No-Trace Mode" where all records are permanently deleted 7 days after task completion.'
  },
  {
    id: 'legal_only',
    title: 'Legal Activities Only',
    description: 'I confirm that all requests I make are for legal purposes only. I will not request services for illegal activities.'
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    description: 'I agree to indemnify and hold harmless Discreet Courier Columbus from any claims arising from my use of these services, provided they acted in good faith.'
  }
]

export function NDASignature({ onSign, version = '1.0' }: NDASignatureProps) {
  const [acceptedTerms, setAcceptedTerms] = useState<string[]>([])
  const [fullName, setFullName] = useState('')
  const [signature, setSignature] = useState('')
  const [isSigning, setIsSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  const allTermsAccepted = acceptedTerms.length === NDA_TERMS.length
  const canSign = allTermsAccepted && fullName.trim() && signature.trim()

  const toggleTerm = (termId: string) => {
    setAcceptedTerms(prev => 
      prev.includes(termId)
        ? prev.filter(id => id !== termId)
        : [...prev, termId]
    )
  }

  const handleSign = async () => {
    if (!canSign) return
    setIsSigning(true)
    
    // Simulate signing process
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const ndaData: NDAData = {
      fullName,
      signature,
      termsAccepted: acceptedTerms,
      signedAt: new Date().toISOString()
    }
    
    setSigned(true)
    setIsSigning(false)
    onSign?.(ndaData)
  }

  if (signed) {
    return (
      <Card className="bg-green-950/30 border-green-800">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-green-400 text-xl font-bold mb-2">NDA Signed Successfully</h3>
          <p className="text-green-300/70">
            Your confidentiality agreement has been recorded. You now have access to our premium concierge services.
          </p>
          <p className="text-green-400/50 text-sm mt-4">
            Version {version} • Signed {new Date().toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-white">Confidentiality Agreement</CardTitle>
            <CardDescription className="text-slate-400">
              Sign to unlock premium concierge services
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Terms */}
        <div className="space-y-3">
          <Label className="text-slate-300">Review and accept all terms:</Label>
          {NDA_TERMS.map((term) => {
            const isAccepted = acceptedTerms.includes(term.id)
            return (
              <div
                key={term.id}
                onClick={() => toggleTerm(term.id)}
                className={`
                  cursor-pointer rounded-lg border p-4 transition-all
                  ${isAccepted 
                    ? 'bg-blue-950/30 border-blue-800' 
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0
                    ${isAccepted 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-slate-600'
                    }
                  `}>
                    {isAccepted && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <h4 className={`font-medium ${isAccepted ? 'text-blue-300' : 'text-white'}`}>
                      {term.title}
                    </h4>
                    <p className="text-slate-400 text-sm mt-1">{term.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Warning if not all accepted */}
        {!allTermsAccepted && (
          <div className="flex items-center gap-2 text-amber-400 bg-amber-950/30 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm">Please accept all terms to proceed</span>
          </div>
        )}

        {/* Signature fields */}
        {allTermsAccepted && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="fullName" className="text-slate-300">Full Legal Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  className="mt-1.5 bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="signature" className="text-slate-300">Digital Signature (Type your name)</Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="John Smith"
                  className="mt-1.5 bg-slate-900 border-slate-600 text-white font-signature italic"
                  style={{ fontFamily: 'cursive' }}
                />
              </div>
            </div>

            <Button
              onClick={handleSign}
              disabled={!canSign || isSigning}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSigning ? (
                <>Processing...</>
              ) : (
                <>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Sign Agreement
                </>
              )}
            </Button>

            <p className="text-slate-500 text-xs text-center">
              By signing, you agree to these terms. This signature is legally binding.
              <br />Version {version} • {new Date().toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
