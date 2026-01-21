'use client'

import { useEffect, useState } from 'react'
import { 
  Settings, 
  Save, 
  Bell, 
  Globe, 
  DollarSign, 
  Shield,
  Mail,
  Phone,
  MapPin,
  Clock,
  Check
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AppSettings {
  company_name: string
  company_phone: string
  company_email: string
  admin_email: string
  base_price: number
  per_mile_rate: number
  express_surcharge: number
  urgent_surcharge: number
  after_hours_surcharge: number
  coverage_radius_miles: number
  max_daily_deliveries: number
  operating_hours_start: string
  operating_hours_end: string
  notifications_enabled: boolean
  sms_enabled: boolean
  email_enabled: boolean
  driver_pin: string
}

const DEFAULT_SETTINGS: AppSettings = {
  company_name: 'Discreet Courier Columbus',
  company_phone: '(614) 500-3080',
  company_email: 'contact@discreetcourier.com',
  admin_email: 'eduardo@discreetcourier.com',
  base_price: 35,
  per_mile_rate: 2.5,
  express_surcharge: 15,
  urgent_surcharge: 35,
  after_hours_surcharge: 25,
  coverage_radius_miles: 25,
  max_daily_deliveries: 15,
  operating_hours_start: '08:00',
  operating_hours_end: '20:00',
  notifications_enabled: true,
  sms_enabled: false,
  email_enabled: false,
  driver_pin: '1234'
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({ ...DEFAULT_SETTINGS, ...data })
      }
    } catch (error) {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    setSaved(false)
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      // Handle error
    } finally {
      setSaving(false)
    }
  }

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="p-6 text-center">Loading settings...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings /> Settings
        </h1>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className={saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
        >
          {saved ? <><Check size={16} className="mr-2" /> Saved!</> : 
           saving ? 'Saving...' : <><Save size={16} className="mr-2" /> Save Changes</>}
        </Button>
      </div>

      {/* Company Info */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe size={18} /> Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Company Name</label>
            <Input
              value={settings.company_name}
              onChange={(e) => updateSetting('company_name', e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1 flex items-center gap-1">
              <Phone size={14} /> Phone
            </label>
            <Input
              value={settings.company_phone}
              onChange={(e) => updateSetting('company_phone', e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1 flex items-center gap-1">
              <Mail size={14} /> Email
            </label>
            <Input
              type="email"
              value={settings.company_email}
              onChange={(e) => updateSetting('company_email', e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Admin Email</label>
            <Input
              type="email"
              value={settings.admin_email}
              onChange={(e) => updateSetting('admin_email', e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign size={18} /> Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Base Price ($)</label>
            <Input
              type="number"
              value={settings.base_price}
              onChange={(e) => updateSetting('base_price', parseFloat(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Per Mile Rate ($)</label>
            <Input
              type="number"
              step="0.1"
              value={settings.per_mile_rate}
              onChange={(e) => updateSetting('per_mile_rate', parseFloat(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Express Surcharge ($)</label>
            <Input
              type="number"
              value={settings.express_surcharge}
              onChange={(e) => updateSetting('express_surcharge', parseFloat(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Urgent Surcharge ($)</label>
            <Input
              type="number"
              value={settings.urgent_surcharge}
              onChange={(e) => updateSetting('urgent_surcharge', parseFloat(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">After Hours Surcharge ($)</label>
            <Input
              type="number"
              value={settings.after_hours_surcharge}
              onChange={(e) => updateSetting('after_hours_surcharge', parseFloat(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Operations */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin size={18} /> Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Coverage Radius (miles)</label>
            <Input
              type="number"
              value={settings.coverage_radius_miles}
              onChange={(e) => updateSetting('coverage_radius_miles', parseInt(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Max Daily Deliveries</label>
            <Input
              type="number"
              value={settings.max_daily_deliveries}
              onChange={(e) => updateSetting('max_daily_deliveries', parseInt(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1 flex items-center gap-1">
              <Clock size={14} /> Operating Hours Start
            </label>
            <Input
              type="time"
              value={settings.operating_hours_start}
              onChange={(e) => updateSetting('operating_hours_start', e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1 flex items-center gap-1">
              <Clock size={14} /> Operating Hours End
            </label>
            <Input
              type="time"
              value={settings.operating_hours_end}
              onChange={(e) => updateSetting('operating_hours_end', e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell size={18} /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications_enabled}
              onChange={(e) => updateSetting('notifications_enabled', e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span>Enable Push Notifications</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.sms_enabled}
              onChange={(e) => updateSetting('sms_enabled', e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span>Enable SMS Notifications (requires Twilio)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.email_enabled}
              onChange={(e) => updateSetting('email_enabled', e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span>Enable Email Notifications (requires Resend)</span>
          </label>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield size={18} /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Driver PIN</label>
            <Input
              type="password"
              value={settings.driver_pin}
              onChange={(e) => updateSetting('driver_pin', e.target.value)}
              className="bg-slate-700 border-slate-600"
              placeholder="Enter driver PIN"
            />
            <p className="text-xs text-slate-500 mt-1">PIN used to access the driver app</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
