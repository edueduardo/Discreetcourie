'use client'

import { useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { Phone, Shield, Package, ChevronRight, Check, Clock, MapPin, Camera, FileText, Building2, Truck } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/hooks/useTranslation'

export default function LandingPage() {
  const [hoveredTier, setHoveredTier] = useState<number | null>(null)
  const { t } = useTranslation()

  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <title>Discreet Courier Columbus | Same-Day Confidential Delivery</title>
        <meta name="description" content="Private, confidential delivery service in Columbus, Ohio. Same-day delivery, no questions asked. One driver, complete discretion. Book online 24/7." />
        <meta name="keywords" content="confidential delivery columbus, same day courier ohio, discreet delivery service, private courier columbus, document delivery columbus, personal courier service" />
        <meta property="og:title" content="Discreet Courier Columbus | Same-Day Confidential Delivery" />
        <meta property="og:description" content="Private, confidential delivery service in Columbus, Ohio. Same-day delivery, no questions asked." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f] text-white">
        
        {/* Language Switcher - Fixed top right */}
        <div className="fixed top-6 right-6 z-50">
          <LanguageSwitcher />
        </div>
        
        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: ATTENTION - Hero (AIDA Step 1)
            Psychology: Pattern interrupt, curiosity gap, immediate value proposition
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center justify-center px-6">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f]" />
          
          {/* Subtle top glow effect */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0f3460]/20 to-transparent" />
          
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Trust Badge - Social Proof */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a2e] border border-[#2d3748] mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">{t('landing.hero.badge')}</span>
            </div>
            
            {/* Main Headline - Benefit-focused, curiosity-inducing */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="block">{t('landing.hero.title1')}</span>
              <span className="block text-[#e94560]">{t('landing.hero.title2')}</span>
            </h1>
            
            {/* Subheadline - Clarifies the service */}
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            
            <p className="text-lg text-gray-500 mb-12">
              {t('landing.hero.description')}
              <br />
              <span className="text-white font-medium">{t('landing.hero.description2')}</span>
            </p>
            
            {/* CTAs - Primary action prominent */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+16145003080" 
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#e94560] hover:bg-[#d63d56] rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
              >
                <Phone className="w-5 h-5" />
                {t('landing.hero.cta.call')}
              </a>
              <Link 
                href="/concierge/request"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1a1a2e] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-lg font-semibold transition-all"
              >
                {t('landing.hero.cta.book')}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            
            {/* Trust indicators - Reduce anxiety */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{t('landing.hero.trust.confidential')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{t('landing.hero.trust.sameday')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{t('landing.hero.trust.proof')}</span>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-gray-600 rounded-full" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2: INTEREST - Services (AIDA Step 2)
            Psychology: Specific benefits, loss aversion, exclusivity
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-[#0f0f17]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('landing.services.title')}
              </h2>
              <p className="text-gray-400 text-lg">
                {t('landing.services.subtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Service 1: Basic Courier */}
              <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Truck className="w-7 h-7 text-[#e94560]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Same-Day Delivery</h3>
                <p className="text-gray-400 mb-4">
                  Documents, packages, personal items. Picked up and delivered the same day within Columbus metro area.
                </p>
                <p className="text-[#e94560] font-semibold">From $35</p>
              </div>
              
              {/* Service 2: Confidential Delivery */}
              <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-[#e94560]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Confidential Delivery</h3>
                <p className="text-gray-400 mb-4">
                  When discretion matters. Optional NDA, no public tracking, direct communication only. Your business stays private.
                </p>
                <p className="text-[#e94560] font-semibold">From $55</p>
              </div>
              
              {/* Service 3: Discreet Shopping */}
              <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Package className="w-7 h-7 text-[#e94560]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Discreet Shopping</h3>
                <p className="text-gray-400 mb-4">
                  I buy, I deliver. Pharmacy pickups, personal purchases, surprise gifts. No questions, no judgment.
                </p>
                <p className="text-[#e94560] font-semibold">$75/hour</p>
              </div>
              
              {/* Service 4: B2B Documents */}
              <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7 text-[#e94560]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Business Documents</h3>
                <p className="text-gray-400 mb-4">
                  Office-to-office delivery for law firms, medical offices, and businesses. Recurring schedules available.
                </p>
                <p className="text-[#e94560] font-semibold">From $40</p>
              </div>
              
              {/* Service 5: Photo Proof */}
              <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7 text-[#e94560]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Photo Proof of Delivery</h3>
                <p className="text-gray-400 mb-4">
                  Every delivery documented with timestamped photos. GPS-verified location. Digital proof you can trust.
                </p>
                <p className="text-[#e94560] font-semibold">Included</p>
              </div>
              
              {/* Service 6: Real-Time Tracking */}
              <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7 text-[#e94560]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-Time Updates</h3>
                <p className="text-gray-400 mb-4">
                  SMS updates at every step. Know exactly when your package is picked up, in transit, and delivered.
                </p>
                <p className="text-[#e94560] font-semibold">Included</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3: DESIRE - Social Proof & Trust (AIDA Step 3)
            Psychology: Authority, social proof, scarcity, risk reversal
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Columbus Trusts Me
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Attorneys, executives, medical professionals, and people who understand 
                that some things require a personal touch.
              </p>
            </div>
            
            {/* Stats - Honest Launch Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">1</div>
                <div className="text-gray-400">Driver, Direct Service</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">2hr</div>
                <div className="text-gray-400">Min Booking Notice</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">6</div>
                <div className="text-gray-400">Deliveries/Day Max</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">25mi</div>
                <div className="text-gray-400">Service Radius</div>
              </div>
            </div>
            
            {/* Differentiators */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🚗</div>
                <h3 className="text-xl font-semibold mb-2">One Driver Only</h3>
                <p className="text-gray-400">Your package never changes hands. I pick it up, I deliver it. That's it.</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2">Direct Communication</h3>
                <p className="text-gray-400">Text me directly. No call centers, no bots, no runaround.</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-2">Your Privacy First</h3>
                <p className="text-gray-400">What you send is your business. I don't ask, I don't tell.</p>
              </div>
            </div>
            
            {/* Quote */}
            <div className="max-w-3xl mx-auto text-center">
              <blockquote className="text-2xl md:text-3xl font-light italic text-gray-300 mb-6">
                "When it absolutely has to get there today, and no one else needs to know."
              </blockquote>
              <div className="w-16 h-1 bg-[#e94560] mx-auto" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4: ACTION - Pricing & CTAs (AIDA Step 4)
            Psychology: Price anchoring, clear value, urgency, easy action
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-[#0f0f17]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-gray-400 text-lg">
                No hidden fees. No surprises. Price quoted before you book.
              </p>
            </div>
            
            {/* Pricing Cards - Anchoring: highest first */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              
              {/* Tier 3: Concierge - Most Popular */}
              <div 
                className="relative p-8 rounded-2xl bg-gradient-to-b from-[#e94560]/20 to-[#1a1a2e] border-2 border-[#e94560] hover:transform hover:scale-105 transition-all"
                onMouseEnter={() => setHoveredTier(3)}
                onMouseLeave={() => setHoveredTier(null)}
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-[#e94560] rounded-full text-sm font-semibold">
                  MOST POPULAR
                </div>
                <h3 className="text-xl font-bold mb-2 mt-4">Discreet Shopping</h3>
                <div className="text-3xl font-bold mb-1">$75</div>
                <div className="text-gray-400 text-sm mb-6">per hour</div>
                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#e94560]" />
                    I buy, you receive
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#e94560]" />
                    No questions asked
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#e94560]" />
                    Receipt provided
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#e94560]" />
                    Delivery included
                  </li>
                </ul>
                <Link 
                  href="/concierge/request?service=shopping"
                  className="block w-full py-3 text-center rounded-lg bg-[#e94560] hover:bg-[#d63d56] font-semibold transition-colors"
                >
                  Book Now
                </Link>
              </div>
              
              {/* Tier 2: Confidential */}
              <div 
                className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 hover:transform hover:scale-105 transition-all"
                onMouseEnter={() => setHoveredTier(2)}
                onMouseLeave={() => setHoveredTier(null)}
              >
                <h3 className="text-xl font-bold mb-2">Confidential</h3>
                <div className="text-3xl font-bold mb-1">$55</div>
                <div className="text-gray-400 text-sm mb-6">per delivery</div>
                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    NDA available
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    No public tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Direct SMS only
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Photo proof private
                  </li>
                </ul>
                <Link 
                  href="/concierge/request?service=confidential"
                  className="block w-full py-3 text-center rounded-lg bg-[#2d3748] hover:bg-[#3d4758] font-semibold transition-colors"
                >
                  Book Now
                </Link>
              </div>
              
              {/* Tier 1: Standard Courier */}
              <div 
                className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 hover:transform hover:scale-105 transition-all"
                onMouseEnter={() => setHoveredTier(1)}
                onMouseLeave={() => setHoveredTier(null)}
              >
                <h3 className="text-xl font-bold mb-2">Standard</h3>
                <div className="text-3xl font-bold mb-1">$35</div>
                <div className="text-gray-400 text-sm mb-6">per delivery</div>
                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Same-day delivery
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    SMS updates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Photo proof
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Online tracking
                  </li>
                </ul>
                <Link 
                  href="/concierge/request?service=standard"
                  className="block w-full py-3 text-center rounded-lg bg-[#2d3748] hover:bg-[#3d4758] font-semibold transition-colors"
                >
                  Book Now
                </Link>
              </div>
            </div>
            
            {/* Additional pricing info */}
            <div className="mt-12 text-center text-gray-400 text-sm">
              <p className="mb-2">* Distance surcharge: +$2/mile beyond 10 miles</p>
              <p className="mb-2">* After-hours (6pm-9am): +30%</p>
              <p>* Weekend deliveries: +50%</p>
            </div>
            
            {/* CTA Final */}
            <div className="mt-16 text-center">
              <p className="text-gray-400 mb-6">Questions? Call me directly. I answer.</p>
              <a 
                href="tel:+16145003080" 
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1a1a2e] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-lg font-semibold transition-all"
              >
                <Phone className="w-5 h-5" />
                (614) 500-3080
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5: HOW IT WORKS - Reduce Friction
            Psychology: Simplicity, clear process, reduce anxiety
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('landing.howitworks.title')}
              </h2>
              <p className="text-gray-400 text-lg">
                {t('landing.howitworks.subtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#e94560] flex items-center justify-center mx-auto mb-6 text-2xl font-bold">1</div>
                <h3 className="text-xl font-semibold mb-2">Book Online or Call</h3>
                <p className="text-gray-400">Tell me the pickup address, delivery address, and when you need it.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#e94560] flex items-center justify-center mx-auto mb-6 text-2xl font-bold">2</div>
                <h3 className="text-xl font-semibold mb-2">I Pick It Up</h3>
                <p className="text-gray-400">You'll get a text when I'm on my way and when I have your package.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#e94560] flex items-center justify-center mx-auto mb-6 text-2xl font-bold">3</div>
                <h3 className="text-xl font-semibold mb-2">Delivered with Proof</h3>
                <p className="text-gray-400">Photo proof sent to your phone. Done.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 6: SERVICE AREA
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 px-6 bg-[#0f0f17]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Service Area</h2>
            <p className="text-gray-400 mb-6">
              Columbus metropolitan area within 25 miles of downtown.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="px-3 py-1 bg-[#1a1a2e] rounded-full">Downtown Columbus</span>
              <span className="px-3 py-1 bg-[#1a1a2e] rounded-full">Upper Arlington</span>
              <span className="px-3 py-1 bg-[#1a1a2e] rounded-full">Worthington</span>
              <span className="px-3 py-1 bg-[#1a1a2e] rounded-full">Dublin</span>
              <span className="px-3 py-1 bg-[#1a1a2e] rounded-full">Westerville</span>
              <span className="px-3 py-1 bg-[#1a1a2e] rounded-full">Gahanna</span>
              <span className="px-3 py-1 bg-[#1a1a2e] rounded-full">Reynoldsburg</span>
              <span className="px-3 py-1 bg-[#1a1a2e] rounded-full">Grove City</span>
              <span className="px-3 py-1 bg-[#1a1a2e] rounded-full">Hilliard</span>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Outside 25 miles? <a href="tel:+16145003080" className="text-[#e94560] hover:underline">Call for a quote</a>.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════════ */}
        <footer className="py-16 px-6 border-t border-[#2d3748]">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold mb-2">Discreet Courier Columbus</h3>
                <p className="text-[#e94560] font-medium mb-4">{t('landing.footer.tagline')}</p>
                <p className="text-gray-500 mb-4">
                  {t('landing.footer.description')}
                </p>
                <a 
                  href="tel:+16145003080" 
                  className="text-white font-semibold hover:text-[#e94560] transition-colors"
                >
                  (614) 500-3080
                </a>
              </div>
              
              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <div className="flex flex-col gap-2 text-gray-400">
                  <Link href="/track" className="hover:text-white transition-colors">
                    Track Delivery
                  </Link>
                  <Link href="/concierge/request" className="hover:text-white transition-colors">
                    Book Now
                  </Link>
                  <Link href="/portal" className="hover:text-white transition-colors">
                    Client Portal
                  </Link>
                </div>
              </div>
              
              {/* Legal */}
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <div className="flex flex-col gap-2 text-gray-400">
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/refund-policy" className="hover:text-white transition-colors">
                    Refund Policy
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Bottom */}
            <div className="pt-8 border-t border-[#2d3748] flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} Discreet Courier Columbus. All rights reserved.
              </p>
              <p className="text-sm text-gray-600">
                Columbus, Ohio | Serving the metro area
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
