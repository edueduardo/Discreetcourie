/**
 * SOLO OPERATION LIMITS
 * 
 * These constraints ensure the system respects the capacity
 * of a solo operator (1 person + 1 car).
 * 
 * DO NOT MODIFY these limits without understanding the
 * physical constraints of solo delivery operation.
 */

export const SOLO_LIMITS = {
  // Maximum deliveries per day
  maxDeliveriesPerDay: 6,
  
  // Maximum active deliveries at once (only 1 person)
  maxActiveDeliveries: 1,
  
  // Coverage radius in miles from Columbus center
  coverageRadiusMiles: 25,
  
  // Columbus, OH center coordinates
  centerCoordinates: {
    lat: 39.9612,
    lng: -82.9988
  },
  
  // Minimum booking lead time in hours
  bookingLeadTimeHours: 2,
  
  // Operating hours (9am-6pm EST)
  operatingHours: {
    start: 9,
    end: 18
  },
  
  // Pricing surcharges
  surcharges: {
    weekendMultiplier: 1.5,      // +50% on Saturday
    sundayMultiplier: 1.75,      // +75% on Sunday
    afterHoursMultiplier: 1.3,   // +30% before 9am or after 6pm
    holidayMultiplier: 2.0,      // +100% on holidays
    outsideRadiusFee: 25         // $25 extra if outside 25mi
  },
  
  // Base prices by service type
  basePrices: {
    standard: 35,
    confidential: 55,
    shopping: 75,    // per hour
    b2b: 40
  },
  
  // Distance rate per mile (after first 10 miles)
  distanceRatePerMile: 2.0,
  freeDistanceMiles: 10
} as const

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Check if a location is within the coverage area
 */
export function isWithinCoverageArea(lat: number, lng: number): boolean {
  const distance = calculateDistance(
    SOLO_LIMITS.centerCoordinates.lat,
    SOLO_LIMITS.centerCoordinates.lng,
    lat,
    lng
  )
  return distance <= SOLO_LIMITS.coverageRadiusMiles
}

/**
 * Calculate dynamic price based on all factors
 */
export function calculateDeliveryPrice(params: {
  serviceType: 'standard' | 'confidential' | 'shopping' | 'b2b'
  distanceMiles: number
  pickupTime: Date
  isRecurring?: boolean
}): {
  basePrice: number
  distanceFee: number
  timeSurcharge: number
  outsideAreaFee: number
  total: number
  breakdown: string[]
} {
  const { serviceType, distanceMiles, pickupTime, isRecurring } = params
  const breakdown: string[] = []
  
  // Base price
  let basePrice = SOLO_LIMITS.basePrices[serviceType]
  breakdown.push(`Base (${serviceType}): $${basePrice}`)
  
  // Distance fee (after free miles)
  let distanceFee = 0
  if (distanceMiles > SOLO_LIMITS.freeDistanceMiles) {
    distanceFee = (distanceMiles - SOLO_LIMITS.freeDistanceMiles) * SOLO_LIMITS.distanceRatePerMile
    breakdown.push(`Distance (${(distanceMiles - SOLO_LIMITS.freeDistanceMiles).toFixed(1)} mi × $${SOLO_LIMITS.distanceRatePerMile}): $${distanceFee.toFixed(2)}`)
  }
  
  // Time-based surcharges
  let timeSurcharge = 0
  const hour = pickupTime.getHours()
  const day = pickupTime.getDay()
  
  let timeMultiplier = 1.0
  
  // Check day of week
  if (day === 0) { // Sunday
    timeMultiplier = SOLO_LIMITS.surcharges.sundayMultiplier
    breakdown.push(`Sunday premium: +${((timeMultiplier - 1) * 100).toFixed(0)}%`)
  } else if (day === 6) { // Saturday
    timeMultiplier = SOLO_LIMITS.surcharges.weekendMultiplier
    breakdown.push(`Weekend premium: +${((timeMultiplier - 1) * 100).toFixed(0)}%`)
  }
  
  // Check hours (after-hours)
  if (hour < SOLO_LIMITS.operatingHours.start || hour >= SOLO_LIMITS.operatingHours.end) {
    timeMultiplier = Math.max(timeMultiplier, SOLO_LIMITS.surcharges.afterHoursMultiplier)
    breakdown.push(`After-hours premium: +${((SOLO_LIMITS.surcharges.afterHoursMultiplier - 1) * 100).toFixed(0)}%`)
  }
  
  timeSurcharge = (basePrice + distanceFee) * (timeMultiplier - 1)
  
  // Outside coverage area fee
  let outsideAreaFee = 0
  if (distanceMiles > SOLO_LIMITS.coverageRadiusMiles) {
    outsideAreaFee = SOLO_LIMITS.surcharges.outsideRadiusFee
    breakdown.push(`Outside service area fee: $${outsideAreaFee}`)
  }
  
  // Calculate total
  let total = basePrice + distanceFee + timeSurcharge + outsideAreaFee
  
  // Recurring discount
  if (isRecurring) {
    const discount = total * 0.1
    total -= discount
    breakdown.push(`Recurring discount: -$${discount.toFixed(2)}`)
  }
  
  return {
    basePrice,
    distanceFee,
    timeSurcharge,
    outsideAreaFee,
    total: Math.round(total * 100) / 100,
    breakdown
  }
}

