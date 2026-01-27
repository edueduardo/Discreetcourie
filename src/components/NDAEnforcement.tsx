'use client'

import { useState, useEffect } from 'react'
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, DollarSign, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

interface NDA {
  id: string
  title: string
  status: 'draft' | 'pending' | 'signed' | 'active' | 'violated' | 'expired'
  createdAt: string
  expiresAt?: string
  blockchainProof: string
  parties: any[]
}

interface Violation {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectedAt: string
  penaltyApplied: number
  status: string
}

export function NDAEnforcement() {
  const [ndas, setNdas] = useState<NDA[]>([])
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  // Create NDA form
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [confidentialityDays, setConfidentialityDays] = useState(365)
  const [penaltyAmount, setPenaltyAmount] = useState(10000)
  const [autoEnforcement, setAutoEnforcement] = useState(true)
  const [blockchainProof, setBlockchainProof] = useState(true)

  useEffect(() => {
    fetchNDAs()
  }, [])

  const fetchNDAs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/nda/enforce')
      const result = await response.json()
      if (result.success) {
        setNdas(result.ndas || [])
      }
    } catch (error) {
      console.error('Failed to fetch NDAs:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNDA = async () => {
    if (!title || !content || !recipientName || !recipientEmail) {
      alert('Please fill all required fields')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/nda/enforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          recipientName,
          recipientEmail,
          terms: {
            confidentialityPeriod: confidentialityDays,
            penaltyAmount,
            automaticEnforcement: autoEnforcement,
            blockchainProof,
            prohibitedActions: [
              'disclosure',
              'unauthorized sharing',
              'public posting',
              'competitor sharing',
            ],
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(
          `✅ NDA Created Successfully!\n\n` +
          `Title: ${result.nda.title}\n` +
          `Blockchain Proof: ${result.nda.blockchainProof.substring(0, 16)}...\n` +
          `Signing Link: ${result.nda.signingLink}\n\n` +
          `Recipient will receive email with signing instructions.`
        )

        // Reset form
        setTitle('')
        setContent('')
        setRecipientName('')
        setRecipientEmail('')
        
        // Refresh list
        fetchNDAs()
      } else {
        alert('❌ Failed to create NDA: ' + result.error)
      }
    } catch (error) {
      console.error('Create NDA error:', error)
      alert('❌ Error creating NDA')
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'violated': return 'bg-red-500'
      case 'expired': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Shield className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">NDA Enforcement™</CardTitle>
              <CardDescription>
                Automatic legal protection • Digital signatures • Smart contracts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <FileText className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-xs text-muted-foreground">Digital Signature</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-xs text-muted-foreground">Blockchain Proof</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-muted-foreground">Auto Detection</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-xs text-muted-foreground">Auto Penalties</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create NDA */}
      <Card>
        <CardHeader>
          <CardTitle>Create NDA Agreement</CardTitle>
          <CardDescription>
            Automatic enforcement with digital signatures and blockchain proof
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">NDA Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Project Confidentiality Agreement"
              />
            </div>

            <div>
              <Label htmlFor="recipientName">Recipient Name *</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full legal name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="recipientEmail">Recipient Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="content">NDA Terms & Conditions *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter confidentiality terms, obligations, and restrictions..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="confidentialityDays">Confidentiality Period (days)</Label>
              <Input
                id="confidentialityDays"
                type="number"
                value={confidentialityDays}
                onChange={(e) => setConfidentialityDays(parseInt(e.target.value))}
                min={1}
                max={3650}
              />
            </div>

            <div>
              <Label htmlFor="penaltyAmount">Penalty Amount (USD)</Label>
              <Input
                id="penaltyAmount"
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(parseInt(e.target.value))}
                min={1000}
                step={1000}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Automatic Enforcement</Label>
                <p className="text-xs text-muted-foreground">
                  Auto-detect violations and apply penalties
                </p>
              </div>
              <Switch checked={autoEnforcement} onCheckedChange={setAutoEnforcement} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Blockchain Proof</Label>
                <p className="text-xs text-muted-foreground">
                  Immutable record on blockchain
                </p>
              </div>
              <Switch checked={blockchainProof} onCheckedChange={setBlockchainProof} />
            </div>
          </div>

          <Button onClick={createNDA} disabled={creating} className="w-full" size="lg">
            <FileText className="h-4 w-4 mr-2" />
            {creating ? 'Creating NDA...' : 'Create & Send NDA'}
          </Button>

          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <p className="text-xs text-purple-600 dark:text-purple-400">
              🔒 <strong>Legal Protection:</strong> NDAs are digitally signed with RSA-SHA256, 
              recorded on blockchain, and automatically enforced. Violations trigger instant penalties 
              and legal notifications.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active NDAs */}
      <Card>
        <CardHeader>
          <CardTitle>Active NDAs</CardTitle>
          <CardDescription>
            {ndas.length} agreement{ndas.length !== 1 ? 's' : ''} with automatic enforcement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading NDAs...</p>
          ) : ndas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No NDAs yet. Create your first agreement above.
            </p>
          ) : (
            <div className="space-y-3">
              {ndas.map((nda) => (
                <div
                  key={nda.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{nda.title}</h4>
                        <Badge className={getStatusColor(nda.status)}>
                          {nda.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {nda.parties?.length || 0} parties
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(nda.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Blockchain: {nda.blockchainProof?.substring(0, 32)}...
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">NDA Enforcement™ Premium</h3>
              <p className="text-sm text-muted-foreground">
                Unlimited NDAs • Smart contracts • Legal support
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">$199</p>
              <p className="text-sm text-muted-foreground">/month</p>
              <Button className="mt-2" variant="default">
                Upgrade Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
