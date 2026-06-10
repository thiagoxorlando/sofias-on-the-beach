import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import fs from 'node:fs'
import path from 'node:path'
import { requireAdmin } from '@/lib/auth'
import { PrintButton } from './_components/PrintButton'

export const metadata: Metadata = {
  title: "Guia de Uso — Sofia's on the Beach",
  robots: { index: false, follow: false },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function imgExists(filename: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', 'images', 'manual', filename))
}

function Screenshot({ filename, label }: { filename: string; label: string }) {
  if (imgExists(filename)) {
    return (
      <figure
        className="my-6 rounded-2xl overflow-hidden avoid-break"
        style={{
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 24px rgba(0,30,60,0.09)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/manual/${filename}`}
          alt={label}
          className="w-full h-auto block"
        />
        <figcaption
          className="px-4 py-2.5 text-[11px] text-center italic"
          style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', color: '#94A3B8' }}
        >
          {label}
        </figcaption>
      </figure>
    )
  }
  // Placeholder — shown only when the image file is missing
  return (
    <div
      className="screenshot-ph my-5 rounded-xl text-center avoid-break"
      style={{ border: '2px dashed #CBD5E1', padding: '28px 24px' }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2.5"
        style={{ background: '#F1F5F9', color: '#94A3B8' }}
      >
        <CameraIcon />
      </div>
      <p className="text-[13px] font-semibold" style={{ color: '#64748B' }}>
        {label}
      </p>
      <p className="text-[11px] mt-1" style={{ color: '#94A3B8', fontFamily: 'monospace' }}>
        public/images/manual/{filename}
      </p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ClientGuidePage() {
  const admin = await requireAdmin()
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return (
    <>
      {/* ── Print + document styles ─────────────────────────────────────── */}
      <style>{`
        * { box-sizing: border-box; }
        .body-text  { font-size: 14px; color: #334155; line-height: 1.75; margin-top: 10px; }
        .list-disc  { list-style-type: disc; font-size: 14px; color: #475569; line-height: 1.75; margin-left: 4px; }
        @media print {
          * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
          @page { size: A4; margin: 14mm 18mm; }
          body, html { height: auto !important; overflow: visible !important; background: white !important; }
          .no-print  { display: none !important; }
          .page-break { page-break-before: always; break-before: page; margin-top: 0 !important; padding-top: 28px; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          .screenshot-ph { padding: 16px 20px !important; }
        }
        @media screen {
          .guide-page { padding-bottom: 80px; }
        }
      `}</style>

      <div className="guide-page bg-white min-h-screen">
        <div className="max-w-[760px] mx-auto px-8 py-10">

          {/* ── Screen-only toolbar ─────────────────────────────────────── */}
          <div className="no-print flex items-start justify-between gap-6 mb-10 pb-6 border-b border-slate-200">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                Uso interno — não publicado
              </p>
              <p className="text-[13px] text-slate-600">
                Abra o menu do navegador → <strong>Imprimir</strong>, ou clique no botão ao lado.
              </p>
              <p className="text-[12px] text-amber-700 mt-1.5">
                Na janela de impressão, desative <strong>Cabeçalhos e rodapés</strong> para remover URL e número de páginas.
              </p>
            </div>
            <PrintButton />
          </div>

          {/* ══════════════════════════════════════════════════════════════
              CAPA
          ══════════════════════════════════════════════════════════════ */}
          <section className="avoid-break">

            {/* ── Navy header band ─────────────────────────────────── */}
            <div
              className="rounded-2xl text-center px-10 py-14"
              style={{ background: 'linear-gradient(150deg, #061A2A 0%, #0B2E4A 55%, #0D3D5E 100%)' }}
            >
              {/* Logo on solid white card */}
              <div className="flex justify-center mb-7">
                <div
                  className="w-[110px] h-[110px] rounded-[24px] flex items-center justify-center"
                  style={{
                    background: '#FFFFFF',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.38)',
                  }}
                >
                  <Image
                    src="/images/experience/sofias_icon_transparent.png"
                    alt="Sofia's on the Beach"
                    width={72}
                    height={72}
                    className="w-[72px] h-[72px] object-contain"
                  />
                </div>
              </div>

              {/* Brand name */}
              <p
                className="font-serif font-bold"
                style={{ color: '#FFFFFF', fontSize: '34px', letterSpacing: '0.04em', marginBottom: '8px', lineHeight: '1.1' }}
              >
                Sofia&apos;s on the Beach
              </p>

              {/* Location */}
              <p
                className="font-semibold uppercase"
                style={{ color: '#5FAED4', fontSize: '12px', letterSpacing: '0.28em' }}
              >
                Búzios · RJ
              </p>
            </div>

            {/* ── Document titles ───────────────────────────────────── */}
            <div className="text-center pt-8 pb-5">
              <h1 className="font-serif text-[40px] font-bold text-slate-800 leading-tight mb-2">
                Guia rápido de uso
              </h1>
              <p className="font-serif text-[19px] font-normal text-slate-400 mb-5">
                Painel de Gerência e Recepção
              </p>
              <div
                className="w-12 h-[3px] rounded-full mx-auto"
                style={{ background: '#B8D9E8' }}
              />
            </div>

            {/* ── Access card ───────────────────────────────────────── */}
            <div
              className="rounded-2xl px-7 py-5 mb-5"
              style={{ background: '#EEF6FC', border: '1px solid #BAD8EE' }}
            >
              <p
                className="font-bold uppercase mb-4"
                style={{ fontSize: '10px', letterSpacing: '0.22em', color: '#1E4E6E' }}
              >
                Acesso — Gerência
              </p>
              <div className="space-y-2.5">
                <AccessRow label="E-mail" value="gerencia@sofiasbuzios.com" />
                <AccessRow label="Senha" value="12345678" />
                <AccessRow label="Entrar" value="/entrar" />
              </div>
            </div>

            {/* ── Description + date ────────────────────────────────── */}
            <div
              className="rounded-2xl px-7 py-4 text-center"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.75' }}>
                Este guia mostra como usar as principais áreas do painel.
                Consulte sempre que precisar de referência rápida.
              </p>
            </div>

          </section>

          {/* ══════════════════════════════════════════════════════════════
              SEÇÃO 1 — Como acessar o sistema
          ══════════════════════════════════════════════════════════════ */}
          <section className="page-break">
            <SectionNumber n="1" />
            <SectionTitle>Como acessar o sistema</SectionTitle>

            <p className="body-text">
              O painel é acessado por um endereço web específico fornecido pelo responsável pelo sistema.
              Cada membro da equipe tem o seu próprio login (e-mail e senha).
            </p>

            <Steps>
              <Step n={1}>Abra o navegador e acesse o endereço do painel.</Step>
              <Step n={2}>Na tela de login, informe o e-mail e a senha cadastrados.</Step>
              <Step n={3}>Clique em <strong>Entrar</strong>.</Step>
              <Step n={4}>O sistema redireciona automaticamente para a área correspondente ao seu perfil.</Step>
            </Steps>

            <Screenshot filename="login.png" label="Imagem: Tela de login" />

            <InfoBox>
              <strong>Gerência</strong> é direcionada ao painel completo de gestão.{' '}
              <strong>Recepção</strong> é direcionada diretamente à estação de trabalho da recepção.
            </InfoBox>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              SEÇÃO 2 — Perfil Gerência — visão geral
              (flows after section 1, no forced page break)
          ══════════════════════════════════════════════════════════════ */}
          <section className="mt-12">
            <SectionNumber n="2" />
            <SectionTitle>Perfil Gerência — visão geral</SectionTitle>

            <p className="body-text">
              O perfil de Gerência tem acesso a todas as áreas operacionais e de gestão do painel:
              reservas, hóspedes, quartos, disponibilidade, financeiro e configurações da pousada.
              É o perfil indicado para supervisionar as operações do dia a dia e manter os dados atualizados.
            </p>

            <Screenshot filename="manager-dashboard.png" label="Imagem: Painel inicial da Gerência" />
          </section>

          {/* ══════════════════════════════════════════════════════════════
              SEÇÃO 3 — Menu Gerência
          ══════════════════════════════════════════════════════════════ */}
          <section className="page-break">
            <SectionNumber n="3" />
            <SectionTitle>Itens do menu — Gerência</SectionTitle>

            <p className="body-text">
              O menu lateral da Gerência dá acesso às seguintes áreas:
            </p>

            <SubSection n="3.1" title="Visão geral">
              <p className="body-text">
                Tela inicial do painel. Mostra um resumo do dia: entradas e saídas previstas, ocupação dos quartos,
                alertas pendentes e atalhos para as ações mais comuns. Ideal para começar o dia com uma visão
                rápida da pousada.
              </p>
              <Screenshot filename="manager-dashboard.png" label="Imagem: Visão geral" />
            </SubSection>

            <SubSection n="3.2" title="Recepção">
              <p className="body-text">
                Exibe a visão operacional da recepção: check-ins e check-outs do dia, status dos quartos e
                alertas em aberto. Útil para a Gerência acompanhar o que está acontecendo na recepção
                sem precisar estar no balcão.
              </p>
              <Screenshot filename="reception.png" label="Imagem: Tela da Recepção" />
            </SubSection>

            <SubSection n="3.3" title="Reservas">
              <p className="body-text">
                Lista todas as reservas da pousada. Permite filtrar por status, datas e hóspede.
                Clique em qualquer reserva para abrir os detalhes completos: hóspede, quarto, datas,
                valor e status de pagamento. A Gerência pode criar, editar e gerenciar reservas por aqui.
              </p>
              <Screenshot filename="reservations.png" label="Imagem: Lista de reservas" />
            </SubSection>

            <SubSection n="3.4" title="Hóspedes">
              <p className="body-text">
                Cadastro completo de hóspedes. Use o campo de busca para encontrar um hóspede pelo nome,
                e-mail ou telefone. Cada registro mostra o histórico de reservas e informações de contato.
              </p>
              <Screenshot filename="guests.png" label="Imagem: Lista de hóspedes" />
            </SubSection>

            <SubSection n="3.5" title="Quartos">
              <p className="body-text">
                Gerencia as informações dos quartos: número, nome, categoria, capacidade máxima, diária base
                e status (ativo/inativo). Mantenha os dados dos quartos sempre atualizados para que as
                reservas reflitam as informações corretas.
              </p>
              <Screenshot filename="rooms.png" label="Imagem: Quartos" />
            </SubSection>

            <SubSection n="3.6" title="Disponibilidade">
              <p className="body-text">
                Calendário de disponibilidade por quarto. Permite visualizar quais datas estão ocupadas,
                bloqueadas ou livres. Use esta tela para bloquear datas indisponíveis, feriados internos
                ou períodos especiais, evitando reservas indesejadas.
              </p>
              <Screenshot filename="availability.png" label="Imagem: Disponibilidade" />
            </SubSection>

            <SubSection n="3.7" title="Financeiro">
              <p className="body-text">
                Registros de pagamentos vinculados às reservas. Mostra o método de pagamento, valor e
                status de cada cobrança. Quando um pagamento é combinado diretamente com o hóspede,
                é aqui que o registro fica disponível para consulta e confirmação manual pela equipe.
              </p>
              <Screenshot filename="finance.png" label="Imagem: Financeiro" />
            </SubSection>

            <SubSection n="3.8" title="Configurações">
              <p className="body-text">
                Dados gerais da pousada: nome, e-mail de contato, telefone, WhatsApp, endereço, redes sociais,
                horários de check-in e check-out, políticas e mensagens de confirmação. Também inclui
                informações internas de pagamento, quando utilizadas pela equipe, e o controle da reserva
                online no site. Apenas Gerência e Admin têm acesso às Configurações.
              </p>
              <Screenshot filename="settings.png" label="Imagem: Configurações" />
            </SubSection>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              SEÇÃO 4 — Perfil Recepção
          ══════════════════════════════════════════════════════════════ */}
          <section className="page-break">
            <SectionNumber n="4" />
            <SectionTitle>Perfil Recepção — estação de trabalho</SectionTitle>

            <p className="body-text">
              O perfil de Recepção acessa uma estação de trabalho simplificada, focada nas tarefas do
              balcão: check-ins, check-outs, criação de reservas presenciais e busca de informações.
              Não há acesso às configurações nem às telas de gestão.
            </p>

            <Screenshot filename="reception.png" label="Imagem: Tela principal da Recepção" />

            <SubSection n="4.1" title="Fila do dia">
              <p className="body-text">
                Mostra os hóspedes com check-in e check-out previstos para o dia. Para cada entrada ou
                saída, é possível verificar o status do quarto, o pagamento e abrir a reserva com um clique.
                Use esta tela como ponto de partida ao iniciar o turno.
              </p>
            </SubSection>

            <SubSection n="4.2" title="Fazer check-in">
              <p className="body-text">
                Abra a reserva do hóspede. Verifique se o quarto está pronto e se não há pendências.
                Clique no botão <strong>Check-in</strong> para registrar a entrada. O sistema atualiza
                o status da reserva automaticamente.
              </p>
            </SubSection>

            <SubSection n="4.3" title="Fazer check-out">
              <p className="body-text">
                Abra a reserva do hóspede. Confirme a saída e verifique se há cobranças extras pendentes
                ou pagamentos em aberto. Clique em <strong>Check-out</strong> para registrar a saída.
                O status do quarto será atualizado internamente.
              </p>
            </SubSection>

            <SubSection n="4.4" title="Nova reserva / Walk-in">
              <p className="body-text">
                Cria uma reserva para um hóspede que chegou diretamente na pousada (sem reserva prévia).
                Informe as datas, escolha o quarto disponível, preencha os dados do hóspede e selecione
                a forma de pagamento combinada. A reserva é criada e registrada imediatamente no sistema.
              </p>
            </SubSection>

            <SubSection n="4.5" title="Buscar reserva">
              <p className="body-text">
                Encontre uma reserva pelo nome do hóspede, código da reserva, data de chegada, quarto
                ou telefone. Clique no resultado para abrir os detalhes completos e realizar ações
                (check-in, check-out, notas, pagamento).
              </p>
            </SubSection>

            <SubSection n="4.6" title="Buscar hóspede">
              <p className="body-text">
                Pesquise no cadastro de hóspedes para confirmar informações, verificar reservas anteriores
                ou encontrar dados de contato. Útil para identificar hóspedes recorrentes.
              </p>
            </SubSection>

            <SubSection n="4.7" title="Ver entradas e saídas por data">
              <p className="body-text">
                Escolha uma data específica para visualizar todas as chegadas e saídas previstas para
                aquele dia. Facilita o planejamento antecipado e a preparação dos quartos.
              </p>
            </SubSection>

            <SubSection n="4.8" title="Notificações e alertas">
              <p className="body-text">
                O ícone de sino no topo da tela indica alertas operacionais pendentes: pagamentos
                aguardando confirmação, quartos ainda não prontos ou reservas com pendências.
                Clique no alerta para abrir diretamente a reserva correspondente.
              </p>
            </SubSection>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              SEÇÃO 5 — Detalhe da reserva
              (flows naturally after section 4)
          ══════════════════════════════════════════════════════════════ */}
          <section className="mt-12">
            <SectionNumber n="5" />
            <SectionTitle>Página de detalhe da reserva</SectionTitle>

            <p className="body-text">
              Ao clicar em qualquer reserva (tanto pela Gerência quanto pela Recepção), você acessa
              a página de detalhes. Esta é a principal tela de trabalho para operações vinculadas
              a uma reserva específica.
            </p>

            <Screenshot filename="reservation-detail.png" label="Imagem: Detalhe da reserva" />

            <p className="body-text">Ações disponíveis na página de detalhe:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <li className="list-disc">Consultar dados do hóspede e da acomodação</li>
              <li className="list-disc">Verificar datas, valor total e status da reserva</li>
              <li className="list-disc">Registrar ou confirmar pagamento manual</li>
              <li className="list-disc">Realizar check-in ou check-out</li>
              <li className="list-disc">Adicionar notas internas (visíveis apenas pela equipe)</li>
              <li className="list-disc">Imprimir a ficha do hóspede</li>
              <li className="list-disc">Visualizar o histórico de eventos da reserva</li>
            </ul>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              SEÇÃO 6 — Situação atual do site
          ══════════════════════════════════════════════════════════════ */}
          <section className="mt-12 avoid-break">
            <SectionNumber n="6" />
            <SectionTitle>Situação atual do site</SectionTitle>

            <div
              className="mt-5 rounded-2xl px-7 py-6"
              style={{
                background: '#FFFBEB',
                border: '2px solid #FDE68A',
              }}
            >
              <p
                className="font-bold uppercase mb-3"
                style={{ fontSize: '11px', letterSpacing: '0.14em', color: '#92400E' }}
              >
                Informação importante — lançamento
              </p>
              <p style={{ fontSize: '15px', color: '#78350F', lineHeight: '1.7' }}>
                No momento, o site público funciona como página de apresentação e contato.
                Reservas online e pagamentos pelo site não estão ativos. O atendimento e confirmação
                de reservas devem ser feitos diretamente pela equipe, via WhatsApp ou presencialmente.
              </p>
            </div>

            <div
              className="mt-5 rounded-2xl px-7 py-5"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7' }}>
                O painel interno (check-ins, check-outs, reservas manuais e registros de pagamento)
                funciona normalmente. Apenas a etapa de reserva e pagamento pelo site público está
                desativada por enquanto.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              SEÇÃO 7 — Suporte
          ══════════════════════════════════════════════════════════════ */}
          <section className="mt-10 avoid-break">
            <SectionNumber n="7" />
            <SectionTitle>Suporte</SectionTitle>

            <div
              className="rounded-2xl px-7 py-6"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.75' }}>
                Em caso de dúvida ou dificuldade com o sistema, entre em contato com o responsável
                pelo sistema. Anote o que estava fazendo quando o problema ocorreu para facilitar
                o suporte.
              </p>
            </div>
          </section>

          {/* ── Document footer ────────────────────────────────────────── */}
          <footer
            className="mt-16 pt-5"
            style={{ borderTop: '1px solid #E2E8F0', fontSize: '11px', color: '#94A3B8' }}
          >
            <span>Sofia&apos;s on the Beach — Guia rápido de uso</span>
          </footer>

        </div>{/* /max-w */}
      </div>{/* /guide-page */}
    </>
  )
}

// ── Layout components ─────────────────────────────────────────────────────────

function SectionNumber({ n }: { n: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-2">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
        style={{ background: '#0B2235' }}
      >
        {n}
      </span>
      <span
        className="font-bold uppercase"
        style={{ fontSize: '10px', letterSpacing: '0.22em', color: '#94A3B8' }}
      >
        Seção {n}
      </span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h2 className="font-serif text-[28px] font-bold text-slate-800 leading-snug mb-2">
        {children}
      </h2>
      <div
        className="w-10 h-[3px] rounded-full mb-5"
        style={{ background: '#B8D9E8' }}
      />
    </>
  )
}

function SubSection({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div
      className="mt-6 pl-4"
      style={{ borderLeft: '3px solid #E2EFF5' }}
    >
      <h3 className="text-[15px] font-bold text-slate-800 mb-1">
        <span className="font-semibold mr-2" style={{ color: '#4A90B8' }}>{n}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="mt-4 space-y-3">{children}</ol>
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0"
        style={{ background: '#0B2235' }}
      >
        {n}
      </span>
      <span style={{ fontSize: '14px', color: '#334155', lineHeight: '1.75' }}>
        {children}
      </span>
    </li>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-5 rounded-xl px-5 py-4 text-[13px] leading-relaxed"
      style={{ background: '#EEF6FC', border: '1px solid #BAD8EE', color: '#1E4E6E' }}
    >
      {children}
    </div>
  )
}

function AccessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className="shrink-0 font-semibold uppercase"
        style={{ width: '120px', fontSize: '11px', color: '#4A7FA0', letterSpacing: '0.12em' }}
      >
        {label}
      </span>
      <span
        className="font-mono font-semibold"
        style={{ fontSize: '14px', color: '#0B2235', letterSpacing: '0.04em' }}
      >
        {value}
      </span>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  )
}
