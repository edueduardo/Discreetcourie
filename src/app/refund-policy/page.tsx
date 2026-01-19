'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function RefundPolicy() {
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
        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">1. Our Commitment</h2>
            <p className="text-gray-300 leading-relaxed">
              At Discreet Courier Columbus, customer satisfaction is our priority. We understand that 
              circumstances change, and we strive to be fair and transparent in our refund policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">2. Cancellation & Refund Schedule</h2>
            <div className="bg-[#1a1a2e] rounded-lg p-6 border border-[#2d3748]">
              <table className="w-full text-gray-300">
                <thead>
                  <tr className="border-b border-[#2d3748]">
                    <th className="text-left py-3 text-white">Cancellation Timing</th>
                    <th className="text-left py-3 text-white">Refund Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#2d3748]">
                    <td className="py-3">More than 24 hours before pickup</td>
                    <td className="py-3 text-green-400">100% Full Refund</td>
                  </tr>
                  <tr className="border-b border-[#2d3748]">
                    <td className="py-3">2-24 hours before pickup</td>
                    <td className="py-3 text-green-400">100% Full Refund</td>
                  </tr>
                  <tr className="border-b border-[#2d3748]">
                    <td className="py-3">Less than 2 hours before pickup</td>
                    <td className="py-3 text-yellow-400">50% Refund</td>
                  </tr>
                  <tr className="border-b border-[#2d3748]">
                    <td className="py-3">After pickup has begun</td>
                    <td className="py-3 text-red-400">No Refund</td>
                  </tr>
                  <tr>
                    <td className="py-3">No-show (package not available)</td>
                    <td className="py-3 text-red-400">No Refund</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">3. How to Request a Cancellation</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              To cancel a delivery and request a refund:
            </p>
            <ol className="list-decimal list-inside text-gray-300 space-y-2 ml-4">
              <li>Call us at <strong>(614) 500-3080</strong> - fastest method</li>
              <li>Reply to your SMS/WhatsApp confirmation with &quot;CANCEL&quot;</li>
              <li>Use the cancellation link in your booking confirmation email</li>
            </ol>
            <p className="text-gray-300 leading-relaxed mt-4">
              Please have your booking confirmation number ready when contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">4. Refund Processing</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Approved refunds are processed as follows:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Refunds are issued to the original payment method</li>
              <li>Credit card refunds: 5-10 business days</li>
              <li>You will receive email confirmation when the refund is processed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">5. Service Issues & Complaints</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you experience any issues with your delivery, you may be eligible for a partial or full 
              refund. Eligible situations include:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Late delivery:</strong> If we miss the agreed delivery window by more than 1 hour 
              without prior communication, you are eligible for a 25% refund</li>
              <li><strong>Failed delivery (our fault):</strong> Full refund if delivery cannot be completed 
              due to our error</li>
              <li><strong>Damaged items:</strong> Compensation up to the declared value (max $500) with 
              photo evidence</li>
              <li><strong>Unprofessional service:</strong> Case-by-case review with potential partial refund</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">6. Non-Refundable Situations</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Refunds will NOT be issued in the following situations:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Customer provides incorrect pickup or delivery address</li>
              <li>No one available at delivery location after reasonable attempts</li>
              <li>Package not ready at scheduled pickup time (no-show)</li>
              <li>Delays due to weather, traffic, or other circumstances beyond our control</li>
              <li>Customer requests prohibited items for delivery</li>
              <li>Cancellation after driver has already picked up the package</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">7. Personal Shopping Service Refunds</h2>
            <p className="text-gray-300 leading-relaxed">
              For our Personal Shopping & Errand service ($75/hour), the following applies:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
              <li>Cancellation before service begins: Full refund</li>
              <li>Cancellation during service: Charged for time already spent</li>
              <li>Items purchased on your behalf are non-refundable through us (return to original store)</li>
              <li>Service fee is separate from item costs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">8. Dispute Resolution</h2>
            <p className="text-gray-300 leading-relaxed">
              If you disagree with a refund decision:
            </p>
            <ol className="list-decimal list-inside text-gray-300 space-y-2 ml-4 mt-4">
              <li>Contact us directly to discuss your case</li>
              <li>Provide any relevant documentation or evidence</li>
              <li>We will review and respond within 48 hours</li>
              <li>If still unresolved, you may dispute through your credit card company</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">9. Satisfaction Guarantee</h2>
            <div className="bg-[#1a1a2e] rounded-lg p-6 border border-[#2d3748]">
              <p className="text-gray-300 leading-relaxed">
                We stand behind our service. If this is your first delivery with us and you are unsatisfied 
                for any reason, contact us within 24 hours and we will work with you to make it right. 
                Your trust matters to us.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[#e94560]">10. Contact for Refunds</h2>
            <p className="text-gray-300 leading-relaxed">
              For refund requests or questions about this policy:
            </p>
            <ul className="list-none text-gray-300 space-y-2 mt-4">
              <li><strong>Phone:</strong> (614) 500-3080</li>
              <li><strong>Email:</strong> support@discreetcourier.com</li>
              <li><strong>Hours:</strong> 7:00 AM - 9:00 PM, 7 days a week</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Please include your booking confirmation number in all communications.
            </p>
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
