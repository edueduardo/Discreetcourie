'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, AlertCircle, FileText, Lock, Eye, Download } from 'lucide-react'
import { generateComplianceReport, ComplianceStatus, SECURITY_HEADERS, DATA_RETENTION } from '@/lib/gdpr-compliance'

export default function ComplianceDashboard() {
  const [status, setStatus] = useState<ComplianceStatus | null>(null)

  useEffect(() => {
    const report = generateComplianceReport()
    setStatus(report)
  }, [])

  if (!status) return <div>Loading compliance status...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-[#e94560]" />
        <div>
          <h2 className="text-2xl font-bold">Compliance & Security Dashboard</h2>
          <p className="text-gray-400">GDPR, SOC2, and Security Status</p>
        </div>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* GDPR Compliance */}
        <div className="p-6 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#e94560]" />
              GDPR Compliance
            </h3>
            {status.gdprCompliant ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 text-green-500 rounded-full text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Compliant
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-500 rounded-full text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                Issues Found
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Privacy Policy Published
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Cookie Consent Banner Active
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Data Export API Available
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Right to be Forgotten Implemented
            </div>
          </div>
        </div>

        {/* SOC2 Compliance */}
        <div className="p-6 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#e94560]" />
              SOC2 Compliance
            </h3>
            {status.soc2Compliant ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 text-green-500 rounded-full text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Compliant
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-500 rounded-full text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                Issues Found
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Audit Logs Enabled
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Data Encryption (SSL/TLS)
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Access Control Implemented
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Security Headers Configured
            </div>
          </div>
        </div>
      </div>

      {/* Security Headers */}
      <div className="p-6 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#e94560]" />
          Security Headers
        </h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          {Object.entries(SECURITY_HEADERS).map(([header, value]) => (
            <div key={header} className="p-3 bg-[#0f0f17] rounded-lg border border-[#2d3748]">
              <div className="font-semibold text-white mb-1">{header}</div>
              <div className="text-gray-400 text-xs truncate">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Retention Policies */}
      <div className="p-6 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#e94560]" />
          Data Retention Policies
        </h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          {Object.entries(DATA_RETENTION).map(([dataType, days]) => (
            <div key={dataType} className="flex items-center justify-between p-3 bg-[#0f0f17] rounded-lg border border-[#2d3748]">
              <span className="capitalize text-white">{dataType.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-gray-400">{days} days ({Math.floor(days / 365)} years)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Issues & Recommendations */}
      {(status.issues.length > 0 || status.recommendations.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Issues */}
          {status.issues.length > 0 && (
            <div className="p-6 bg-[#1a1a2e] rounded-xl border border-red-600/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                Issues ({status.issues.length})
              </h3>
              <ul className="space-y-2 text-sm">
                {status.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2 text-red-400">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {status.recommendations.length > 0 && (
            <div className="p-6 bg-[#1a1a2e] rounded-xl border border-blue-600/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-500">
                <CheckCircle className="w-5 h-5" />
                Recommendations ({status.recommendations.length})
              </h3>
              <ul className="space-y-2 text-sm">
                {status.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-blue-400">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Last Audit */}
      <div className="p-4 bg-[#0f0f17] rounded-lg border border-[#2d3748] text-sm text-gray-400">
        Last audit: {new Date(status.lastAudit).toLocaleString()}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="px-6 py-3 bg-[#e94560] hover:bg-[#d63d56] rounded-lg font-semibold transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Compliance Report
        </button>
        <button className="px-6 py-3 border border-[#2d3748] hover:border-[#e94560] rounded-lg font-semibold transition-colors">
          Run Security Audit
        </button>
      </div>
    </div>
  )
}
