/**
 * Audit Trail utilities for Human Vault
 *
 * Features:
 * - Log all access attempts
 * - Track who, when, where accessed files
 * - Geolocation tracking
 * - IP address logging
 * - Access analytics
 */

import { createClient } from '@/lib/supabase/client'

export interface AccessLogData {
  vault_file_id: string
  accessed_by?: string | null
  access_type: 'view' | 'download' | 'preview' | 'nda_view'
  ip_address: string
  user_agent?: string
  geolocation?: {
    lat?: number
    lon?: number
    city?: string
    country?: string
  }
  referrer?: string
  nda_signed?: boolean
  nda_signature_id?: string | null
  access_token_used?: string
  password_attempted?: boolean
  password_correct?: boolean
  access_granted: boolean
  denial_reason?: string | null
  http_status_code?: number
}

export interface AccessLog {
  id: string
  vault_file_id: string
  accessed_by: string | null
  access_type: string
  ip_address: string
  user_agent: string | null
  geolocation: any
  referrer: string | null
  nda_signed: boolean
  nda_signature_id: string | null
  access_token_used: string | null
  password_attempted: boolean
  password_correct: boolean
  access_granted: boolean
  denial_reason: string | null
  http_status_code: number | null
  created_at: string
}

/**
 * Get Supabase client
 */
function getSupabase() {
  return createClient()
}

/**
 * Get client IP address (from request or browser)
 */
export async function getClientIp(): Promise<string> {
  try {
    // Try to get IP from ipify API
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Get geolocation from IP address
 */
export async function getGeolocation(ip: string): Promise<any> {
  try {
    // Use free IP geolocation API
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await response.json()

    return {
      lat: data.latitude,
      lon: data.longitude,
      city: data.city,
      country: data.country_name
    }
  } catch {
    return null
  }
}

/**
 * Get user agent
 */
export function getUserAgent(): string {
  return typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
}

/**
 * Get referrer
 */
export function getReferrer(): string | undefined {
  return typeof document !== 'undefined' ? document.referrer : undefined
}

/**
 * Log access attempt
 */
export async function logAccess(data: AccessLogData): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('vault_access_logs')
    .insert([data])

  if (error) {
    console.error('Failed to log access:', error)
    // Don't throw - we don't want to block access if logging fails
  }
}

/**
 * Log successful access
 */
export async function logSuccessfulAccess(
  vaultFileId: string,
  accessType: 'view' | 'download' | 'preview' | 'nda_view',
  userId?: string,
  ndaSignatureId?: string
): Promise<void> {
  const ip = await getClientIp()
  const geolocation = await getGeolocation(ip)

  await logAccess({
    vault_file_id: vaultFileId,
    accessed_by: userId || null,
    access_type: accessType,
    ip_address: ip,
    user_agent: getUserAgent(),
    geolocation,
    referrer: getReferrer(),
    nda_signed: !!ndaSignatureId,
    nda_signature_id: ndaSignatureId || null,
    password_attempted: true,
    password_correct: true,
    access_granted: true,
    http_status_code: 200
  })
}

/**
 * Log failed access
 */
export async function logFailedAccess(
  vaultFileId: string,
  accessType: 'view' | 'download' | 'preview' | 'nda_view',
  denialReason: string,
  passwordAttempted: boolean = false,
  userId?: string
): Promise<void> {
  const ip = await getClientIp()
  const geolocation = await getGeolocation(ip)

  await logAccess({
    vault_file_id: vaultFileId,
    accessed_by: userId || null,
    access_type: accessType,
    ip_address: ip,
    user_agent: getUserAgent(),
    geolocation,
    referrer: getReferrer(),
    nda_signed: false,
    password_attempted: passwordAttempted,
    password_correct: false,
    access_granted: false,
    denial_reason: denialReason,
    http_status_code: 403
  })
}

/**
 * Get access logs for a vault file
 */
export async function getAccessLogs(vaultFileId: string): Promise<AccessLog[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('vault_access_logs')
    .select('*')
    .eq('vault_file_id', vaultFileId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get access logs:', error)
    throw new Error(`Failed to get access logs: ${error.message}`)
  }

  return data || []
}

/**
 * Get access logs for a user
 */
export async function getUserAccessLogs(userId: string): Promise<AccessLog[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('vault_access_logs')
    .select('*')
    .eq('accessed_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get user access logs:', error)
    throw new Error(`Failed to get user access logs: ${error.message}`)
  }

  return data || []
}

