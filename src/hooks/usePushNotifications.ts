'use client'

import { useState, useEffect } from 'react'

export type NotificationPermission = 'default' | 'granted' | 'denied'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission as NotificationPermission)
    }
  }, [])

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported')
    }

    const result = await Notification.requestPermission()
    setPermission(result as NotificationPermission)
    return result as NotificationPermission
  }

  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Check if already subscribed
      let sub = await registration.pushManager.getSubscription()
      
      if (!sub) {
        // Subscribe to push notifications
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8-fTt3UdaijKDpOtN8QjwVrSzwzjFxGCGiWJdgG6Gvq0dIJNZPGYqU'
        
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
        })
      }

      setSubscription(sub)
      
      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      })

      return sub
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return false

    try {
      await subscription.unsubscribe()
      
      // Remove subscription from server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      })

      setSubscription(null)
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  const sendTestNotification = async () => {
    if (!isSupported || permission !== 'granted') {
      return false
    }

    try {
      await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      return true
    } catch (error) {
      console.error('Failed to send test notification:', error)
      return false
    }
  }

  return {
    permission,
    subscription,
    isSupported,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
