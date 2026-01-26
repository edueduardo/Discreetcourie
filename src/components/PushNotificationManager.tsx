'use client'

import { useState } from 'react'
import { Bell, BellOff, Check, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function PushNotificationManager() {
  const { permission, isSupported, requestPermission, subscribe, unsubscribe, sendTestNotification } = usePushNotifications()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleEnable = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const perm = await requestPermission()
      
      if (perm === 'granted') {
        await subscribe()
        setMessage('Push notifications enabled!')
      } else {
        setMessage('Permission denied. Please enable in browser settings.')
      }
    } catch (error) {
      setMessage('Failed to enable notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      await unsubscribe()
      setMessage('Push notifications disabled')
    } catch (error) {
      setMessage('Failed to disable notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const success = await sendTestNotification()
      if (success) {
        setMessage('Test notification sent!')
      } else {
        setMessage('Failed to send test notification')
      }
    } catch (error) {
      setMessage('Failed to send test notification')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-[#1a1a2e] rounded-lg border border-[#2d3748]">
        <div className="flex items-center gap-3 text-gray-400">
          <BellOff className="w-5 h-5" />
          <span className="text-sm">Push notifications are not supported in this browser</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-6 h-6 text-[#e94560]" />
        <div>
          <h3 className="font-bold text-white">Push Notifications</h3>
          <p className="text-sm text-gray-400">Get real-time updates about your deliveries</p>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4 p-3 bg-[#0f0f17] rounded-lg border border-[#2d3748]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Status:</span>
          <div className="flex items-center gap-2">
            {permission === 'granted' ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-semibold">Enabled</span>
              </>
            ) : permission === 'denied' ? (
              <>
                <X className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500 font-semibold">Denied</span>
              </>
            ) : (
              <span className="text-sm text-gray-400 font-semibold">Not Enabled</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {permission !== 'granted' ? (
          <button
            onClick={handleEnable}
            disabled={isLoading || permission === 'denied'}
            className="flex-1 px-4 py-2 bg-[#e94560] hover:bg-[#d63d56] disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            {isLoading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        ) : (
          <>
            <button
              onClick={handleTest}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#e94560] hover:bg-[#d63d56] disabled:bg-gray-600 rounded-lg font-semibold text-sm transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Test'}
            </button>
            <button
              onClick={handleDisable}
              disabled={isLoading}
              className="px-4 py-2 border border-[#2d3748] hover:border-[#e94560] disabled:border-gray-600 rounded-lg text-sm transition-colors"
            >
              Disable
            </button>
          </>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.includes('enabled') || message.includes('sent') 
            ? 'bg-green-600/20 text-green-500' 
            : 'bg-red-600/20 text-red-500'
        }`}>
          {message}
        </div>
      )}

      {/* Help text */}
      {permission === 'denied' && (
        <p className="mt-4 text-xs text-gray-500">
          To enable notifications, please update your browser settings and refresh the page.
        </p>
      )}
    </div>
  )
}
