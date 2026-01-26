'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Package, MapPin, User, Phone, Mail, Calendar, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function NovoPedidoPage() {
  const [loading, setLoading] = useState(false)
  const [pedidoCriado, setPedidoCriado] = useState<any>(null)

  const [formData, setFormData] = useState({
    // Informações do cliente
    cliente_nome: '',
    cliente_email: '',
    cliente_telefone: '',

    // Endereços
    endereco_coleta: '',
    endereco_entrega: '',

    // Detalhes do pedido
    data_agendada: '',
    hora_agendada: '10:00',
    tipo_item: '',
    descricao_item: '',
    instrucoes_especiais: '',

    // Preço (será calculado automaticamente ou informado)
    preco: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica
    if (!formData.cliente_nome || !formData.cliente_telefone) {
      toast.error('Nome e telefone são obrigatórios')
      return
    }

    if (!formData.endereco_coleta || !formData.endereco_entrega) {
      toast.error('Endereços de coleta e entrega são obrigatórios')
      return
    }

    setLoading(true)

    try {
      // 1. Criar ou buscar cliente
      const clienteResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.cliente_nome,
          email: formData.cliente_email,
          phone: formData.cliente_telefone,
          code_name: `CLIENT-${Date.now()}` // Gera code_name automático
        })
      })

      if (!clienteResponse.ok) {
        throw new Error('Erro ao criar cliente')
      }

      const cliente = await clienteResponse.json()

      // 2. Criar pedido
      const pedidoResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: cliente.id,
          pickup_address: formData.endereco_coleta,
          delivery_address: formData.endereco_entrega,
          scheduled_date: formData.data_agendada || new Date().toISOString().split('T')[0],
          scheduled_time: formData.hora_agendada,
          item_type: formData.tipo_item || 'Pacote',
          item_description: formData.descricao_item,
          special_instructions: formData.instrucoes_especiais,
          price: formData.preco || 25.00, // Preço mínimo padrão
          service_level: 1,
          no_trace_mode: false
        })
      })

      if (!pedidoResponse.ok) {
        const errorData = await pedidoResponse.json()
        throw new Error(errorData.error || 'Erro ao criar pedido')
      }

      const pedido = await pedidoResponse.json()

      // 3. Enviar notificação SMS ao cliente
      try {
        await fetch('/api/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.cliente_telefone,
            message: `✅ Pedido criado!\n\nCódigo de rastreamento: ${pedido.tracking_code}\n\nAcompanhe em: ${window.location.origin}/track?code=${pedido.tracking_code}\n\n- Discreet Courier`
          })
        })
      } catch (smsError) {
        console.warn('SMS não enviado:', smsError)
      }

      // 4. Enviar notificação WhatsApp
      try {
        await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.cliente_telefone,
            message: `✅ Pedido criado com sucesso!\n\n📦 Código: ${pedido.tracking_code}\n📍 De: ${formData.endereco_coleta}\n📍 Para: ${formData.endereco_entrega}\n\n🔗 Rastreie aqui: ${window.location.origin}/track?code=${pedido.tracking_code}`
          })
        })
      } catch (whatsappError) {
        console.warn('WhatsApp não enviado:', whatsappError)
      }

      setPedidoCriado(pedido)
      toast.success('Pedido criado com sucesso! 🎉')

      // Limpar formulário
      setFormData({
        cliente_nome: '',
        cliente_email: '',
        cliente_telefone: '',
        endereco_coleta: '',
        endereco_entrega: '',
        data_agendada: '',
        hora_agendada: '10:00',
        tipo_item: '',
        descricao_item: '',
        instrucoes_especiais: '',
        preco: 0
      })

    } catch (error: any) {
      console.error('Erro ao criar pedido:', error)
      toast.error(error.message || 'Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  if (pedidoCriado) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full bg-slate-800 border-green-500/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-3xl text-white mb-2">Pedido Criado! 🎉</CardTitle>
            <CardDescription className="text-lg">
              Seu código de rastreamento é:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 text-center">
              <p className="text-sm text-slate-400 mb-2">Código de Rastreamento</p>
              <p className="text-3xl font-mono font-bold text-green-500">
                {pedidoCriado.tracking_code}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">De:</span>
                <span className="text-white text-right">{pedidoCriado.pickup_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Para:</span>
                <span className="text-white text-right">{pedidoCriado.delivery_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-yellow-500 uppercase">{pedidoCriado.status}</span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                📱 Você receberá atualizações por SMS/WhatsApp quando o status mudar.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = `/track?code=${pedidoCriado.tracking_code}`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                🔍 Rastrear Pedido Agora
              </Button>
              <Button
                onClick={() => setPedidoCriado(null)}
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                ➕ Criar Novo Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <Package className="h-10 w-10" />
            Novo Pedido
          </h1>
          <p className="text-lg text-blue-100">
            Crie seu pedido em menos de 2 minutos
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Cliente */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Suas Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome Completo *</Label>
                <Input
                  required
                  placeholder="João Silva"
                  value={formData.cliente_nome}
                  onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone *
                  </Label>
                  <Input
                    required
                    type="tel"
                    placeholder="(614) 555-0100"
                    value={formData.cliente_telefone}
                    onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email (opcional)
                  </Label>
                  <Input
                    type="email"
                    placeholder="joao@email.com"
                    value={formData.cliente_email}
                    onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereços */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-500" />
                Endereços
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Endereço de Coleta *</Label>
                <Input
                  required
                  placeholder="123 Main St, Columbus, OH 43215"
                  value={formData.endereco_coleta}
                  onChange={(e) => setFormData({ ...formData, endereco_coleta: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Endereço de Entrega *</Label>
                <Input
                  required
                  placeholder="456 Oak Ave, Columbus, OH 43201"
                  value={formData.endereco_entrega}
                  onChange={(e) => setFormData({ ...formData, endereco_entrega: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do Pedido */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-500" />
                Detalhes do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data da Coleta
                  </Label>
                  <Input
                    type="date"
                    value={formData.data_agendada}
                    onChange={(e) => setFormData({ ...formData, data_agendada: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário Preferido
                  </Label>
                  <Input
                    type="time"
                    value={formData.hora_agendada}
                    onChange={(e) => setFormData({ ...formData, hora_agendada: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Tipo do Item</Label>
                <Input
                  placeholder="Ex: Documentos, Pacote, Envelope"
                  value={formData.tipo_item}
                  onChange={(e) => setFormData({ ...formData, tipo_item: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Descrição do Item</Label>
                <Textarea
                  placeholder="Descreva o que será entregue..."
                  value={formData.descricao_item}
                  onChange={(e) => setFormData({ ...formData, descricao_item: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Instruções Especiais</Label>
                <Textarea
                  placeholder="Alguma instrução especial para coleta ou entrega?"
                  value={formData.instrucoes_especiais}
                  onChange={(e) => setFormData({ ...formData, instrucoes_especiais: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-sm text-blue-300">
                  <p>
                    📱 Você receberá um SMS com o código de rastreamento assim que criarmos seu pedido.
                  </p>
                  <p>
                    🔔 Notificaremos você sobre todas as atualizações do status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Criando Pedido...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Criar Pedido
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
