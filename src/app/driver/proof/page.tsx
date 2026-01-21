'use client'

import { useEffect, useState, useRef } from 'react'
import { Camera, Upload, CheckCircle, X, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function DriverProof() {
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Get current location for proof
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { /* Location unavailable */ }
      )
    }
  }, [])

  function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhoto(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function uploadProof() {
    if (!photo || !trackingCode) return

    setUploading(true)
    try {
      // In real app, upload to storage and get URL
      const res = await fetch(`/api/orders/${trackingCode}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: photo, // In production: upload to S3/Cloudinary first
          recipient_name: recipientName,
          notes: notes,
          gps_latitude: location?.lat,
          gps_longitude: location?.lng,
          proof_type: 'delivery'
        })
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          setPhoto(null)
          setTrackingCode('')
          setRecipientName('')
          setNotes('')
          setSuccess(false)
        }, 3000)
      }
    } catch (error) {

    } finally {
      setUploading(false)
    }
  }

  function clearPhoto() {
    setPhoto(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Camera /> Photo Proof
      </h1>

      {success ? (
        <Card className="bg-green-900/30 border-green-700">
          <CardContent className="p-6 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-2" size={48} />
            <p className="text-green-400 font-medium">Proof Uploaded Successfully!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tracking Code Input */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <label className="text-sm text-slate-400 block mb-2">Tracking Code</label>
              <Input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="DC-XXXXXX"
                className="bg-slate-700 border-slate-600 font-mono"
              />
            </CardContent>
          </Card>

          {/* Photo Capture */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              {photo ? (
                <div className="relative">
                  <img src={photo} alt="Proof" className="w-full rounded-lg" />
                  <button
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 bg-red-600 p-1 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Camera className="mx-auto text-slate-400 mb-2" size={48} />
                  <p className="text-slate-400">Tap to take photo</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Recipient Info */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Recipient Name (optional)</label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Who received it?"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Notes (optional)</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Left at door, handed to..."
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {location && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin size={12} />
              Location attached: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}

          {/* Upload Button */}
          <Button
            onClick={uploadProof}
            disabled={!photo || !trackingCode || uploading}
            className="w-full bg-green-600 hover:bg-green-700 py-6"
          >
            {uploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload size={20} className="mr-2" /> Upload Proof
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )
}