/**
 * Get access statistics for a file
 */
export async function getAccessStats(vaultFileId: string) {
  const logs = await getAccessLogs(vaultFileId)

  const stats = {
    total_attempts: logs.length,
    successful_accesses: logs.filter(l => l.access_granted).length,
    failed_accesses: logs.filter(l => !l.access_granted).length,
    downloads: logs.filter(l => l.access_type === 'download' && l.access_granted).length,
    previews: logs.filter(l => l.access_type === 'preview' && l.access_granted).length,
    unique_ips: new Set(logs.map(l => l.ip_address)).size,
    unique_users: new Set(logs.filter(l => l.accessed_by).map(l => l.accessed_by)).size,
    first_access: logs.length > 0 ? logs[logs.length - 1].created_at : null,
    last_access: logs.length > 0 ? logs[0].created_at : null,
    access_by_country: {} as Record<string, number>,
    access_by_type: {
      view: logs.filter(l => l.access_type === 'view').length,
      download: logs.filter(l => l.access_type === 'download').length,
      preview: logs.filter(l => l.access_type === 'preview').length,
      nda_view: logs.filter(l => l.access_type === 'nda_view').length
    }
  }

  // Count accesses by country
  logs.forEach(log => {
    const country = log.geolocation?.country || 'Unknown'
    stats.access_by_country[country] = (stats.access_by_country[country] || 0) + 1
  })

  return stats
}

/**
 * Update file access timestamp
 */
export async function updateFileAccessTimestamp(vaultFileId: string): Promise<void> {
  const supabase = getSupabase()

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('vault_files')
    .update({
      last_accessed_at: now,
      updated_at: now
    })
    .eq('id', vaultFileId)

  if (error) {
    console.error('Failed to update access timestamp:', error)
  }
}

/**
 * Increment download count
 */
export async function incrementDownloadCount(vaultFileId: string): Promise<void> {
  const supabase = getSupabase()

  // Get current count
  const { data, error: fetchError } = await supabase
    .from('vault_files')
    .select('download_count, first_accessed_at')
    .eq('id', vaultFileId)
    .single()

  if (fetchError) {
    console.error('Failed to get download count:', fetchError)
    return
  }

  const now = new Date().toISOString()
  const updates: any = {
    download_count: (data?.download_count || 0) + 1,
    last_accessed_at: now,
    updated_at: now
  }

  // Set first_accessed_at if this is the first download
  if (!data?.first_accessed_at) {
    updates.first_accessed_at = now
  }

  const { error: updateError } = await supabase
    .from('vault_files')
    .update(updates)
    .eq('id', vaultFileId)

  if (updateError) {
    console.error('Failed to increment download count:', updateError)
  }
}

/**
 * Check if file has exceeded max downloads
 */
export async function hasExceededMaxDownloads(vaultFileId: string): Promise<boolean> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('vault_files')
    .select('download_count, max_downloads, single_download')
    .eq('id', vaultFileId)
    .single()

  if (error) {
    console.error('Failed to check download count:', error)
    return false
  }

  if (!data) return false

  // If single_download is true, check if any downloads have occurred
  if (data.single_download && data.download_count > 0) {
    return true
  }

  // Check against max_downloads
  if (data.max_downloads && data.download_count >= data.max_downloads) {
    return true
  }

  return false
}

/**
 * Export access logs as CSV
 */
export function exportAccessLogsAsCSV(logs: AccessLog[]): string {
  const headers = [
    'Timestamp',
    'Access Type',
    'User ID',
    'IP Address',
    'Country',
    'City',
    'NDA Signed',
    'Access Granted',
    'Denial Reason'
  ]

  const rows = logs.map(log => [
    log.created_at,
    log.access_type,
    log.accessed_by || 'Anonymous',
    log.ip_address,
    log.geolocation?.country || 'Unknown',
    log.geolocation?.city || 'Unknown',
    log.nda_signed ? 'Yes' : 'No',
    log.access_granted ? 'Yes' : 'No',
    log.denial_reason || ''
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csv
}
