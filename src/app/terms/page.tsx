'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2d3748] bg-[#0a0a0f]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-400 mb-12">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">1. Agreement to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using Discreet Courier Columbus services, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services. These terms constitute a legally 
              binding agreement between you and Discreet Courier Columbus.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">2. Service Description</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Discreet Courier Columbus provides confidential same-day courier and delivery services within the 
              Columbus, Ohio metropolitan area (25-mile radius from downtown Columbus). Our services include:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Standard Delivery Service</li>
              <li>Confidential Delivery Service with NDA</li>
              <li>Personal Shopping & Errand Service</li>
              <li>Business Document Delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">3. Service Area & Limitations</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our services are limited to the following parameters:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Service radius: 25 miles from downtown Columbus, Ohio</li>
              <li>Maximum deliveries per day: 6 (to ensure quality service)</li>
              <li>Minimum booking lead time: 2 hours</li>
              <li>Operating hours: 7:00 AM - 9:00 PM, 7 days a week</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">4. Prohibited Items</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We do not transport the following items under any circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Illegal substances or contraband</li>
              <li>Weapons, firearms, or ammunition</li>
              <li>Hazardous materials or explosives</li>
              <li>Stolen property</li>
              <li>Live animals</li>
              <li>Human remains or biological samples (without proper licensing)</li>
              <li>Any item that violates federal, state, or local laws</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Violation of this policy will result in immediate service termination and may be reported to authorities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">5. Pricing & Payment</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our pricing structure is as follows:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Standard Delivery: $35 per delivery</li>
              <li>Confidential Delivery (with NDA): $55 per delivery</li>
              <li>Personal Shopping/Errands: $75 per hour</li>
              <li>B2B Document Service: Starting at $40</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Payment is required at the time of booking. We accept major credit cards and secure online payments 
              through Stripe. All prices are in USD and subject to change with notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">6. Confidentiality</h2>
            <p className="text-gray-300 leading-relaxed">
              We take confidentiality seriously. For our Confidential Delivery service, we offer Non-Disclosure 
              Agreements (NDAs) signed via DocuSign. We do not ask about or disclose the contents of packages. 
              Customer information is protected and never shared with third parties except as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">7. Photo Proof of Delivery</h2>
            <p className="text-gray-300 leading-relaxed">
              All deliveries include photo proof, which is sent directly to the customer via SMS or WhatsApp. 
              Photos are stored securely and deleted after 30 days unless the customer requests otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">8. Liability Limitations</h2>
            <p className="text-gray-300 leading-relaxed">
              While we exercise the utmost care in handling all items, our liability is limited to the declared 
              value of the package, up to a maximum of $500 per delivery. For items exceeding this value, 
              additional insurance may be arranged at the customer&apos;s request and expense. We are not liable for 
              delays caused by circumstances beyond our control, including but not limited to traffic, weather, 
              or incorrect address information provided by the customer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">9. Cancellation Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              Cancellations made more than 2 hours before the scheduled pickup receive a full refund. 
              Cancellations made less than 2 hours before pickup are subject to a 50% cancellation fee. 
              No-shows or cancellations after pickup has begun are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">10. Dispute Resolution</h2>
            <p className="text-gray-300 leading-relaxed">
              Any disputes arising from these terms or our services shall first be addressed through direct 
              communication with our customer service. If resolution cannot be reached, disputes shall be 
              resolved through binding arbitration in Franklin County, Ohio, in accordance with Ohio state law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">11. Modifications to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of our services after 
              modifications constitutes acceptance of the updated terms. Significant changes will be 
              communicated via email to registered customers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">12. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none text-gray-300 space-y-2 mt-4">
              <li><strong>Phone:</strong> (614) 500-3080</li>
              <li><strong>Email:</strong> contact@discreetcourier.com</li>
              <li><strong>Service Area:</strong> Columbus, Ohio Metropolitan Area</li>
            </ul>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2d3748] py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap gap-6 justify-center text-sm text-gray-500">
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
        </div>
        <p className="text-center text-gray-600 text-sm mt-4">
          © 2025 Discreet Courier Columbus. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
