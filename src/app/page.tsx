export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

type Category = {
  id: string
  name: string
  sort_order: number
}

async function fetchDbData(): Promise<{
  categories: Category[] | null
  settingsCount: number
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const [catResult, settingsResult] = await Promise.all([
      supabase
        .from('room_categories')
        .select('id, name, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('settings')
        .select('key, label')
        .eq('is_public', true),
    ])

    if (catResult.error) {
      console.error('[Phase 1.4] room_categories fetch error:', catResult.error)
      return { categories: null, settingsCount: 0, error: catResult.error.message }
    }

    if (settingsResult.error) {
      console.error('[Phase 1.4] settings fetch error:', settingsResult.error)
      return {
        categories: catResult.data,
        settingsCount: 0,
        error: settingsResult.error.message,
      }
    }

    return {
      categories: catResult.data,
      settingsCount: settingsResult.data?.length ?? 0,
      error: null,
    }
  } catch (err) {
    console.error('[Phase 1.4] Unexpected error connecting to Supabase:', err)
    return {
      categories: null,
      settingsCount: 0,
      error: 'Não foi possível conectar ao banco de dados.',
    }
  }
}

export default async function DatabaseVerificationPage() {
  const { categories, settingsCount, error } = await fetchDbData()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-b from-ocean-50 to-background pt-10 pb-12 px-6 md:px-12 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold text-ocean-500 tracking-widest uppercase bg-ocean-50 border border-ocean-100 px-3 py-1 rounded-full mb-4">
            Fase 1.4 — Verificação do Banco
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-ocean-800 leading-tight">
            Sofia&apos;s on the Beach
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Verificação de conexão com o Supabase
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 md:px-12 py-12 space-y-5">
        {error ? (
          /* Error state */
          <div className="bg-card border border-destructive/30 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-destructive text-lg font-bold leading-none">!</span>
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold text-foreground mb-1">
                  Erro de conexão
                </h2>
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar os dados do banco. Verifique as variáveis de
                  ambiente e a conectividade com o Supabase.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Success status */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-ocean-50 border border-ocean-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-ocean-500 font-bold leading-none">✓</span>
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-1">
                    Banco de dados conectado com sucesso
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    A conexão com o Supabase está ativa e as políticas de leitura pública
                    estão funcionando.
                  </p>
                </div>
              </div>
            </div>

            {/* Room categories */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-8 py-5 border-b border-border flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  Categorias de Quartos
                </h3>
                <span className="text-xs font-bold text-ocean-500 bg-ocean-50 border border-ocean-100 px-3 py-1 rounded-full">
                  {categories?.length ?? 0} categorias
                </span>
              </div>
              <ul className="divide-y divide-border">
                {categories?.map((cat) => (
                  <li
                    key={cat.id}
                    className="px-8 py-4 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ordem {cat.sort_order}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Public settings */}
            <div className="bg-card border border-border rounded-2xl p-8 flex items-start justify-between gap-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
                  Configurações Públicas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Apenas chaves com{' '}
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    is_public = true
                  </code>{' '}
                  são lidas aqui. Chaves privadas (Asaas, PIX) nunca chegam ao browser.
                </p>
              </div>
              <span className="text-xs font-bold text-sand-500 bg-sand-50 border border-sand-200 px-3 py-1 rounded-full shrink-0">
                {settingsCount} configurações
              </span>
            </div>
          </>
        )}
      </main>

      <footer className="bg-ocean-900 py-8 px-6 md:px-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-ocean-300 text-sm">
            Sofia&apos;s on the Beach — Fase 1.4 concluída
          </p>
        </div>
      </footer>
    </div>
  )
}
