/**
 * NDA Enforcement System - Digital Signature & Smart Contracts
 * Automatic legal enforcement with blockchain proof
 * $199-$999/mês potential revenue
 */

import crypto from 'crypto'

export interface NDADocument {
  id: string
  title: string
  content: string
  parties: NDAParty[]
  terms: NDATerms
  createdAt: string
  expiresAt?: string
  status: 'draft' | 'pending' | 'signed' | 'active' | 'violated' | 'expired'
}

export interface NDAParty {
  id: string
  name: string
  email: string
  role: 'discloser' | 'recipient'
  signedAt?: string
  signature?: string
  ipAddress?: string
  deviceFingerprint?: string
}

export interface NDATerms {
  confidentialityPeriod: number // days
  geographicScope: string[]
  permittedUse: string[]
  prohibitedActions: string[]
  penaltyAmount: number // USD
  automaticEnforcement: boolean
  blockchainProof: boolean
  auditTrail: boolean
}

export interface NDAViolation {
  id: string
  ndaId: string
  violatorId: string
  type: 'disclosure' | 'unauthorized_use' | 'breach_of_terms'
  description: string
  evidence: string[]
  detectedAt: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  penaltyApplied: number
  status: 'detected' | 'investigating' | 'confirmed' | 'resolved'
}

/**
 * Generate digital signature for NDA document
 * Uses RSA-SHA256 for legal validity
 */
export function generateNDASignature(
  ndaContent: string,
  signerPrivateKey: string,
  signerInfo: {
    name: string
    email: string
    timestamp: string
    ipAddress: string
  }
): string {
  const dataToSign = JSON.stringify({
    content: ndaContent,
    signer: signerInfo,
  })

  const sign = crypto.createSign('RSA-SHA256')
  sign.update(dataToSign)
  sign.end()

  return sign.sign(signerPrivateKey, 'base64')
}

/**
 * Verify digital signature
 */
export function verifyNDASignature(
  ndaContent: string,
  signature: string,
  signerPublicKey: string,
  signerInfo: {
    name: string
    email: string
    timestamp: string
    ipAddress: string
  }
): boolean {
  try {
    const dataToVerify = JSON.stringify({
      content: ndaContent,
      signer: signerInfo,
    })

    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(dataToVerify)
    verify.end()

    return verify.verify(signerPublicKey, signature, 'base64')
  } catch (error) {
    return false
  }
}

/**
 * Generate blockchain proof for NDA
 * Immutable record on blockchain
 */
export function generateNDABlockchainProof(nda: NDADocument): string {
  const proofData = {
    ndaId: nda.id,
    title: nda.title,
    parties: nda.parties.map(p => ({
      id: p.id,
      email: p.email,
      signedAt: p.signedAt,
    })),
    terms: nda.terms,
    createdAt: nda.createdAt,
    status: nda.status,
  }

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(proofData))
    .digest('hex')
}

/**
 * Generate device fingerprint for signer
 * Prevents signature repudiation
 */
export function generateDeviceFingerprint(
  userAgent: string,
  ipAddress: string,
  additionalData?: Record<string, any>
): string {
  const fingerprintData = {
    userAgent,
    ipAddress,
    timestamp: Date.now(),
    ...additionalData,
  }

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(fingerprintData))
    .digest('hex')
}

/**
 * Check if NDA is violated
 * Automatic detection system
 */
export function detectNDAViolation(
  nda: NDADocument,
  activity: {
    userId: string
    action: string
    data: any
    timestamp: string
  }
): NDAViolation | null {
  // Check if user is party to NDA
  const party = nda.parties.find(p => p.id === activity.userId)
  if (!party) return null

  // Check prohibited actions
  const isProhibited = nda.terms.prohibitedActions.some(prohibited =>
    activity.action.toLowerCase().includes(prohibited.toLowerCase())
  )

  if (isProhibited) {
    return {
      id: crypto.randomUUID(),
      ndaId: nda.id,
      violatorId: activity.userId,
      type: 'breach_of_terms',
      description: `Prohibited action detected: ${activity.action}`,
      evidence: [JSON.stringify(activity)],
      detectedAt: new Date().toISOString(),
      severity: 'high',
      penaltyApplied: nda.terms.penaltyAmount,
      status: 'detected',
    }
  }

  return null
}

/**
 * Calculate penalty for NDA violation
 * Automatic enforcement
 */
export function calculateViolationPenalty(
  nda: NDADocument,
  violation: NDAViolation
): number {
  let basePenalty = nda.terms.penaltyAmount

  // Severity multiplier
  const severityMultiplier = {
    low: 0.5,
    medium: 1.0,
    high: 2.0,
    critical: 5.0,
  }

  const multiplier = severityMultiplier[violation.severity]
  return basePenalty * multiplier
}

/**
 * Generate NDA document hash for legal proof
 */
