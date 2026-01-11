'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Package, 
  ShoppingBag, 
  MapPin, 
  Clock, 
  UserCheck,
  Shield,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { NoTraceToggle } from '@/components/concierge/NoTraceIndicator'
import { NDASignature } from '@/components/concierge/NDASignature'
import { PurchaseForm } from '@/components/concierge/PurchaseForm'
import { SERVICE_TIERS, type ServiceTier, type TaskCategory } from '@/types'

const TASK_TYPES: { id: TaskCategory; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: 'purchase', label: 'Purchase & Deliver', icon: ShoppingBag, description: 'We buy items for you and deliver them' },
  { id: 'retrieval', label: 'Pick Up Items', icon: Package, description: 'Collect items from a location' },
  { id: 'delivery', label: 'Deliver Something', icon: MapPin, description: 'Deliver items or documents' },
  { id: 'waiting', label: 'Wait in Line', icon: Clock, description: 'We wait so you don\'t have to' },
  { id: 'representation', label: 'Represent Me', icon: UserCheck, description: 'Handle a situation on your behalf' },
  { id: 'special', label: 'Something Else', icon: Shield, description: 'Complex or unique requests' },
]

export default function RequestPage() {
  const [step, setStep] = useState(1)
  const [selectedTier, setSelectedTier] = useState<ServiceTier>('concierge')
  const [selectedTask, setSelectedTask] = useState<TaskCategory | null>(null)
  const [ndaSigned, setNdaSigned] = useState(false)
  const [noTraceMode, setNoTraceMode] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    contactInfo: '',
    preferredTime: '',
    budget: ''
  })

  const selectedTierInfo = SERVICE_TIERS.find(t => t.id === selectedTier)
  const requiresNDA = selectedTier === 'fixer' || selectedTier === 'concierge'

  const handleSubmit = () => {
    // In real app, this would submit to API
    alert('Request submitted! We will contact you shortly.')
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/concierge" className="inline-flex items-center text-slate-400 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Link>
          <h1 className="text-3xl font-bold text-white">Request Service</h1>
          <p className="text-slate-400 mt-2">Tell us what you need. Complete discretion guaranteed.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step >= s 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-400'
                }
              `}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-1 ${step > s ? 'bg-blue-600' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Task Type */}
        {step === 1 && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">What do you need?</CardTitle>
                <CardDescription className="text-slate-400">
                  Select the type of service you require
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {TASK_TYPES.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task.id)}
                    className={`
                      cursor-pointer rounded-lg border p-4 transition-all
                      ${selectedTask === task.id
                        ? 'bg-blue-950/50 border-blue-600'
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        h-10 w-10 rounded-full flex items-center justify-center shrink-0
                        ${selectedTask === task.id ? 'bg-blue-600/20' : 'bg-slate-700'}
                      `}>
                        <task.icon className={`h-5 w-5 ${selectedTask === task.id ? 'text-blue-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <h4 className={`font-medium ${selectedTask === task.id ? 'text-blue-300' : 'text-white'}`}>
                          {task.label}
                        </h4>
                        <p className="text-slate-500 text-sm">{task.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button
              onClick={() => setStep(2)}
              disabled={!selectedTask}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Task Details */}
        {step === 2 && (
          <div className="space-y-6">
            {selectedTask === 'purchase' ? (
              <>
                <PurchaseForm />
                <Button onClick={() => setStep(3)} className="w-full bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              </>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Tell us the details</CardTitle>
                  <CardDescription className="text-slate-400">
                    Be as specific or vague as you're comfortable with
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">What do you need done?</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe what you need... We don't judge."
                      className="mt-1.5 bg-slate-900 border-slate-600 text-white min-h-[120px]"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Location (if applicable)</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Address or general area"
                      className="mt-1.5 bg-slate-900 border-slate-600 text-white"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Preferred Time</Label>
                      <Input
                        value={formData.preferredTime}
                        onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                        placeholder="ASAP, tomorrow, etc."
                        className="mt-1.5 bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Budget (optional)</Label>
                      <Input
                        value={formData.budget}
                        onChange={(e) => setFormData({...formData, budget: e.target.value})}
                        placeholder="$"
                        className="mt-1.5 bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <NoTraceToggle enabled={noTraceMode} onChange={setNoTraceMode} />

                  <Button
                    onClick={() => setStep(3)}
                    disabled={!formData.description}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Continue
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: NDA (if required) */}
        {step === 3 && (
          <div className="space-y-6">
            {requiresNDA && !ndaSigned ? (
              <NDASignature onSign={() => setNdaSigned(true)} />
            ) : (
              <>
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Contact Information</CardTitle>
                    <CardDescription className="text-slate-400">
                      How should we reach you?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Phone Number</Label>
                      <Input
                        value={formData.contactInfo}
                        onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                        placeholder="(614) 555-0000"
                        className="mt-1.5 bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <p className="text-slate-500 text-sm">
                      We'll call or text to discuss details and provide a quote.
                    </p>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep(4)}
                  disabled={!formData.contactInfo}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Review & Submit
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Review Your Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service Type</span>
                    <span className="text-white">{TASK_TYPES.find(t => t.id === selectedTask)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service Tier</span>
                    <Badge className="bg-blue-600">{selectedTierInfo?.name}</Badge>
                  </div>
                  {noTraceMode && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">No-Trace Mode</span>
                      <Badge variant="outline" className="border-red-800 text-red-400">Enabled</Badge>
                    </div>
                  )}
                  {ndaSigned && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">NDA</span>
                      <Badge variant="outline" className="border-green-800 text-green-400">Signed</Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact</span>
                    <span className="text-white">{formData.contactInfo}</span>
                  </div>
                </div>

                <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <strong>What happens next:</strong> We'll review your request and contact you within 30 minutes during business hours (or first thing in the morning) to discuss details and provide a quote.
                  </p>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Submit Request
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
