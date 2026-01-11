'use client'

import { useState } from 'react'
import { ShoppingBag, Plus, Trash2, DollarSign, Store, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { NoTraceToggle } from './NoTraceIndicator'

interface PurchaseItem {
  id: string
  description: string
  store: string
  quantity: number
  estimatedPrice: number
}

interface PurchaseFormProps {
  onSubmit?: (data: PurchaseFormData) => void
}

interface PurchaseFormData {
  items: PurchaseItem[]
  totalBudget: number
  specialInstructions: string
  noTraceMode: boolean
  deliveryAddress: string
}

export function PurchaseForm({ onSubmit }: PurchaseFormProps) {
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: '1', description: '', store: '', quantity: 1, estimatedPrice: 0 }
  ])
  const [totalBudget, setTotalBudget] = useState<number>(0)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [noTraceMode, setNoTraceMode] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', store: '', quantity: 1, estimatedPrice: 0 }
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof PurchaseItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const estimatedTotal = items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity), 0)
  const serviceFee = Math.max(50, estimatedTotal * 0.15) // 15% or minimum $50

  const handleSubmit = () => {
    onSubmit?.({
      items,
      totalBudget,
      specialInstructions,
      noTraceMode,
      deliveryAddress
    })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-white">Purchase Service</CardTitle>
              <CardDescription className="text-slate-400">
                We buy, you receive. Complete discretion guaranteed.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Items */}
          <div className="space-y-4">
            <Label className="text-slate-300">What do you need us to buy?</Label>
            
            {items.map((item, index) => (
              <div key={item.id} className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Item {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label className="text-slate-400 text-xs">Description (be as specific or vague as you want)</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="What you need..."
                      className="mt-1 bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs flex items-center gap-1">
                      <Store className="h-3 w-3" /> Store (optional)
                    </Label>
                    <Input
                      value={item.store}
                      onChange={(e) => updateItem(item.id, 'store', e.target.value)}
                      placeholder="Any specific store?"
                      className="mt-1 bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-slate-400 text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Est. Price
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.estimatedPrice || ''}
                        onChange={(e) => updateItem(item.id, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addItem}
              className="w-full border-dashed border-slate-600 text-slate-400 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Item
            </Button>
          </div>

          {/* Special Instructions */}
          <div>
            <Label className="text-slate-300">Special Instructions (Optional)</Label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any specific brands, sizes, colors, or other details... We don't judge, we just deliver."
              className="mt-1.5 bg-slate-900 border-slate-600 text-white min-h-[100px]"
            />
          </div>

          {/* Delivery Address */}
          <div>
            <Label className="text-slate-300">Delivery Address</Label>
            <Input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Where should we deliver?"
              className="mt-1.5 bg-slate-900 border-slate-600 text-white"
            />
          </div>

          {/* No Trace Mode */}
          <NoTraceToggle enabled={noTraceMode} onChange={setNoTraceMode} />

          {/* Pricing Summary */}
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Estimated Items Total</span>
              <span>${estimatedTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Service Fee (purchase + delivery)</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between text-white font-bold">
              <span>Estimated Total</span>
              <span>${(estimatedTotal + serviceFee).toFixed(2)}</span>
            </div>
            <p className="text-slate-500 text-xs">
              * Final price may vary based on actual item costs. Receipt provided.
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!items.some(i => i.description) || !deliveryAddress}
          >
            <Package className="h-4 w-4 mr-2" />
            Request Purchase Service
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
