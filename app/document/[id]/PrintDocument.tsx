'use client'

export default function PrintDocument({ doc }: { doc: Record<string, unknown> }) {
  const agent = doc.business_agents as Record<string, unknown>
  const metadata = doc.metadata as Record<string, unknown>

  const print = () => {
    const win = window.open('', '_blank')
    if (win) {
      const html = (metadata?.invoiceHTML as string) || (doc.content as string)
      win.document.write(html)
      win.document.close()
      win.print()
    }
  }

  const htmlContent = (metadata?.invoiceHTML as string) || (doc.content as string)
  const isHTML = htmlContent?.trim().startsWith('<!DOCTYPE') || htmlContent?.trim().startsWith('<html')

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        body { margin: 0; background: #111; }
      `}</style>

      <div className="no-print" style={{
        background: '#0a0a0a', padding: '14px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 13 }}>
          {agent?.business_name as string} — {doc.type as string}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'transparent', border: '1px solid #333', color: '#999',
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 12,
            }}>
            ← Back
          </button>
          <button
            onClick={print}
            style={{
              background: '#c8f135', border: 'none', color: '#0a0a0a',
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
            }}>
            Print / Save PDF
          </button>
        </div>
      </div>

      {isHTML ? (
        <iframe
          srcDoc={htmlContent}
          style={{ width: '100%', height: 'calc(100vh - 57px)', border: 'none' }}
          title="Document"
        />
      ) : (
        <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px 80px' }}>
          <div style={{
            background: '#fff', padding: '60px',
            boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
            borderRadius: 12, minHeight: 1000,
            fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.8, color: '#333',
            whiteSpace: 'pre-wrap',
          }}>
            {htmlContent}
          </div>
        </div>
      )}
    </>
  )
}