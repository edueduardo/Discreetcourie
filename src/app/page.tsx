import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Shield, Clock, MapPin } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-white">Discreet Courier</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/track">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Track Delivery
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Client Portal
              </Button>
            </Link>
            <Link href="/admin">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Admin Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Professional Discrete Delivery
          <br />
          <span className="text-blue-500">in Columbus, OH</span>
        </h1>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          Confidential, reliable, and professional courier services. 
          Your packages delivered with the utmost discretion and care.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/track">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <MapPin className="mr-2 h-5 w-5" />
              Track Your Package
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Contact Us: (614) 555-0123
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle className="text-white">100% Confidential</CardTitle>
              <CardDescription className="text-slate-400">
                Your privacy is our priority. All deliveries are handled with complete discretion.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Clock className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle className="text-white">Fast & Reliable</CardTitle>
              <CardDescription className="text-slate-400">
                Same-day delivery available. Track your package in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Package className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle className="text-white">Proof of Delivery</CardTitle>
              <CardDescription className="text-slate-400">
                Photo confirmation and digital signature for every delivery.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Need a Delivery?
            </h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Call us directly or use our AI-powered phone assistant 24/7 to schedule your pickup.
            </p>
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-slate-100">
              Call (614) 555-0123
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-500" />
              <span className="text-slate-400">Discreet Courier Columbus</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2024 Discreet Courier. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
