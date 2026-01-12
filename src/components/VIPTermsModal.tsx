'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, FileText, Award } from 'lucide-react'

interface VIPTermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept?: (data: {
    nda: boolean
    pact: boolean
    terms: boolean
    signature: string
    timestamp: string
  }) => void
}

export function VIPTermsModal({ open, onOpenChange, onAccept }: VIPTermsModalProps) {
  const [activeTab, setActiveTab] = useState('nda')
  const [accepted, setAccepted] = useState(false)
  const [signature, setSignature] = useState('')

  const handleAccept = () => {
    if (accepted && signature.trim()) {
      onAccept?.({
        nda: true,
        pact: true,
        terms: true,
        signature,
        timestamp: new Date().toISOString(),
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-purple-600" />
            VIP Service Terms & Agreements
          </DialogTitle>
          <DialogDescription>
            Please review and accept all agreements to activate VIP services
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nda">
              <FileText className="h-4 w-4 mr-2" />
              NDA
            </TabsTrigger>
            <TabsTrigger value="pact">
              <Shield className="h-4 w-4 mr-2" />
              Loyalty Pact
            </TabsTrigger>
            <TabsTrigger value="terms">
              <Award className="h-4 w-4 mr-2" />
              VIP Terms
            </TabsTrigger>
          </TabsList>

          {/* NDA Tab */}
          <TabsContent value="nda" className="space-y-4">
            <ScrollArea className="h-[400px] w-full rounded border p-4">
              <div className="space-y-4 text-sm">
                <h3 className="font-bold text-lg">NON-DISCLOSURE AGREEMENT (NDA)</h3>

                <p className="text-muted-foreground italic">
                  Effective Date: {new Date().toLocaleDateString()}
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">1. Definition of Confidential Information</h4>
                    <p className="text-muted-foreground">
                      "Confidential Information" includes all information disclosed by either party
                      related to:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Client identity, location, and personal details</li>
                      <li>Nature and details of services requested</li>
                      <li>Communications between parties</li>
                      <li>Vault items, contents, and deliveries</li>
                      <li>Financial transactions and payment methods</li>
                      <li>Any sensitive information shared during service delivery</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">2. Obligations</h4>
                    <p className="text-muted-foreground">
                      Both parties agree to:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Maintain strict confidentiality of all Confidential Information</li>
                      <li>Not disclose information to third parties without written consent</li>
                      <li>Use information solely for service delivery purposes</li>
                      <li>Implement reasonable security measures to protect information</li>
                      <li>Return or destroy information upon request</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">3. Exceptions</h4>
                    <p className="text-muted-foreground">
                      Confidentiality obligations do not apply to information that:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Is publicly available through no breach of this agreement</li>
                      <li>Is required to be disclosed by law or court order</li>
                      <li>Was independently developed without use of Confidential Information</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">4. Duration</h4>
                    <p className="text-muted-foreground">
                      This NDA remains in effect indefinitely, even after service termination.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">5. Remedies</h4>
                    <p className="text-muted-foreground">
                      Breach of this agreement may result in legal action and financial damages.
                      Both parties acknowledge that monetary damages may be insufficient and
                      equitable relief may be appropriate.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Loyalty Pact Tab */}
          <TabsContent value="pact" className="space-y-4">
            <ScrollArea className="h-[400px] w-full rounded border p-4">
              <div className="space-y-4 text-sm">
                <h3 className="font-bold text-lg">PACTO DE LEALDADE (MUTUAL LOYALTY PACT)</h3>

                <p className="text-muted-foreground italic">
                  A bond of mutual trust and discretion
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">🤝 The Foundation of Trust</h4>
                    <p className="text-muted-foreground">
                      This Pact represents more than a contract—it's a sacred agreement of mutual
                      protection. What you share stays between us. What we learn about you stays
                      with us. Forever.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">🔒 Provider's Oath</h4>
                    <p className="text-muted-foreground">We solemnly pledge:</p>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Your secrets are our secrets</li>
                      <li>We will never reveal your identity or activities</li>
                      <li>We will never judge your requests or situations</li>
                      <li>We will protect you as we would protect ourselves</li>
                      <li>Your trust is our most valuable asset</li>
                      <li>We would rather close our business than betray you</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">🛡️ Client's Oath</h4>
                    <p className="text-muted-foreground">You agree to:</p>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Maintain our confidentiality as we maintain yours</li>
                      <li>Not reveal our methods, capabilities, or relationship</li>
                      <li>Protect our operational security as we protect yours</li>
                      <li>Never use our services to harm innocent parties</li>
                      <li>Respect the sacred nature of this bond</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">⚖️ The Balance</h4>
                    <p className="text-muted-foreground">
                      This is a mutual pact. We protect each other. We trust each other. We honor
                      each other. Neither party holds power over the other—we are equals bound by
                      honor.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">🔥 The Promise</h4>
                    <p className="text-muted-foreground">
                      Should either party violate this pact, the bond is broken. The betrayed
                      party is released from all obligations. Trust, once broken, cannot be
                      repaired.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">♾️ Forever</h4>
                    <p className="text-muted-foreground">
                      This pact has no expiration. It survives the end of our business
                      relationship. It survives legal proceedings. It survives time itself. Your
                      secrets die with us.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* VIP Terms Tab */}
          <TabsContent value="terms" className="space-y-4">
            <ScrollArea className="h-[400px] w-full rounded border p-4">
              <div className="space-y-4 text-sm">
                <h3 className="font-bold text-lg">VIP SERVICE TERMS & CONDITIONS</h3>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">1. Service Tiers</h4>
                    <p className="text-muted-foreground">VIP services include:</p>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li><strong>Concierge ($75-150/hr):</strong> Personal assistance, purchases, representation</li>
                      <li><strong>The Fixer ($200-500+):</strong> Complex situations, absolute discretion</li>
                      <li><strong>Premium Features:</strong> Vault, Last Will, Guardian Mode, Destruction</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">2. Pricing & Payment</h4>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Services quoted individually based on complexity</li>
                      <li>Payment required before task execution unless retainer active</li>
                      <li>Guardian Mode: Monthly retainer ($500/month minimum)</li>
                      <li>Anonymous payment options available</li>
                      <li>No refunds once service initiated</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">3. No-Trace Mode</h4>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>All records auto-deleted after 7 days</li>
                      <li>Available for sensitive requests (+$50)</li>
                      <li>Cannot be reversed once data deleted</li>
                      <li>Client code remains for billing only</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">4. Vault & Storage</h4>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Items stored securely off-site</li>
                      <li>Monthly storage fee applies</li>
                      <li>Expired items handled per agreement</li>
                      <li>We are not responsible for item degradation</li>
                      <li>No illegal items accepted</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">5. Última Vontade (Last Will)</h4>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Posthumous delivery requires trigger mechanism</li>
                      <li>Check-in requirements must be maintained</li>
                      <li>Delivery to beneficiary requires verification</li>
                      <li>Annual maintenance fee applies</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">6. Limitations & Restrictions</h4>
                    <p className="text-muted-foreground">We will NOT:</p>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Engage in illegal activities</li>
                      <li>Cause harm to innocent parties</li>
                      <li>Handle weapons, drugs, or contraband</li>
                      <li>Participate in fraud or deception (except as agreed representation)</li>
                      <li>Violate another person's rights</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">7. Right to Refuse</h4>
                    <p className="text-muted-foreground">
                      We reserve the right to refuse any request that violates our ethics,
                      endangers our team, or feels wrong. Full discretion to decline work.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">8. Data Destruction</h4>
                    <p className="text-muted-foreground">
                      Client may request complete data deletion at any time. We provide video
                      proof of destruction. This action is irreversible.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">9. Termination</h4>
                    <p className="text-muted-foreground">
                      Either party may terminate services with 30 days notice. Guardian Mode
                      retainer non-refundable for current month. Vault items must be retrieved
                      within 60 days or will be disposed per agreement.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">10. Governing Law</h4>
                    <p className="text-muted-foreground">
                      Agreement governed by laws of State of Ohio. Disputes resolved through
                      private arbitration to maintain confidentiality.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Signature Section */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept-all"
              checked={accepted}
              onCheckedChange={(checked: boolean) => setAccepted(checked === true)}
            />
            <Label htmlFor="accept-all" className="text-sm font-medium">
              I have read and accept the NDA, Loyalty Pact, and VIP Service Terms
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Digital Signature (Full Name)</Label>
            <Input
              id="signature"
              placeholder="Type your full name to sign"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              disabled={!accepted}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            By signing, you acknowledge that this constitutes a legally binding electronic
            signature under the ESIGN Act. Timestamp: {new Date().toLocaleString()}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!accepted || !signature.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            Accept & Sign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
