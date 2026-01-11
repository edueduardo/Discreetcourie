'use client'

import { EyeOff, Clock, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NoTraceIndicatorProps {
  enabled: boolean
  autoDeleteAt?: string
  compact?: boolean
}

export function NoTraceIndicator({ enabled, autoDeleteAt, compact = false }: NoTraceIndicatorProps) {
  if (!enabled) return null

  const getTimeRemaining = () => {
    if (!autoDeleteAt) return 'After completion'
    const deleteDate = new Date(autoDeleteAt)
    const now = new Date()
    const diffMs = deleteDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 'Deleting soon...'
    if (diffDays === 1) return '1 day left'
    return `${diffDays} days left`
  }

  if (compact) {
    return (
      <Badge variant="outline" className="bg-red-950/50 border-red-800 text-red-400 gap-1">
        <EyeOff className="h-3 w-3" />
        No Trace
      </Badge>
    )
  }

  return (
    <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-red-900/50 flex items-center justify-center shrink-0">
          <EyeOff className="h-5 w-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-red-400 font-semibold flex items-center gap-2">
            No-Trace Mode Active
            <Trash2 className="h-4 w-4" />
          </h4>
          <p className="text-red-300/70 text-sm mt-1">
            All records, photos, and messages will be permanently deleted 7 days after task completion.
          </p>
          {autoDeleteAt && (
            <div className="flex items-center gap-1 mt-2 text-red-400 text-sm">
              <Clock className="h-3 w-3" />
              <span>{getTimeRemaining()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function NoTraceToggle({ 
  enabled, 
  onChange 
}: { 
  enabled: boolean
  onChange: (enabled: boolean) => void 
}) {
  return (
    <div 
      onClick={() => onChange(!enabled)}
      className={`
        cursor-pointer border rounded-lg p-4 transition-all
        ${enabled 
          ? 'bg-red-950/30 border-red-800' 
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            h-10 w-10 rounded-full flex items-center justify-center
            ${enabled ? 'bg-red-900/50' : 'bg-slate-700'}
          `}>
            <EyeOff className={`h-5 w-5 ${enabled ? 'text-red-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <h4 className={`font-semibold ${enabled ? 'text-red-400' : 'text-white'}`}>
              No-Trace Mode
            </h4>
            <p className="text-slate-400 text-sm">
              Auto-delete all records 7 days after completion
            </p>
          </div>
        </div>
        <div className={`
          w-12 h-6 rounded-full transition-colors relative
          ${enabled ? 'bg-red-600' : 'bg-slate-600'}
        `}>
          <div className={`
            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-7' : 'translate-x-1'}
          `} />
        </div>
      </div>
    </div>
  )
}
