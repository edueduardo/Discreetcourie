/**
 * Environment Variables Validation Script
 *
 * Run this script to validate your .env.local configuration:
 * npx ts-node scripts/validate-env.ts
 *
 * Or add to package.json:
 * "validate-env": "ts-node scripts/validate-env.ts"
 */

interface EnvVar {
  name: string
  required: boolean
  critical: boolean // Blocks core functionality
  description: string
  example: string
  validateFn?: (value: string) => boolean
}

const ENV_VARS: EnvVar[] = [
  // ==================== CRITICAL (Required for app to run) ====================
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    critical: true,
    description: 'Supabase project URL',
    example: 'https://xxxxx.supabase.co',
    validateFn: (v) => v.startsWith('https://') && v.includes('supabase'),
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    critical: true,
    description: 'Supabase anonymous key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    validateFn: (v) => v.startsWith('eyJ'),
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    critical: true,
    description: 'NextAuth.js secret for JWT encryption',
    example: 'generate-with: openssl rand -base64 32',
    validateFn: (v) => v.length >= 32,
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    critical: true,
    description: 'App URL for NextAuth callbacks',
    example: 'http://localhost:3000 or https://yourdomain.com',
    validateFn: (v) => v.startsWith('http'),
  },

  // ==================== PAYMENTS (Required for checkout) ====================
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    critical: true,
    description: 'Stripe secret key for payment processing',
    example: 'sk_test_xxx or sk_live_xxx',
    validateFn: (v) => v.startsWith('sk_'),
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    critical: true,
    description: 'Stripe publishable key for frontend',
    example: 'pk_test_xxx or pk_live_xxx',
    validateFn: (v) => v.startsWith('pk_'),
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    critical: false,
    description: 'Stripe webhook secret for payment events',
    example: 'whsec_xxx',
    validateFn: (v) => v.startsWith('whsec_'),
  },

  // ==================== NOTIFICATIONS (Important but not blocking) ====================
  {
    name: 'TWILIO_ACCOUNT_SID',
    required: false,
    critical: false,
    description: 'Twilio account SID for SMS',
    example: 'ACxxxxx',
    validateFn: (v) => v.startsWith('AC'),
  },
  {
    name: 'TWILIO_AUTH_TOKEN',
    required: false,
    critical: false,
    description: 'Twilio auth token',
    example: 'xxxxx',
    validateFn: (v) => v.length >= 32,
  },
  {
    name: 'TWILIO_PHONE_NUMBER',
    required: false,
    critical: false,
    description: 'Twilio phone number for sending SMS',
    example: '+16145003080',
    validateFn: (v) => v.startsWith('+'),
  },
  {
    name: 'RESEND_API_KEY',
    required: false,
    critical: false,
    description: 'Resend API key for emails',
    example: 're_xxxxx',
    validateFn: (v) => v.startsWith('re_'),
  },

  // ==================== AI FEATURES ====================
  {
    name: 'OPENAI_API_KEY',
    required: false,
    critical: false,
    description: 'OpenAI API key for AI features',
    example: 'sk-xxxxx',
    validateFn: (v) => v.startsWith('sk-'),
  },

  // ==================== MAPS & DISTANCE ====================
  {
    name: 'GOOGLE_MAPS_API_KEY',
    required: false,
    critical: false,
    description: 'Google Maps API key for distance calculation',
    example: 'AIzaXxxx',
    validateFn: (v) => v.startsWith('AIza'),
  },
  {
    name: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    required: false,
    critical: false,
    description: 'Google Maps API key for frontend',
    example: 'AIzaXxxx',
    validateFn: (v) => v.startsWith('AIza'),
  },

  // ==================== SECURITY ====================
  {
    name: 'ENCRYPTION_KEY',
    required: false,
    critical: false,
    description: '32-character encryption key for vault',
    example: 'generate-with: openssl rand -hex 16',
    validateFn: (v) => v.length >= 32,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    critical: false,
    description: 'Supabase service role key for admin operations',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    validateFn: (v) => v.startsWith('eyJ'),
  },

  // ==================== OPTIONAL SERVICES ====================
  {
    name: 'BLAND_API_KEY',
    required: false,
    critical: false,
    description: 'Bland.ai API key for AI phone assistant',
    example: 'xxxxx',
  },
  {
    name: 'MAILCHIMP_API_KEY',
    required: false,
    critical: false,
    description: 'Mailchimp API key for marketing automation',
    example: 'xxxxx-usXX',
  },
  {
    name: 'VAPID_PUBLIC_KEY',
    required: false,
    critical: false,
    description: 'VAPID public key for push notifications',
    example: 'BPxxxx',
  },
  {
    name: 'VAPID_PRIVATE_KEY',
    required: false,
    critical: false,
    description: 'VAPID private key for push notifications',
    example: 'xxxxx',
  },
]

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function validateEnvVars() {
  console.log('\n' + colors.bold + colors.cyan + '=' .repeat(60) + colors.reset)
  console.log(colors.bold + '   DISCREET COURIER - Environment Variables Validation' + colors.reset)
  console.log(colors.cyan + '=' .repeat(60) + colors.reset + '\n')

  const results = {
    critical: { passed: 0, failed: 0, missing: [] as string[] },
    required: { passed: 0, failed: 0, missing: [] as string[] },
    optional: { passed: 0, missing: 0 },
    warnings: [] as string[],
  }

  // Check each env var
  ENV_VARS.forEach((envVar) => {
    const value = process.env[envVar.name]
    const hasValue = value && value.length > 0
    const isValid = hasValue && (!envVar.validateFn || envVar.validateFn(value))

    const icon = isValid ? '✅' : hasValue ? '⚠️' : (envVar.required ? '❌' : '⬜')
    const status = isValid ? colors.green : hasValue ? colors.yellow : (envVar.required ? colors.red : colors.reset)

    console.log(`${icon} ${status}${envVar.name}${colors.reset}`)

    if (!hasValue && envVar.required) {
      console.log(`   ${colors.red}Missing: ${envVar.description}${colors.reset}`)
      console.log(`   ${colors.yellow}Example: ${envVar.example}${colors.reset}`)
      if (envVar.critical) {
        results.critical.missing.push(envVar.name)
        results.critical.failed++
      } else {
        results.required.missing.push(envVar.name)
        results.required.failed++
      }
    } else if (!isValid && hasValue) {
      console.log(`   ${colors.yellow}Invalid format. Expected: ${envVar.example}${colors.reset}`)
      results.warnings.push(`${envVar.name}: Invalid format`)
    } else if (isValid) {
      if (envVar.critical) results.critical.passed++
      else if (envVar.required) results.required.passed++
      else results.optional.passed++
    } else {
      results.optional.missing++
    }
    console.log()
  })

  // Print summary
  console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset)
  console.log(colors.bold + '   SUMMARY' + colors.reset)
  console.log(colors.cyan + '=' .repeat(60) + colors.reset + '\n')

  const criticalOk = results.critical.failed === 0
  const requiredOk = results.required.failed === 0

  console.log(`${colors.bold}Critical Variables:${colors.reset}`)
  console.log(`  ${criticalOk ? colors.green + '✅' : colors.red + '❌'} ${results.critical.passed} passed, ${results.critical.failed} failed${colors.reset}`)

  console.log(`\n${colors.bold}Required Variables:${colors.reset}`)
  console.log(`  ${requiredOk ? colors.green + '✅' : colors.yellow + '⚠️'} ${results.required.passed} passed, ${results.required.failed} failed${colors.reset}`)

  console.log(`\n${colors.bold}Optional Variables:${colors.reset}`)
  console.log(`  ⬜ ${results.optional.passed} configured, ${results.optional.missing} not configured${colors.reset}`)

  // Features status
  console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset)
  console.log(colors.bold + '   FEATURE STATUS' + colors.reset)
  console.log(colors.cyan + '=' .repeat(60) + colors.reset + '\n')

  const features = [
    { name: 'Core App (Database + Auth)', vars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXTAUTH_SECRET'] },
    { name: 'Payments (Stripe Checkout)', vars: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] },
    { name: 'SMS Notifications (Twilio)', vars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'] },
    { name: 'Email Notifications (Resend)', vars: ['RESEND_API_KEY'] },
    { name: 'AI Features (OpenAI)', vars: ['OPENAI_API_KEY'] },
    { name: 'Distance Calculation (Google)', vars: ['GOOGLE_MAPS_API_KEY'] },
    { name: 'Human Vault Encryption', vars: ['ENCRYPTION_KEY'] },
    { name: 'Push Notifications', vars: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'] },
    { name: 'AI Phone Assistant (Bland)', vars: ['BLAND_API_KEY'] },
  ]

  features.forEach((feature) => {
    const allPresent = feature.vars.every((v) => {
      const val = process.env[v]
      return val && val.length > 0
    })
    const icon = allPresent ? '✅' : '❌'
    const color = allPresent ? colors.green : colors.red
    console.log(`${icon} ${color}${feature.name}${colors.reset}`)
  })

  // Final verdict
  console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset)

  if (!criticalOk) {
    console.log(colors.red + colors.bold + '\n❌ CRITICAL: App cannot start without these variables:' + colors.reset)
    results.critical.missing.forEach((name) => {
      console.log(colors.red + `   - ${name}` + colors.reset)
    })
    console.log()
    process.exit(1)
  } else if (!requiredOk) {
    console.log(colors.yellow + colors.bold + '\n⚠️  WARNING: Some features will not work:' + colors.reset)
    results.required.missing.forEach((name) => {
      console.log(colors.yellow + `   - ${name}` + colors.reset)
    })
    console.log(colors.green + '\n✅ App can start but with limited functionality\n' + colors.reset)
  } else {
    console.log(colors.green + colors.bold + '\n✅ All required environment variables are configured!\n' + colors.reset)
  }

  // Recommendations
  if (results.optional.missing > 0) {
    console.log(colors.blue + 'Recommendations for full functionality:' + colors.reset)
    if (!process.env.OPENAI_API_KEY) {
      console.log('  - Add OPENAI_API_KEY for AI features (fraud detection, smart pricing, etc.)')
    }
    if (!process.env.TWILIO_ACCOUNT_SID) {
      console.log('  - Add Twilio credentials for SMS notifications')
    }
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.log('  - Add Google Maps API key for accurate distance calculation')
    }
    console.log()
  }
}

// Run validation
validateEnvVars()
