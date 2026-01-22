'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function DriverLoginPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/driver/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/driver')
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  function handlePinInput(value: string) {
    // Only allow numbers, max 6 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setPin(cleaned)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Truck size={32} className="text-white" />
          </div>
          <CardTitle className="text-xl text-white">Driver Login</CardTitle>
          <p className="text-slate-400 text-sm">Enter your PIN to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => handlePinInput(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white text-center text-2xl tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading || pin.length < 4}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <p className="text-slate-500 text-xs text-center mt-4">
            Discreet Courier Columbus
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
