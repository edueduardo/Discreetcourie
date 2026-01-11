'use client'

import { useState } from 'react'
import { Lock, Send, Shield, Clock, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  content: string
  sender: 'client' | 'admin'
  timestamp: string
  read: boolean
  encrypted: boolean
}

interface SecureChatProps {
  taskId: string
  messages?: Message[]
  onSendMessage?: (content: string) => void
  userType: 'client' | 'admin'
}

// Demo messages
const demoMessages: Message[] = [
  {
    id: '1',
    content: 'I need to pick up some items from the pharmacy. Can you help?',
    sender: 'client',
    timestamp: '10:30 AM',
    read: true,
    encrypted: true
  },
  {
    id: '2',
    content: 'Of course. What items do you need and which pharmacy?',
    sender: 'admin',
    timestamp: '10:32 AM',
    read: true,
    encrypted: true
  },
  {
    id: '3',
    content: 'I\'ll send the list privately. It\'s at CVS on High Street.',
    sender: 'client',
    timestamp: '10:35 AM',
    read: true,
    encrypted: true
  },
  {
    id: '4',
    content: 'Got it. I\'ll be there within the hour. No questions, complete discretion.',
    sender: 'admin',
    timestamp: '10:36 AM',
    read: false,
    encrypted: true
  }
]

export function SecureChat({ taskId, messages = demoMessages, onSendMessage, userType }: SecureChatProps) {
  const [newMessage, setNewMessage] = useState('')

  const handleSend = () => {
    if (!newMessage.trim()) return
    onSendMessage?.(newMessage)
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center">
              <Lock className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Secure Chat</h3>
              <p className="text-green-400 text-xs flex items-center gap-1">
                <Shield className="h-3 w-3" />
                End-to-end encrypted
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-950/50 border-green-800 text-green-400">
            <Lock className="h-3 w-3 mr-1" />
            Private
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Encryption notice */}
        <div className="flex justify-center">
          <div className="bg-slate-800/50 rounded-full px-4 py-2 flex items-center gap-2">
            <Lock className="h-3 w-3 text-slate-500" />
            <span className="text-slate-500 text-xs">Messages are encrypted and may auto-delete</span>
          </div>
        </div>

        {messages.map((message) => {
          const isOwn = message.sender === userType
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
                <div
                  className={`
                    rounded-2xl px-4 py-2
                    ${isOwn 
                      ? 'bg-blue-600 text-white rounded-br-md' 
                      : 'bg-slate-700 text-white rounded-bl-md'
                    }
                  `}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                  <span className="text-slate-500 text-xs">{message.timestamp}</span>
                  {message.encrypted && (
                    <Lock className="h-3 w-3 text-slate-600" />
                  )}
                  {isOwn && (
                    message.read 
                      ? <CheckCheck className="h-3 w-3 text-blue-400" />
                      : <Check className="h-3 w-3 text-slate-500" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a secure message..."
              className="bg-slate-800 border-slate-600 text-white pr-10"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>
          <Button 
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-slate-600 text-xs mt-2 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Your messages are encrypted and private
        </p>
      </div>
    </div>
  )
}
