'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Discreet Courier Columbus (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
              you use our courier services. Privacy and discretion are core to our business values.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">2. Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We collect information necessary to provide our services:
            </p>
            <h3 className="text-xl font-medium mb-2 text-white">Personal Information:</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
              <li>Name and contact information (phone number, email)</li>
              <li>Pickup and delivery addresses</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>Communication preferences (SMS or WhatsApp)</li>
            </ul>
            <h3 className="text-xl font-medium mb-2 text-white">Service Information:</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Delivery requests and history</li>
              <li>Photo proof of deliveries (stored for 30 days)</li>
              <li>Special instructions provided by you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">3. What We Do NOT Collect</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              In keeping with our commitment to discretion:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>We do NOT ask about or record the contents of your packages</li>
              <li>We do NOT track your location beyond what is necessary for delivery</li>
              <li>We do NOT share your delivery history with third parties</li>
              <li>We do NOT sell your personal information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">4. How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Your information is used solely for:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Processing and completing your delivery requests</li>
              <li>Communicating with you about your deliveries (via SMS/WhatsApp)</li>
              <li>Sending photo proof of delivery</li>
              <li>Processing payments securely</li>
              <li>Responding to your inquiries and support requests</li>
              <li>Improving our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">5. Communication Channels</h2>
            <p className="text-gray-300 leading-relaxed">
              We communicate with customers primarily via SMS (for US-based customers) or WhatsApp (for 
              customers who prefer it, particularly in Latino communities). You can specify your preferred 
              communication channel when booking. We use Twilio for secure SMS and WhatsApp messaging.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">6. Data Security</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We implement robust security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>All data is encrypted in transit and at rest</li>
              <li>Payment information is processed through PCI-compliant Stripe</li>
              <li>Access to customer data is strictly limited</li>
              <li>Photo proof is automatically deleted after 30 days</li>
              <li>NDAs are available and processed via secure DocuSign</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">7. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              We retain your information only as long as necessary to provide services and comply with legal 
              obligations. Specifically:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
              <li>Photo proof of delivery: 30 days</li>
              <li>Transaction records: As required by tax laws (typically 7 years)</li>
              <li>Account information: Until you request deletion</li>
              <li>Communication logs: 90 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">8. Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use the following trusted third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
              <li><strong>Twilio:</strong> SMS and WhatsApp communications</li>
              <li><strong>DocuSign:</strong> NDA signing for confidential deliveries</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Each of these services has their own privacy policies and security measures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">9. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information (subject to legal retention requirements)</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              To exercise these rights, contact us at the information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">10. Legal Disclosure</h2>
            <p className="text-gray-300 leading-relaxed">
              We may disclose your information if required by law, such as in response to a valid subpoena, 
              court order, or government investigation. We will notify you of such requests unless legally 
              prohibited from doing so.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">11. Children&apos;s Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our services are not intended for individuals under 18 years of age. We do not knowingly 
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">12. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by posting the new policy on our website and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">13. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions or concerns about this Privacy Policy or our data practices:
            </p>
            <ul className="list-none text-gray-300 space-y-2 mt-4">
              <li><strong>Phone:</strong> (614) 500-3080</li>
              <li><strong>Email:</strong> privacy@discreetcourier.com</li>
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
