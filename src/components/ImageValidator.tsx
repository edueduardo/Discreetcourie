'use client'

import { useState } from 'react'
import { Camera, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ImageValidatorProps {
  imageUrl?: string
  onValidation?: (result: any) => void
}

export function ImageValidator({ imageUrl, onValidation }: ImageValidatorProps) {
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const validateImage = async (url: string) => {
    setValidating(true)
    try {
      const response = await fetch('/api/ai/image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      })
      const data = await response.json()
      if (data.success) {
        setResult(data.validation)
        if (onValidation) onValidation(data.validation)
      }
    } catch (error) {
      console.error('Image validation error:', error)
    } finally {
      setValidating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-base">AI Image Validation</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {validating ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Validating image...</span>
          </div>
        ) : result ? (
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${result.valid ? 'text-green-600' : 'text-red-600'}`}>
              {result.valid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {result.valid ? 'Valid delivery proof' : 'Invalid image'}
              </span>
            </div>
            {result.confidence && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(result.confidence * 100)}% confidence
              </Badge>
            )}
            {result.issues && result.issues.length > 0 && (
              <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-600">
                Issues: {result.issues.join(', ')}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Upload an image to validate</p>
        )}
      </CardContent>
    </Card>
  )
}
