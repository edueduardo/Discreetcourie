'use client'

import { useState } from 'react'
import { Sparkles, Copy, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export function ContentGenerator() {
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [contentType, setContentType] = useState<'email' | 'social' | 'blog'>('email')

  const generateContent = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai/content-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contentType }),
      })
      const data = await response.json()
      if (data.success) setContent(data.content)
    } catch (error) {
      console.error('Content generation error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <CardTitle>AI Content Generator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant={contentType === 'email' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setContentType('email')}
          >
            Email
          </Button>
          <Button
            variant={contentType === 'social' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setContentType('social')}
          >
            Social
          </Button>
          <Button
            variant={contentType === 'blog' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setContentType('blog')}
          >
            Blog
          </Button>
        </div>
        <Button onClick={generateContent} disabled={generating} className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          {generating ? 'Generating...' : 'Generate Content'}
        </Button>
        {content && (
          <div className="space-y-2">
            <Textarea value={content} readOnly rows={8} className="text-sm" />
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="w-full">
              {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
