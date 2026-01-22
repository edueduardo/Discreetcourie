'use client'

import Link from 'next/link'
import { 
  Shield, 
  EyeOff, 
  Lock, 
  UserCheck, 
  Package, 
  ShoppingBag,
  Clock,
  Phone,
  ArrowRight,
  Check,
  MessageSquare,
  FileSignature
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SERVICE_TIERS } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  EyeOff,
  UserCheck,
  Shield
}

const USE_CASES = [
  {
    category: 'Discreet Purchases',
    icon: ShoppingBag,
    examples: [
      'Pharmacy items you prefer not to buy yourself',
      'Sensitive personal products',
      'Surprise gifts without a trace',
      'Items from specialty stores'
    ]
  },
  {
    category: 'Personal Tasks',
    icon: UserCheck,
    examples: [
      'Return items to someone you\'d rather not see',
      'Pick up belongings from difficult situations',
      'Deliver messages or documents in person',
      'Wait in lines on your behalf'
    ]
  },
  {
    category: 'Confidential Matters',
    icon: Lock,
    examples: [
      'Collect medical results or documents',
      'Handle sensitive business errands',
      'Deliver legal paperwork',
      'Represent you in situations you can\'t attend'
    ]
  }
]

export default function ConciergePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-800 mb-6">
              <Shield className="h-3 w-3 mr-1" />
              Premium Confidential Services
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              We Handle What
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                You Can't
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Personal concierge services with absolute discretion. 
              We buy, fetch, deliver, and handle tasks you prefer not to do yourself. 
              <span className="text-blue-400 font-semibold"> No questions asked.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/concierge/request">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                  Request Service
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="tel:+16145550123">
                <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8">
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-500" />
                <span>End-to-End Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-red-400" />
                <span>No-Trace Available</span>
              </div>
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-blue-400" />
                <span>NDA Protected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Service Level</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From simple deliveries to complex situations, we have you covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICE_TIERS.map((tier, index) => {
              const Icon = ICON_MAP[tier.icon] || Package
              const isPopular = tier.id === 'concierge'
              const isPremium = tier.id === 'fixer'
              
              return (
                <Card 
                  key={tier.id}
                  className={`
                    relative overflow-hidden transition-transform hover:scale-105
                    ${isPremium 
                      ? 'bg-gradient-to-b from-purple-900/50 to-slate-800 border-purple-700' 
                      : isPopular
                        ? 'bg-gradient-to-b from-blue-900/50 to-slate-800 border-blue-700'
                        : 'bg-slate-800 border-slate-700'
                    }
                  `}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      POPULAR
                    </div>
                  )}
                  {isPremium && (
                    <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      VIP
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <div className={`
                      h-12 w-12 rounded-full flex items-center justify-center mb-4
                      ${isPremium ? 'bg-purple-600/20' : isPopular ? 'bg-blue-600/20' : 'bg-slate-700'}
                    `}>
                      <Icon className={`h-6 w-6 ${isPremium ? 'text-purple-400' : isPopular ? 'text-blue-400' : 'text-slate-400'}`} />
                    </div>
                    
                    <h3 className="text-white font-bold text-lg">{tier.name}</h3>
                    <p className={`text-sm mb-2 ${isPremium ? 'text-purple-400' : isPopular ? 'text-blue-400' : 'text-slate-500'}`}>
                      {tier.tagline}
                    </p>
                    <p className="text-slate-400 text-sm mb-4">{tier.description}</p>
                    
                    <div className="text-2xl font-bold text-white mb-4">{tier.priceRange}</div>
                    
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                          <Check className={`h-4 w-4 ${isPremium ? 'text-purple-400' : 'text-green-500'}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Link href={`/concierge/request?tier=${tier.id}`}>
                      <Button 
                        className={`w-full ${
                          isPremium 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : isPopular
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        Select
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">What We Handle</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Legal tasks you need done with absolute discretion
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {USE_CASES.map((useCase) => (
              <Card key={useCase.category} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                    <useCase.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-4">{useCase.category}</h3>
                  <ul className="space-y-3">
                    {useCase.examples.map((example, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Features */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Your Privacy is Sacred</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Multiple layers of protection for your complete peace of mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <div className="h-14 w-14 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-7 w-7 text-green-500" />
              </div>
              <h3 className="text-white font-bold mb-2">Encrypted Chat</h3>
              <p className="text-slate-400 text-sm">End-to-end encryption for all communications</p>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <div className="h-14 w-14 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
                <EyeOff className="h-7 w-7 text-red-400" />
              </div>
              <h3 className="text-white font-bold mb-2">No-Trace Mode</h3>
              <p className="text-slate-400 text-sm">All records auto-delete 7 days after completion</p>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <div className="h-14 w-14 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
                <FileSignature className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-white font-bold mb-2">NDA Protected</h3>
              <p className="text-slate-400 text-sm">Mutual confidentiality agreement for all clients</p>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <div className="h-14 w-14 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Zero Judgment</h3>
              <p className="text-slate-400 text-sm">We don't ask why. We just get it done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-800/50 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto">
              Whatever you need handled, we're here. Complete discretion, no judgment, professional service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/concierge/request">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                  Request Service Online
                </Button>
              </Link>
              <Link href="tel:+16145550123">
                <Button size="lg" variant="outline" className="border-slate-500 text-white hover:bg-slate-800 text-lg px-8">
                  <Phone className="mr-2 h-5 w-5" />
                  (614) 555-0123
                </Button>
              </Link>
            </div>
            <p className="text-slate-500 text-sm mt-6">
              Extended hours 8AM-8PM Mon-Sat • Columbus, OH and surrounding areas
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 Discreet Courier Columbus. All rights reserved.</p>
          <p className="mt-2">We only handle legal requests. Privacy protected.</p>
        </div>
      </footer>
    </div>
  )
}
