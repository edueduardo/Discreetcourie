'use client'

import { useState } from 'react'
import { Sparkles, Send, X, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Suggestion {
  type: 'insight' | 'warning' | 'action'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

interface Message {
  id: string
  type: 'user' | 'copilot' | 'suggestion'
  content: string
  suggestions?: Suggestion[]
  timestamp: Date
}

export function AdminCopilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'copilot',
      content: '👋 Olá! Sou seu Copilot AI. Posso ajudar com análises, insights e automação de tarefas administrativas.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const quickActions = [
    { label: 'Analisar entregas hoje', query: 'Analise as entregas de hoje e me dê insights' },
    { label: 'Identificar problemas', query: 'Quais são os principais problemas que preciso resolver?' },
    { label: 'Sugerir otimizações', query: 'Sugira otimizações para melhorar a operação' },
    { label: 'Relatório financeiro', query: 'Crie um resumo do desempenho financeiro' },
  ]

  const handleSend = async (message?: string) => {
    const textToSend = message || input
    if (!textToSend.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: messages.slice(-5), // Last 5 messages for context
        }),
      })

      const data = await response.json()

      if (data.success) {
        const copilotMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: data.suggestions ? 'suggestion' : 'copilot',
          content: data.message,
          suggestions: data.suggestions,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, copilotMessage])
      }
    } catch (error) {
      console.error('Copilot error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'copilot',
        content: 'Desculpe, ocorreu um erro. Tente novamente.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="fixed bottom-24 right-6 h-12 px-4 shadow-lg gap-2"
      >
        <Sparkles className="h-4 w-4" />
        AI Copilot
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-24 right-6 w-[500px] h-[650px] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Admin Copilot</h3>
            <p className="text-xs opacity-90">Seu assistente inteligente</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2">Ações rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              onClick={() => handleSend(action.query)}
              disabled={isLoading}
              className="text-xs"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              {message.type === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2 flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="ml-11 space-y-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <Card key={idx} className="p-3 border-l-4 border-l-primary">
                          <div className="flex items-start gap-2">
                            {suggestion.type === 'insight' && (
                              <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                            )}
                            {suggestion.type === 'warning' && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            )}
                            {suggestion.type === 'action' && (
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium">{suggestion.title}</h4>
                                <Badge
                                  variant={
                                    suggestion.priority === 'high'
                                      ? 'destructive'
                                      : suggestion.priority === 'medium'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {suggestion.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {suggestion.description}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <p className="text-sm">Analisando...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte algo ao Copilot..."
            disabled={isLoading}
          />
          <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
