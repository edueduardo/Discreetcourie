'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Wallet, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface ZeroTraceOptions {
  vpnEnabled: boolean
  cryptoPayment: boolean
  autoDeleteHours: number
  noMetadata: boolean
}

export function ZeroTraceDelivery() {
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)
  const [trackingToken, setTrackingToken] = useState<string | null>(null)
  
  const [options, setOptions] = useState<ZeroTraceOptions>({
    vpnEnabled: true,
    cryptoPayment: true,
    autoDeleteHours: 24,
    noMetadata: true
  })

  const [deliveryData, setDeliveryData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    description: '',
    contactMethod: 'anonymous' // anonymous, burner_email, encrypted_chat
  })

  const handleCreateZeroTrace = async () => {
    if (!deliveryData.pickupAddress || !deliveryData.deliveryAddress) {
      toast.error('Pickup and delivery addresses are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/zero-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_address: deliveryData.pickupAddress,
          delivery_address: deliveryData.deliveryAddress,
          description: deliveryData.description,
          vpn_enabled: options.vpnEnabled,
          crypto_payment: options.cryptoPayment,
          auto_delete_after_hours: options.autoDeleteHours,
          no_metadata: options.noMetadata,
          contact_method: deliveryData.contactMethod
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create zero-trace delivery')
      }

      setTrackingToken(data.tracking_token)
      setCreated(true)
      toast.success('Zero-trace delivery created successfully')
    } catch (error: any) {
      console.error('Zero-trace creation error:', error)
      toast.error(error.message || 'Failed to create zero-trace delivery')
    } finally {
      setLoading(false)
    }
  }

  const copyTrackingToken = () => {
    if (trackingToken) {
      navigator.clipboard.writeText(trackingToken)
      toast.success('Tracking token copied to clipboard')
    }
  }

  if (created && trackingToken) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Zero-Trace Delivery Created
          </CardTitle>
          <CardDescription>
            Your delivery has been created with maximum privacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
            <Label className="text-slate-400 text-sm mb-2 block">Tracking Token (Save This)</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-green-400 font-mono text-sm break-all">
                {trackingToken}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyTrackingToken}
                className="text-slate-400 hover:text-white"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>VPN routing enabled</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Crypto payment ready</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Auto-delete in {options.autoDeleteHours} hours</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>No metadata stored</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-500 font-medium mb-1">Important</p>
                <p className="text-slate-400">
                  Save your tracking token. This is the ONLY way to track your delivery. 
                  All records will be permanently deleted after {options.autoDeleteHours} hours.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setCreated(false)
              setTrackingToken(null)
              setDeliveryData({ pickupAddress: '', deliveryAddress: '', description: '', contactMethod: 'anonymous' })
            }}
            className="w-full"
            variant="outline"
          >
            Create Another Delivery
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-500" />
          Zero-Trace Delivery
        </CardTitle>
        <CardDescription>
          Maximum privacy delivery with VPN routing, crypto payments, and auto-delete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Features */}
        <div className="grid grid-cols-2 gap-3">
          <Badge variant="outline" className="justify-center py-2 border-purple-500/30 text-purple-400">
            <EyeOff className="h-4 w-4 mr-2" />
            VPN Routing
          </Badge>
          <Badge variant="outline" className="justify-center py-2 border-purple-500/30 text-purple-400">
            <Wallet className="h-4 w-4 mr-2" />
            Crypto Payment
          </Badge>
          <Badge variant="outline" className="justify-center py-2 border-purple-500/30 text-purple-400">
            <Clock className="h-4 w-4 mr-2" />
            Auto-Delete
          </Badge>
          <Badge variant="outline" className="justify-center py-2 border-purple-500/30 text-purple-400">
            <Shield className="h-4 w-4 mr-2" />
            No Metadata
          </Badge>
        </div>

        {/* Delivery Details */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="pickup" className="text-slate-400">Pickup Address</Label>
            <Input
              id="pickup"
              value={deliveryData.pickupAddress}
              onChange={(e) => setDeliveryData({ ...deliveryData, pickupAddress: e.target.value })}
              placeholder="Enter pickup location"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="delivery" className="text-slate-400">Delivery Address</Label>
            <Input
              id="delivery"
              value={deliveryData.deliveryAddress}
              onChange={(e) => setDeliveryData({ ...deliveryData, deliveryAddress: e.target.value })}
              placeholder="Enter delivery location"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-slate-400">Description (Optional)</Label>
            <Input
              id="description"
              value={deliveryData.description}
              onChange={(e) => setDeliveryData({ ...deliveryData, description: e.target.value })}
              placeholder="Brief description (no sensitive info)"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Privacy Options */}
        <div className="space-y-4 p-4 rounded-lg bg-slate-900 border border-slate-700">
          <h3 className="text-white font-medium text-sm">Privacy Settings</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="vpn" className="text-slate-300 text-sm">VPN Routing</Label>
              <p className="text-xs text-slate-500">Route through VPN for IP anonymity</p>
            </div>
            <Switch
              id="vpn"
              checked={options.vpnEnabled}
              onCheckedChange={(checked) => setOptions({ ...options, vpnEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="crypto" className="text-slate-300 text-sm">Crypto Payment</Label>
              <p className="text-xs text-slate-500">Accept cryptocurrency for payment</p>
            </div>
            <Switch
              id="crypto"
              checked={options.cryptoPayment}
              onCheckedChange={(checked) => setOptions({ ...options, cryptoPayment: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="metadata" className="text-slate-300 text-sm">No Metadata</Label>
              <p className="text-xs text-slate-500">Don't store any identifying metadata</p>
            </div>
            <Switch
              id="metadata"
              checked={options.noMetadata}
              onCheckedChange={(checked) => setOptions({ ...options, noMetadata: checked })}
            />
          </div>

          <div>
            <Label htmlFor="autodelete" className="text-slate-300 text-sm">Auto-Delete After (hours)</Label>
            <Input
              id="autodelete"
              type="number"
              min="1"
              max="168"
              value={options.autoDeleteHours}
              onChange={(e) => setOptions({ ...options, autoDeleteHours: parseInt(e.target.value) || 24 })}
              className="bg-slate-800 border-slate-600 text-white mt-2"
            />
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="text-sm">
              <p className="text-red-500 font-medium mb-1">Privacy Notice</p>
              <p className="text-slate-400">
                Zero-trace deliveries leave no permanent records. Save your tracking token immediately. 
                Once deleted, there is NO way to recover delivery information.
              </p>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateZeroTrace}
          disabled={loading || !deliveryData.pickupAddress || !deliveryData.deliveryAddress}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Zero-Trace Delivery...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Create Zero-Trace Delivery
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
