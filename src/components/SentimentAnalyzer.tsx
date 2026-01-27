'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, ThumbsUp, ThumbsDown, Meh } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SentimentAnalyzer() {
  const [sentiment, setSentiment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSentiment()
  }, [])

  const fetchSentiment = async () => {
    try {
      const response = await fetch('/api/ai/sentiment-analysis')
      const data = await response.json()
      if (data.success) setSentiment(data.sentiment)
    } catch (error) {
      console.error('Sentiment analysis error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentIcon = (score: string) => {
    if (score === 'positive') return <ThumbsUp className="h-4 w-4 text-green-500" />
    if (score === 'negative') return <ThumbsDown className="h-4 w-4 text-red-500" />
    return <Meh className="h-4 w-4 text-gray-500" />
  }

  const getSentimentColor = (score: string) => {
    if (score === 'positive') return 'text-green-600'
    if (score === 'negative') return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <CardTitle>Customer Sentiment</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Analyzing feedback...</p>
        ) : sentiment ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Sentiment</span>
              <div className="flex items-center gap-2">
                {getSentimentIcon(sentiment.overall)}
                <Badge variant={sentiment.overall === 'positive' ? 'default' : sentiment.overall === 'negative' ? 'destructive' : 'secondary'}>
                  {sentiment.overall}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-500/10 rounded">
                <p className="text-2xl font-bold text-green-600">{sentiment.positive || 0}%</p>
                <p className="text-xs text-muted-foreground">Positive</p>
              </div>
              <div className="p-2 bg-gray-500/10 rounded">
                <p className="text-2xl font-bold text-gray-600">{sentiment.neutral || 0}%</p>
                <p className="text-xs text-muted-foreground">Neutral</p>
              </div>
              <div className="p-2 bg-red-500/10 rounded">
                <p className="text-2xl font-bold text-red-600">{sentiment.negative || 0}%</p>
                <p className="text-xs text-muted-foreground">Negative</p>
              </div>
            </div>
            {sentiment.insights && sentiment.insights.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Key Insights:</p>
                {sentiment.insights.map((insight: string, idx: number) => (
                  <p key={idx} className="text-xs text-muted-foreground">• {insight}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </CardContent>
    </Card>
  )
}