/**
 * Check if booking time meets minimum lead time requirement
 */
export function meetsLeadTimeRequirement(requestedTime: Date): boolean {
  const now = new Date()
  const leadTimeMs = SOLO_LIMITS.bookingLeadTimeHours * 60 * 60 * 1000
  return requestedTime.getTime() - now.getTime() >= leadTimeMs
}

/**
 * Validate a booking against all solo limits
 */
export interface BookingValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export async function validateBooking(params: {
  requestedTime: Date
  pickupLat?: number
  pickupLng?: number
  deliveryLat?: number
  deliveryLng?: number
  currentDayDeliveries?: number
}): Promise<BookingValidation> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check lead time
  if (!meetsLeadTimeRequirement(params.requestedTime)) {
    errors.push(`Bookings require at least ${SOLO_LIMITS.bookingLeadTimeHours} hours advance notice.`)
  }
  
  // Check daily capacity
  if (params.currentDayDeliveries !== undefined) {
    if (params.currentDayDeliveries >= SOLO_LIMITS.maxDeliveriesPerDay) {
      errors.push(`Maximum ${SOLO_LIMITS.maxDeliveriesPerDay} deliveries per day reached. Please select another date.`)
    } else if (params.currentDayDeliveries >= SOLO_LIMITS.maxDeliveriesPerDay - 1) {
      warnings.push(`Only 1 slot remaining for this day.`)
    }
  }
  
  // Check pickup coverage area
  if (params.pickupLat && params.pickupLng) {
    if (!isWithinCoverageArea(params.pickupLat, params.pickupLng)) {
      warnings.push(`Pickup location is outside our standard ${SOLO_LIMITS.coverageRadiusMiles}-mile coverage area. Additional fees may apply.`)
    }
  }
  
  // Check delivery coverage area
  if (params.deliveryLat && params.deliveryLng) {
    if (!isWithinCoverageArea(params.deliveryLat, params.deliveryLng)) {
      warnings.push(`Delivery location is outside our standard ${SOLO_LIMITS.coverageRadiusMiles}-mile coverage area. Additional fees may apply.`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * US Holidays for 2024-2025
 */
export const US_HOLIDAYS = [
  '2024-01-01', // New Year's Day
  '2024-01-15', // MLK Day
  '2024-02-19', // Presidents Day
  '2024-05-27', // Memorial Day
  '2024-07-04', // Independence Day
  '2024-09-02', // Labor Day
  '2024-10-14', // Columbus Day
  '2024-11-11', // Veterans Day
  '2024-11-28', // Thanksgiving
  '2024-12-25', // Christmas
  '2025-01-01', // New Year's Day
  '2025-01-20', // MLK Day
  '2025-02-17', // Presidents Day
  '2025-05-26', // Memorial Day
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-10-13', // Columbus Day
  '2025-11-11', // Veterans Day
  '2025-11-27', // Thanksgiving
  '2025-12-25', // Christmas
]

export function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return US_HOLIDAYS.includes(dateStr)
}