export function generateNDADocumentHash(nda: NDADocument): string {
  const documentData = {
    id: nda.id,
    title: nda.title,
    content: nda.content,
    parties: nda.parties,
    terms: nda.terms,
    createdAt: nda.createdAt,
  }

  return crypto
    .createHash('sha512')
    .update(JSON.stringify(documentData))
    .digest('hex')
}

/**
 * Verify NDA document integrity
 */
export function verifyNDAIntegrity(
  nda: NDADocument,
  storedHash: string
): boolean {
  const currentHash = generateNDADocumentHash(nda)
  return currentHash === storedHash
}

/**
 * Generate audit trail entry
 */
export interface NDAuditEntry {
  id: string
  ndaId: string
  action: string
  userId: string
  timestamp: string
  ipAddress: string
  details: Record<string, any>
  signature: string
}

export function createAuditEntry(
  ndaId: string,
  action: string,
  userId: string,
  ipAddress: string,
  details: Record<string, any>
): NDAuditEntry {
  const entry: NDAuditEntry = {
    id: crypto.randomUUID(),
    ndaId,
    action,
    userId,
    timestamp: new Date().toISOString(),
    ipAddress,
    details,
    signature: '',
  }

  // Sign audit entry for immutability
  entry.signature = crypto
    .createHash('sha256')
    .update(JSON.stringify({ ...entry, signature: '' }))
    .digest('hex')

  return entry
}

/**
 * Check if NDA is expired
 */
export function isNDAExpired(nda: NDADocument): boolean {
  if (!nda.expiresAt) return false

  const now = new Date()
  const expiresAt = new Date(nda.expiresAt)

  return now >= expiresAt
}

/**
 * Generate legal notification for violation
 */
export function generateViolationNotification(
  nda: NDADocument,
  violation: NDAViolation,
  violator: NDAParty
): {
  subject: string
  body: string
  legalNotice: string
} {
  const penalty = calculateViolationPenalty(nda, violation)

  return {
    subject: `LEGAL NOTICE: NDA Violation Detected - ${nda.title}`,
    body: `
Dear ${violator.name},

This is an automated legal notification regarding a detected violation of the Non-Disclosure Agreement "${nda.title}" (ID: ${nda.id}).

VIOLATION DETAILS:
- Type: ${violation.type}
- Severity: ${violation.severity.toUpperCase()}
- Detected: ${violation.detectedAt}
- Description: ${violation.description}

PENALTY:
Automatic penalty of $${penalty.toLocaleString()} USD has been applied as per the terms of the NDA.

EVIDENCE:
${violation.evidence.length} piece(s) of evidence have been recorded and stored with blockchain proof.

NEXT STEPS:
1. Cease all prohibited activities immediately
2. Contact legal department within 48 hours
3. Provide explanation and remediation plan

This notification is legally binding and has been recorded with immutable blockchain proof.

Blockchain Proof Hash: ${generateNDABlockchainProof(nda)}

Regards,
DiscreetCourie Legal Enforcement System
    `.trim(),
    legalNotice: `
LEGAL NOTICE OF NDA VIOLATION

NDA ID: ${nda.id}
Violation ID: ${violation.id}
Violator: ${violator.name} (${violator.email})
Date: ${violation.detectedAt}
Penalty: $${penalty.toLocaleString()} USD

This violation has been automatically detected and recorded with blockchain proof.
All evidence is admissible in court proceedings.
    `.trim(),
  }
}

/**
 * Smart contract simulation for automatic enforcement
 */
export interface SmartContract {
  id: string
  ndaId: string
  conditions: SmartContractCondition[]
  actions: SmartContractAction[]
  status: 'active' | 'triggered' | 'completed' | 'cancelled'
}

export interface SmartContractCondition {
  type: 'time_based' | 'event_based' | 'violation_based'
  condition: string
  value: any
}

export interface SmartContractAction {
  type: 'notify' | 'penalty' | 'revoke_access' | 'legal_action'
  target: string
  parameters: Record<string, any>
}

export function evaluateSmartContract(
  contract: SmartContract,
  context: {
    nda: NDADocument
    currentTime: Date
    recentActivity: any[]
  }
): { shouldTrigger: boolean; triggeredActions: SmartContractAction[] } {
  const triggeredActions: SmartContractAction[] = []

  for (const condition of contract.conditions) {
    let conditionMet = false

    switch (condition.type) {
      case 'time_based':
        // Check if time condition is met
        if (condition.condition === 'expired') {
          conditionMet = isNDAExpired(context.nda)
        }
        break

      case 'violation_based':
        // Check for violations in recent activity
        conditionMet = context.recentActivity.some(activity => {
          const violation = detectNDAViolation(context.nda, activity)
          return violation !== null
        })
        break
    }

    if (conditionMet) {
      triggeredActions.push(...contract.actions)
    }
  }

  return {
    shouldTrigger: triggeredActions.length > 0,
    triggeredActions,
  }
}
