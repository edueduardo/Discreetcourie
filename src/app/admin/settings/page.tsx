'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Settings, Save, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Setting {
  id: string
  key: string
  value: any
  description: string | null
  category: string
  is_public: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, Setting[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()

      if (data.byCategory) {
        setSettings(data.byCategory)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Setting updated')
        fetchSettings() // Refresh
      } else {
        toast.error(data.error || 'Failed to update setting')
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      toast.error('Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: string, value: string, type: 'string' | 'number' | 'boolean') => {
    let processedValue: any = value

    if (type === 'number') {
      processedValue = parseFloat(value) || 0
    } else if (type === 'boolean') {
      processedValue = value === 'true'
    }

    updateSetting(key, processedValue)
  }

  const renderSettingInput = (setting: Setting) => {
    const value = setting.value

    // Determine input type based on value
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value}
            onCheckedChange={(checked) => updateSetting(setting.key, checked)}
          />
          <Label>{value ? 'Enabled' : 'Disabled'}</Label>
        </div>
      )
    }

    if (typeof value === 'number') {
      return (
        <Input
          type="number"
          defaultValue={value}
          onBlur={(e) => handleInputChange(setting.key, e.target.value, 'number')}
          className="bg-slate-800 border-slate-700"
        />
      )
    }

    // String (remove quotes if JSON string)
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value).replace(/^"|"$/g, '')

    return (
      <Input
        type="text"
        defaultValue={stringValue}
        onBlur={(e) => updateSetting(setting.key, `"${e.target.value}"`)}
        className="bg-slate-800 border-slate-700"
      />
    )
  }

  const categoryLabels: Record<string, string> = {
    general: 'General',
    operations: 'Operations',
    pricing: 'Pricing',
    integrations: 'Integrations',
    privacy: 'Privacy'
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
          <span className="text-slate-400">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-500" />
            System Settings
          </h1>
          <p className="text-slate-400 mt-1">Configure your courier system</p>
        </div>
        <Button
          onClick={fetchSettings}
          variant="outline"
          className="border-slate-700 text-slate-400"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Settings Cards by Category */}
      <div className="space-y-6">
        {Object.entries(settings).map(([category, categorySettings]) => (
          <Card key={category} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                {categoryLabels[category] || category}
              </CardTitle>
              <CardDescription>
                {category === 'general' && 'Basic business information'}
                {category === 'operations' && 'Operational limits and hours'}
                {category === 'pricing' && 'Pricing and surcharges'}
                {category === 'integrations' && 'Third-party service status'}
                {category === 'privacy' && 'Privacy and data retention'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categorySettings.map((setting, index) => (
                <div key={setting.id}>
                  {index > 0 && <Separator className="bg-slate-700 my-4" />}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Label>
                      {setting.is_public && (
                        <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                          Public
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-slate-500">{setting.description}</p>
                    )}
                    {renderSettingInput(setting)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  )
}
