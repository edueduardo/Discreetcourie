'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phone, Shield, Lock, Clock, Trash2, Package, ChevronRight, Check } from 'lucide-react'

export default function LandingPage() {
  const [hoveredTier, setHoveredTier] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: ATTENTION - Hero
          Objetivo: Capturar em 5 segundos
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Background gradient sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f]" />
        
        {/* Efeito de "névoa" no topo */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0f3460]/20 to-transparent" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge de confiança */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a2e] border border-[#2d3748] mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">Servindo Columbus com discrição desde 2024</span>
          </div>
          
          {/* Headline Principal */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="block">O Que Você Precisa Fazer,</span>
            <span className="block text-[#e94560]">Nós Fazemos.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
            O que você precisa esquecer, já esquecemos.
          </p>
          
          <p className="text-lg text-gray-500 mb-12">
            Entrega confidencial e concierge pessoal em Columbus, OH.
            <br />
            <span className="text-white font-medium">Um motorista. Zero rastros. Confiança absoluta.</span>
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+16145003080" 
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#e94560] hover:bg-[#d63d56] rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              Ligar: (614) 500-3080
            </a>
            <Link 
              href="/concierge/request"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1a1a2e] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-lg font-semibold transition-all"
            >
              Solicitar Discretamente
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>100% Confidencial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Um Único Motorista</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Disponível 24/7</span>
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
          SECTION 2: INTEREST - Benefícios
          Objetivo: Mostrar relevância
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#0f0f17]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por Que Pessoas Inteligentes Nos Escolhem
            </h2>
            <p className="text-gray-400 text-lg">
              Não somos uma empresa de entregas. Somos seu aliado silencioso.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefício 1 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Entrego o que você não pode buscar</h3>
              <p className="text-gray-400">
                Compras discretas, documentos sensíveis, presentes secretos. 
                Sem perguntas, sem julgamentos.
              </p>
            </div>
            
            {/* Benefício 2 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Guardo o que você não pode ter em casa</h3>
              <p className="text-gray-400">
                Cofre Humano - documentos, itens, segredos. 
                Em local seguro, longe de olhos curiosos.
              </p>
            </div>
            
            {/* Benefício 3 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trash2 className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Esqueço o que você precisa que eu esqueça</h3>
              <p className="text-gray-400">
                Destruição de dados com prova em vídeo. 
                Quando acabar, nunca existiu.
              </p>
            </div>
            
            {/* Benefício 4 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Estou aqui quando todos dormem</h3>
              <p className="text-gray-400">
                Guardian Mode 24/7 - emergências reais, qualquer hora. 
                Você nunca está sozinho.
              </p>
            </div>
            
            {/* Benefício 5 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Represento você quando você não pode ir</h3>
              <p className="text-gray-400">
                Procurador de Sombras - eu vou, falo, resolvo no seu lugar. 
                Você fica em paz.
              </p>
            </div>
            
            {/* Benefício 6 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-[#e94560]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Entrego suas últimas palavras</h3>
              <p className="text-gray-400">
                Última Vontade - mensagem ou item entregue após você partir. 
                Seu legado, garantido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3: DESIRE - Prova Social
          Objetivo: Criar confiança e desejo
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Para Quem Valoriza o Silêncio
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Advogados, médicos, executivos e pessoas que entendem 
              que algumas coisas não podem ser confiadas a qualquer um.
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">347+</div>
              <div className="text-gray-400">Entregas Confidenciais</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">100%</div>
              <div className="text-gray-400">Sigilo Mantido</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">0</div>
              <div className="text-gray-400">Vazamentos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">24/7</div>
              <div className="text-gray-400">Disponibilidade VIP</div>
            </div>
          </div>
          
          {/* Quote */}
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-2xl md:text-3xl font-light italic text-gray-300 mb-6">
              "Algumas coisas só podem ser confiadas a quem sabe esquecer."
            </blockquote>
            <div className="w-16 h-1 bg-[#e94560] mx-auto" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4: ACTION - Preços e CTAs
          Objetivo: Converter
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#0f0f17]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto Para Ter Alguém de Confiança?
            </h2>
            <p className="text-gray-400 text-lg">
              Escolha o nível de serviço que você precisa
            </p>
          </div>
          
          {/* Pricing Cards - Ordem reversa para ancoragem */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Tier 4: VIP (Mostrado primeiro para ancoragem) */}
            <div 
              className="relative p-8 rounded-2xl bg-gradient-to-b from-[#e94560]/20 to-[#1a1a2e] border-2 border-[#e94560] hover:transform hover:scale-105 transition-all"
              onMouseEnter={() => setHoveredTier(4)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-[#e94560] rounded-full text-sm font-semibold">
                MAIS COMPLETO
              </div>
              <h3 className="text-xl font-bold mb-2 mt-4">The Fixer</h3>
              <div className="text-3xl font-bold mb-1">$200-500+</div>
              <div className="text-gray-400 text-sm mb-6">por situação</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Guardian Mode 24/7
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Cofre Humano incluso
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Última Vontade
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Destruição de dados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Operações complexas
                </li>
              </ul>
              <Link 
                href="/concierge/request?level=4"
                className="block w-full py-3 text-center rounded-lg bg-[#e94560] hover:bg-[#d63d56] font-semibold transition-colors"
              >
                Aplicar para VIP
              </Link>
            </div>
            
            {/* Tier 3: Concierge */}
            <div 
              className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 hover:transform hover:scale-105 transition-all"
              onMouseEnter={() => setHoveredTier(3)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <h3 className="text-xl font-bold mb-2">Concierge</h3>
              <div className="text-3xl font-bold mb-1">$75-150</div>
              <div className="text-gray-400 text-sm mb-6">por hora</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Compras discretas
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Tarefas pessoais
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Representação
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Modo sem rastro
                </li>
              </ul>
              <Link 
                href="/concierge/request?level=3"
                className="block w-full py-3 text-center rounded-lg bg-[#2d3748] hover:bg-[#3d4758] font-semibold transition-colors"
              >
                Solicitar
              </Link>
            </div>
            
            {/* Tier 2: Discreto */}
            <div 
              className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 hover:transform hover:scale-105 transition-all"
              onMouseEnter={() => setHoveredTier(2)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <h3 className="text-xl font-bold mb-2">Discreto</h3>
              <div className="text-3xl font-bold mb-1">$50-75</div>
              <div className="text-gray-400 text-sm mb-6">por entrega</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Entrega confidencial
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Provas privadas
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Comunicação direta
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Rastreamento opcional
                </li>
              </ul>
              <Link 
                href="/concierge/request?level=2"
                className="block w-full py-3 text-center rounded-lg bg-[#2d3748] hover:bg-[#3d4758] font-semibold transition-colors"
              >
                Solicitar
              </Link>
            </div>
            
            {/* Tier 1: Básico */}
            <div 
              className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 hover:transform hover:scale-105 transition-all"
              onMouseEnter={() => setHoveredTier(1)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <h3 className="text-xl font-bold mb-2">Courier</h3>
              <div className="text-3xl font-bold mb-1">$35-50</div>
              <div className="text-gray-400 text-sm mb-6">por entrega</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Entrega simples
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Um motorista
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Confirmação por foto
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Same-day disponível
                </li>
              </ul>
              <Link 
                href="/concierge/request?level=1"
                className="block w-full py-3 text-center rounded-lg bg-[#2d3748] hover:bg-[#3d4758] font-semibold transition-colors"
              >
                Solicitar
              </Link>
            </div>
          </div>
          
          {/* CTA Final */}
          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-6">Não sabe qual escolher? Ligue e conversamos.</p>
            <a 
              href="tel:+16145003080" 
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1a1a2e] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-lg font-semibold transition-all"
            >
              <Phone className="w-5 h-5" />
              (614) 500-3080 - Ligação Confidencial
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="py-16 px-6 border-t border-[#2d3748]">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-2">Discreet Courier Columbus</h3>
          <p className="text-[#e94560] font-medium mb-4">One Driver. No Trace.</p>
          <p className="text-gray-500 mb-8">
            Sua confiança. Nosso silêncio.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <Link href="/track" className="hover:text-white transition-colors">
              Rastrear Entrega
            </Link>
            <Link href="/portal" className="hover:text-white transition-colors">
              Portal VIP
            </Link>
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-600">
            © 2024 Discreet Courier Columbus. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
