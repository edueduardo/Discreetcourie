'use client'

export function AIChatbotSimple() {
  return (
    <button
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        zIndex: 9999,
        fontSize: '24px',
      }}
      onClick={() => alert('Chatbot funcionando!')}
    >
      💬
    </button>
  )
}
