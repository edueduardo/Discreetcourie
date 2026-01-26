'use client'

import { useState, useEffect } from 'react'
import { X, Shield, Cookie } from 'lucide-react'
import { getConsent, saveConsent, COOKIE_CATEGORIES, ConsentPreferences } from '@/lib/gdpr-compliance'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: '',
    version: '1.0'
  })

  useEffect(() => {
    const consent = getConsent()
    
    // Show banner if no consent given yet
    if (!consent.timestamp) {
      setShowBanner(true)
    }
    
    setPreferences(consent)
  }, [])

  const handleAcceptAll = () => {
    const newPreferences: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    saveConsent(newPreferences)
    setShowBanner(false)
  }

  const handleRejectAll = () => {
    const newPreferences: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    saveConsent(newPreferences)
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    saveConsent(preferences)
    setShowBanner(false)
    setShowDetails(false)
  }

  const togglePreference = (category: 'analytics' | 'marketing') => {
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e] border-t border-[#2d3748] shadow-2xl">
      <div className="max-w-7xl mx-auto p-6">
        {!showDetails ? (
          // Simple Banner
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-[#e94560] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-white mb-1">We use cookies</h3>
                <p className="text-sm text-gray-400">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                  By clicking "Accept All", you consent to our use of cookies.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-sm border border-[#2d3748] rounded-lg hover:border-[#e94560] transition-colors"
              >
                Customize
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm border border-[#2d3748] rounded-lg hover:border-[#e94560] transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 text-sm bg-[#e94560] hover:bg-[#d63d56] rounded-lg font-semibold transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Detailed Preferences
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#e94560]" />
                <h3 className="font-bold text-white text-lg">Cookie Preferences</h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-[#2d3748] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Essential Cookies */}
              <div className="p-4 bg-[#0f0f17] rounded-lg border border-[#2d3748]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">
                      {COOKIE_CATEGORIES.essential.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {COOKIE_CATEGORIES.essential.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="px-3 py-1 bg-green-600/20 text-green-500 text-xs font-semibold rounded-full">
                      Always Active
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Cookies: {COOKIE_CATEGORIES.essential.cookies.join(', ')}
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="p-4 bg-[#0f0f17] rounded-lg border border-[#2d3748]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">
                      {COOKIE_CATEGORIES.analytics.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {COOKIE_CATEGORIES.analytics.description}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePreference('analytics')}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.analytics ? 'bg-[#e94560]' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Cookies: {COOKIE_CATEGORIES.analytics.cookies.join(', ')}
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="p-4 bg-[#0f0f17] rounded-lg border border-[#2d3748]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">
                      {COOKIE_CATEGORIES.marketing.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {COOKIE_CATEGORIES.marketing.description}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePreference('marketing')}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.marketing ? 'bg-[#e94560]' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Cookies: {COOKIE_CATEGORIES.marketing.cookies.join(', ')}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleRejectAll}
                className="px-6 py-2 text-sm border border-[#2d3748] rounded-lg hover:border-[#e94560] transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-6 py-2 text-sm bg-[#e94560] hover:bg-[#d63d56] rounded-lg font-semibold transition-colors"
              >
                Save Preferences
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Read our <a href="/privacy" className="text-[#e94560] hover:underline">Privacy Policy</a> and{' '}
              <a href="/terms" className="text-[#e94560] hover:underline">Terms of Service</a> for more information.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
