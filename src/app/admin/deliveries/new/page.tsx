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
import { ArrowLeft, Package, MapPin, User, DollarSign } from 'lucide-react'
import PricingCalculator from '@/components/PricingCalculator'

export default function NewDeliveryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [calculatedPrice, setCalculatedPrice] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Demo - replace with actual API call
    setTimeout(() => {
      router.push('/admin/deliveries')
    }, 1000)
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

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-6">
        {/* Client Info */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Client Information
            </CardTitle>
            <CardDescription className="text-slate-400">
              Select or enter client details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Client</Label>
              <Select>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select existing client or create new" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="new" className="text-white">+ New Client</SelectItem>
                  <SelectItem value="1" className="text-white">Medical Office</SelectItem>
                  <SelectItem value="2" className="text-white">Law Firm LLC</SelectItem>
                  <SelectItem value="3" className="text-white">Pharmacy Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Contact Name</Label>
              <Input
                placeholder="John Doe"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Phone</Label>
              <Input
                placeholder="(614) 555-0123"
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
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Size</Label>
                <Select>
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
                <Select>
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
                <input type="checkbox" className="rounded bg-slate-900 border-slate-700" />
                Fragile
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" className="rounded bg-slate-900 border-slate-700" />
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
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Contact</Label>
                <Input
                  placeholder="Contact name"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input
                  placeholder="(614) 555-0123"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Pickup Notes</Label>
              <Input
                placeholder="Suite 200, ask for front desk"
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
              <Label className="text-slate-300">Address</Label>
              <Input
                placeholder="456 Oak Ave, Westerville, OH"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Contact</Label>
                <Input
                  placeholder="Recipient name"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input
                  placeholder="(614) 555-0456"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Delivery Notes</Label>
              <Input
                placeholder="Leave at front door, ring bell"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Calculator */}
        <div className="lg:col-span-2">
          <PricingCalculator
            onPriceCalculated={(price, breakdown) => setCalculatedPrice(price)}
          />
        </div>

        {/* Pricing */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Price ($)</Label>
                <Input
                  type="number"
                  placeholder="45.00"
                  value={calculatedPrice > 0 ? calculatedPrice.toFixed(2) : ''}
                  onChange={(e) => setCalculatedPrice(parseFloat(e.target.value) || 0)}
                  className="w-32 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
                {calculatedPrice > 0 && (
                  <p className="text-xs text-green-500">Auto-calculated from pricing rules</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Payment Method</Label>
                <Select>
                  <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="invoice" className="text-white">Invoice (Net 30)</SelectItem>
                    <SelectItem value="cash" className="text-white">Cash</SelectItem>
                    <SelectItem value="card" className="text-white">Card</SelectItem>
                    <SelectItem value="venmo" className="text-white">Venmo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1" />
              <div className="flex gap-4">
                <Link href="/admin/deliveries">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Delivery'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
