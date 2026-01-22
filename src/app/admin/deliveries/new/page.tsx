'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Package, MapPin, User, DollarSign, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import PricingCalculator from '@/components/PricingCalculator'

export default function NewDeliveryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [calculatedPrice, setCalculatedPrice] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    contactPhone: '',
    description: '',
    size: 'medium',
    priority: 'standard',
    isFragile: false,
    isConfidential: false,
    pickupAddress: '',
    pickupContact: '',
    pickupPhone: '',
    pickupNotes: '',
    deliveryAddress: '',
    deliveryContact: '',
    deliveryPhone: '',
    deliveryNotes: '',
    price: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validation
      if (!formData.clientName || !formData.deliveryAddress) {
        setError('Client name and delivery address are required')
        setIsLoading(false)
        return
      }

      // POST to API
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_name: formData.clientName,
          contact_phone: formData.contactPhone,
          package_description: formData.description,
          package_size: formData.size,
          priority: formData.priority,
          is_fragile: formData.isFragile,
          is_confidential: formData.isConfidential,
          pickup_address: formData.pickupAddress,
          pickup_contact: formData.pickupContact,
          pickup_phone: formData.pickupPhone,
          pickup_notes: formData.pickupNotes,
          delivery_address: formData.deliveryAddress,
          delivery_contact: formData.deliveryContact,
          delivery_phone: formData.deliveryPhone,
          delivery_notes: formData.deliveryNotes,
          price: calculatedPrice || formData.price
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create delivery')
      }

      // Success!
      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/deliveries')
      }, 1500)

    } catch (err: any) {

      setError(err.message || 'Failed to create delivery. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/deliveries">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Delivery</h1>
          <p className="text-slate-400">Create a new delivery order</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-green-400">Delivery created successfully! Redirecting...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-6">
        {/* Client Info */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Client Information
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter client details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Client Name *</Label>
              <Input
                required
                placeholder="John Doe"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Phone</Label>
              <Input
                placeholder="(614) 555-0123"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Package Info */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Package Details
            </CardTitle>
            <CardDescription className="text-slate-400">
              Describe what you're delivering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea
                placeholder="Documents, medical supplies, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Size</Label>
                <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="small" className="text-white">Small (envelope)</SelectItem>
                    <SelectItem value="medium" className="text-white">Medium (box)</SelectItem>
                    <SelectItem value="large" className="text-white">Large (multiple boxes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="standard" className="text-white">Standard</SelectItem>
                    <SelectItem value="express" className="text-white">Express (+$10)</SelectItem>
                    <SelectItem value="urgent" className="text-white">Urgent (+$25)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isFragile}
                  onChange={(e) => setFormData({ ...formData, isFragile: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700"
                />
                Fragile
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isConfidential}
                  onChange={(e) => setFormData({ ...formData, isConfidential: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700"
                />
                Confidential
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Pickup */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Pickup Location
            </CardTitle>
            <CardDescription className="text-slate-400">
              Where to pick up the package
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Address</Label>
              <Input
                placeholder="123 Main St, Columbus, OH"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Contact</Label>
                <Input
                  placeholder="Contact name"
                  value={formData.pickupContact}
                  onChange={(e) => setFormData({ ...formData, pickupContact: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input
                  placeholder="(614) 555-0123"
                  value={formData.pickupPhone}
                  onChange={(e) => setFormData({ ...formData, pickupPhone: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Pickup Notes</Label>
              <Input
                placeholder="Suite 200, ask for front desk"
                value={formData.pickupNotes}
                onChange={(e) => setFormData({ ...formData, pickupNotes: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Delivery Location
            </CardTitle>
            <CardDescription className="text-slate-400">
              Where to deliver the package
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Address *</Label>
              <Input
                required
                placeholder="456 Oak Ave, Columbus, OH"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Contact</Label>
                <Input
                  placeholder="Contact name"
                  value={formData.deliveryContact}
                  onChange={(e) => setFormData({ ...formData, deliveryContact: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input
                  placeholder="(614) 555-0123"
                  value={formData.deliveryPhone}
                  onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Delivery Notes</Label>
              <Input
                placeholder="Leave at front door if no answer"
                value={formData.deliveryNotes}
                onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Pricing
            </CardTitle>
            <CardDescription className="text-slate-400">
              Dynamic pricing based on package details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PricingCalculator
              onPriceCalculated={setCalculatedPrice}
              {...formData}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="lg:col-span-2 flex justify-end gap-4">
          <Link href="/admin/deliveries">
            <Button type="button" variant="outline" className="border-slate-600 text-slate-300">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading || success}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Created!
              </>
            ) : (
              'Create Delivery'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
