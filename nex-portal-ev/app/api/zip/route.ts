import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { ids } = await request.json() as { ids: string[] }
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'IDs obrigatórios' }, { status: 400 })
    }

    const { data: imagens } = await supabase
      .from('imagens')
      .select('id, nome, arquivo_url')
      .in('id', ids)

    if (!imagens || imagens.length === 0) {
      return NextResponse.json({ error: 'Imagens não encontradas' }, { status: 404 })
    }

    const zip = new JSZip()

    await Promise.all(
      imagens.map(async (img) => {
        if (!img.arquivo_url) return
        const { data } = await supabase.storage
          .from('ev-portal')
          .download(img.arquivo_url)
        if (data) {
          const ext = img.arquivo_url.split('.').pop() ?? 'jpg'
          zip.file(`${img.nome}.${ext}`, data)
        }
      })
    )

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="nex-imagens.zip"',
      },
    })
  } catch (error) {
    console.error('Zip error:', error)
    return NextResponse.json({ error: 'Erro ao gerar ZIP' }, { status: 500 })
  }
}
