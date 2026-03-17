import { createClient } from '@supabase/supabase-js'
import PrintDocument from './PrintDocument'

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: document } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (!document) return <div style={{ padding: 40, color: '#fff' }}>Document not found</div>

  return <PrintDocument document={document} />
}