'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserCheck, AlertTriangle, Clock, CheckCircle, XCircle, Eye, UserPlus } from 'lucide-react'

// Demo data
const demoVettingRecords = [
  {
    id: '1',
    client_id: '1',
    client_code: 'CIPHER-9921',
    client_name: 'Potential VIP 1',
    status: 'pending',
    source: 'Referral from SHADOW-7842',
    referral_code: 'REF-SHADOW',
    risk_assessment: 'low',
    red_flags: [],
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: '2',
    client_id: '2',
    client_code: 'PHANTOM-5543',
    client_name: 'Potential VIP 2',
    status: 'in_review',
    source: 'Direct inquiry',
    risk_assessment: 'medium',
    red_flags: ['Inconsistent information', 'No referral'],
    interview_notes: 'Seems legitimate but needs verification. Claims to be a lawyer.',
    created_at: '2026-01-08T00:00:00Z',
  },
  {
    id: '3',
    client_id: '3',
    client_code: 'GHOST-3391',
    client_name: 'Approved Client',
    status: 'approved',
    source: 'Referral from partner law firm',
    referral_code: 'REF-LAWFIRM',
    risk_assessment: 'low',
    red_flags: [],
    reviewed_by: 'Eduardo',
    reviewed_at: '2026-01-05T00:00:00Z',
    decision_notes: 'Verified attorney. Excellent referral.',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '4',
    client_id: '4',
    client_code: 'ECHO-1122',
    client_name: 'Rejected Client',
    status: 'rejected',
    source: 'Cold call',
    risk_assessment: 'high',
    red_flags: ['Suspicious questions about legal limits', 'Refused to provide identity', 'Asked about illegal activities'],
    reviewed_by: 'Eduardo',
    reviewed_at: '2026-01-03T00:00:00Z',
    decision_notes: 'Too many red flags. Potential legal risk.',
    created_at: '2025-12-28T00:00:00Z',
  },
]

export default function VettingPage() {
  const [records, setRecords] = useState(demoVettingRecords)
  const [selectedRecord, setSelectedRecord] = useState<typeof demoVettingRecords[0] | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)

  const pending = records.filter((r) => r.status === 'pending')
  const inReview = records.filter((r) => r.status === 'in_review')
  const approved = records.filter((r) => r.status === 'approved')
  const rejected = records.filter((r) => r.status === 'rejected')

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: JSX.Element }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      in_review: { variant: 'default', icon: <Eye className="h-3 w-3 mr-1" /> },
      approved: { variant: 'outline', icon: <CheckCircle className="h-3 w-3 mr-1 text-green-500" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      probation: { variant: 'secondary', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    }
    const { variant, icon } = config[status] || config.pending
    return (
      <Badge variant={variant} className="flex items-center">
        {icon}
        {status}
      </Badge>
    )
  }

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[risk] || colors.unknown}`}>
        {risk} risk
      </span>
    )
  }

  const openReview = (record: typeof demoVettingRecords[0]) => {
    setSelectedRecord(record)
    setIsReviewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-purple-500" />
            Santuário - VIP Vetting
          </h1>
          <p className="text-muted-foreground">
            "Nem todos entram aqui" - VIP client evaluation process
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold">{pending.length}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-3xl font-bold">{inReview.length}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-3xl font-bold">{approved.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-3xl font-bold">{rejected.length}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Vetting Queue */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Vetting Queue</h2>
        <div className="space-y-4">
          {records.map((record) => (
            <Card
              key={record.id}
              className={`p-4 ${
                record.status === 'pending' ? 'border-yellow-500' :
                record.status === 'in_review' ? 'border-blue-500' :
                record.status === 'rejected' ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg">{record.client_code}</span>
                    {getStatusBadge(record.status)}
                    {getRiskBadge(record.risk_assessment)}
                  </div>

                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Source:</span> {record.source}
                    {record.referral_code && (
                      <span className="ml-2">
                        <Badge variant="outline" className="text-xs">
                          {record.referral_code}
                        </Badge>
                      </span>
                    )}
                  </div>

                  {record.red_flags && record.red_flags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {record.red_flags.map((flag, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {record.interview_notes && (
                    <div className="text-sm bg-gray-50 p-2 rounded mt-2">
                      <span className="font-medium">Notes:</span> {record.interview_notes}
                    </div>
                  )}

                  {record.decision_notes && (
                    <div className={`text-sm p-2 rounded mt-2 ${
                      record.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <span className="font-medium">Decision:</span> {record.decision_notes}
                      <div className="text-xs text-muted-foreground mt-1">
                        By {record.reviewed_by} on {new Date(record.reviewed_at!).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {(record.status === 'pending' || record.status === 'in_review') && (
                    <>
                      <Button size="sm" onClick={() => openReview(record)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                      <Button size="sm" variant="outline" className="text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {record.status === 'approved' && (
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Application: {selectedRecord?.client_code}</DialogTitle>
            <DialogDescription>
              Evaluate this VIP candidate for entry into the Santuário
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && <ReviewForm record={selectedRecord} onClose={() => setIsReviewDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReviewForm({ record, onClose }: { record: any; onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Client Code</Label>
          <Input value={record.client_code} disabled />
        </div>
        <div>
          <Label>Source</Label>
          <Input value={record.source} disabled />
        </div>
      </div>

      <div>
        <Label>Risk Assessment</Label>
        <Select defaultValue={record.risk_assessment}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Interview Notes</Label>
        <Textarea
          defaultValue={record.interview_notes}
          placeholder="Document your conversation and observations..."
          rows={4}
        />
      </div>

      <div>
        <Label>Red Flags (one per line)</Label>
        <Textarea
          defaultValue={record.red_flags?.join('\n')}
          placeholder="List any concerns..."
          rows={3}
        />
      </div>

      <div>
        <Label>Decision Notes</Label>
        <Textarea
          placeholder="Explain your decision..."
          rows={3}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Save & Continue Later
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="destructive">
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button type="button" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve
          </Button>
        </div>
      </div>
    </form>
  )
}
