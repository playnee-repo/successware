import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileDown, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { artefatoService } from '@/shared/api/container'
import type { Project } from '@/entities/project/model/types'
import type { Iteration } from '@/entities/iteration/model/types'
import type { Atividade, Artefato } from '@/entities/artifact/model/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportAtividade = {
  id: string
  nome: string
  descricao: string | null
  disciplina: string
  ordem: number
  agente: string
  insumo?: {
    versao: number
    status: string
    tipo: string
    conteudo_md: string | null
    link_url: string | null
    link_titulo: string | null
  }
}

type ExportDisciplina = {
  id: string
  label: string
  atividades: ExportAtividade[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DISC_LABELS: Record<string, string> = {
  descoberta: 'Descoberta',
  requisitos: 'Engenharia de Requisitos',
  arquitetura: 'Arquitetura',
  construcao: 'Construção',
  qualidade: 'Qualidade',
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em Revisão',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}

// ─── Print CSS ────────────────────────────────────────────────────────────────

const PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    line-height: 1.7;
    color: #111827;
    background: #fff;
    max-width: 860px;
    margin: 0 auto;
    padding: 40px 48px;
  }

  /* Cover */
  .cover { margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
  .cover h1 { font-size: 26px; font-weight: 800; color: #111827; margin-bottom: 6px; }
  .cover .meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .cover .iteracao { font-size: 13px; color: #374151; font-weight: 500; margin-top: 6px; }

  /* Discipline sections */
  .discipline + .discipline { page-break-before: always; }
  .discipline { margin-bottom: 48px; }
  .discipline-header {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 24px;
  }
  .discipline-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  }
  .discipline-name { font-size: 18px; font-weight: 700; color: #111827; }
  .discipline-count { font-size: 11px; color: #9ca3af; margin-left: auto; }

  /* Activity */
  .activity { margin-bottom: 28px; page-break-inside: avoid; }
  .activity-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f3f4f6;
  }
  .activity-name { font-size: 15px; font-weight: 600; color: #1f2937; }
  .activity-agent {
    font-size: 10px; font-weight: 700;
    padding: 2px 6px; border-radius: 4px;
    background: #ede9fe; color: #7c3aed;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .activity-version { font-size: 11px; color: #9ca3af; margin-left: auto; }
  .status-aprovado { color: #059669; }
  .status-rascunho { color: #6b7280; }
  .status-em_revisao { color: #d97706; }
  .status-rejeitado { color: #dc2626; }

  /* Activity description */
  .activity-desc {
    font-size: 12px; color: #6b7280; margin-bottom: 12px;
    font-style: italic; line-height: 1.5;
  }

  /* No content */
  .no-content { font-size: 12px; color: #d1d5db; font-style: italic; padding: 8px 0; }

  /* Markdown content */
  .md-content { font-size: 13px; line-height: 1.7; color: #1f2937; }
  .md-content p { margin: 8px 0; }
  .md-content h1 { font-size: 17px; font-weight: 700; margin: 20px 0 8px; color: #111827; }
  .md-content h2 { font-size: 15px; font-weight: 700; margin: 16px 0 6px; color: #1f2937; }
  .md-content h3 { font-size: 13px; font-weight: 600; margin: 12px 0 4px; color: #374151; }
  .md-content h4 { font-size: 12px; font-weight: 600; margin: 10px 0 4px; color: #4b5563; }
  .md-content ul { list-style: disc; padding-left: 20px; margin: 8px 0; }
  .md-content ol { list-style: decimal; padding-left: 20px; margin: 8px 0; }
  .md-content li { margin: 3px 0; }
  .md-content li > ul, .md-content li > ol { margin: 2px 0; }
  .md-content strong { font-weight: 600; }
  .md-content em { font-style: italic; }
  .md-content code {
    background: #f3f4f6; padding: 1px 5px; border-radius: 4px;
    font-size: 11px; font-family: 'SF Mono', 'Fira Code', monospace; color: #374151;
  }
  .md-content pre {
    background: #f3f4f6; padding: 14px 16px; border-radius: 6px;
    overflow-x: auto; margin: 10px 0; page-break-inside: avoid;
  }
  .md-content pre code { background: none; padding: 0; font-size: 11px; }
  .md-content blockquote {
    border-left: 3px solid #6366f1; padding: 6px 12px;
    margin: 10px 0; color: #6b7280; font-style: italic;
    background: #f5f3ff; border-radius: 0 4px 4px 0;
  }
  .md-content table { width: 100%; border-collapse: collapse; margin: 12px 0; page-break-inside: avoid; }
  .md-content th {
    background: #f9fafb; font-weight: 600; padding: 8px 12px;
    border: 1px solid #e5e7eb; text-align: left; font-size: 12px;
  }
  .md-content td { padding: 7px 12px; border: 1px solid #e5e7eb; font-size: 12px; }
  .md-content tr:nth-child(even) td { background: #f9fafb; }
  .md-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
  .md-content a { color: #6366f1; text-decoration: underline; }

  /* Print-specific */
  @media print {
    body { padding: 20px 32px; max-width: 100%; }
    .no-print { display: none !important; }
    .discipline + .discipline { page-break-before: always; }
    .activity { page-break-inside: avoid; }
    .discipline-header { background: #f9fafb !important; }
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
`

// ─── Data hook ────────────────────────────────────────────────────────────────

function buildExportDisciplinas(atividades: Atividade[], artefatos: Artefato[]): ExportDisciplina[] {
  const insumoMap = new Map<string, Artefato>()
  for (const ins of artefatos) {
    if (!insumoMap.has(ins.atividade_id)) insumoMap.set(ins.atividade_id, ins)
  }

  const discOrder: string[] = []
  const discMap = new Map<string, ExportAtividade[]>()

  for (const atv of atividades) {
    if (!discMap.has(atv.disciplina)) {
      discOrder.push(atv.disciplina)
      discMap.set(atv.disciplina, [])
    }
    const ins = insumoMap.get(atv.id)
    const raw = ins?.conteudo_json as Record<string, unknown> | null
    discMap.get(atv.disciplina)!.push({
      id: atv.id,
      nome: atv.nome,
      descricao: atv.descricao,
      disciplina: atv.disciplina,
      ordem: atv.ordem,
      agente: atv.agente,
      insumo: ins
        ? {
            versao: ins.versao,
            status: ins.status_aprovacao,
            tipo: ins.tipo ?? 'texto',
            conteudo_md: typeof raw?.md === 'string' ? raw.md : null,
            link_url: typeof raw?.url === 'string' ? raw.url : null,
            link_titulo: typeof raw?.titulo === 'string' ? raw.titulo : null,
          }
        : undefined,
    })
  }

  return discOrder.map((id) => ({
    id,
    label: DISC_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '),
    atividades: discMap.get(id) ?? [],
  }))
}

function useExportData(projectId: string, iteracaoId: string | undefined) {
  return useQuery({
    queryKey: ['export', projectId, iteracaoId],
    queryFn: async (): Promise<ExportDisciplina[]> => {
      const { atividades, artefatos } = await artefatoService.getExportData(iteracaoId!)
      return buildExportDisciplinas(atividades, artefatos)
    },
    enabled: !!iteracaoId && !!projectId,
    staleTime: 30_000,
  })
}

// ─── Discipline dot colors ────────────────────────────────────────────────────

const DISC_DOT: Record<string, string> = {
  descoberta: '#8b5cf6',
  requisitos: '#6366f1',
  arquitetura: '#3b82f6',
  construcao: '#f97316',
  qualidade: '#10b981',
}

// ─── Hidden print document ────────────────────────────────────────────────────

function PrintDocument({
  data,
  project,
  iteracao,
}: {
  data: ExportDisciplina[]
  project: Project
  iteracao: Iteration
}) {
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div>
      {/* Cover */}
      <div className="cover">
        <h1>{project.nome}</h1>
        {project.descricao && (
          <p className="meta">{project.descricao}</p>
        )}
        <p className="iteracao">Iteração: {iteracao.nome}{iteracao.modulo_foco ? ` — ${iteracao.modulo_foco}` : ''}</p>
        <p className="meta">Exportado em {now}</p>
      </div>

      {/* Disciplines */}
      {data.map((disc) => (
        <div key={disc.id} className="discipline">
          <div className="discipline-header">
            <span className="discipline-dot" style={{ background: DISC_DOT[disc.id] ?? '#6b7280' }} />
            <span className="discipline-name">{disc.label}</span>
            <span className="discipline-count">
              {disc.atividades.length} atividade{disc.atividades.length !== 1 ? 's' : ''}
            </span>
          </div>

          {disc.atividades.map((atv) => (
            <div key={atv.id} className="activity">
              <div className="activity-header">
                <span className="activity-name">{atv.nome}</span>
                <span className="activity-agent">{atv.agente}</span>
                {atv.insumo && (
                  <span className={`activity-version status-${atv.insumo.status}`}>
                    v{atv.insumo.versao} · {STATUS_LABELS[atv.insumo.status] ?? atv.insumo.status}
                  </span>
                )}
              </div>

              {atv.descricao && (
                <p className="activity-desc">{atv.descricao}</p>
              )}

              {atv.insumo?.tipo === 'link' && atv.insumo.link_url ? (
                <div className="md-content">
                  <p>
                    <a href={atv.insumo.link_url} target="_blank" rel="noopener noreferrer">
                      {atv.insumo.link_titulo || atv.insumo.link_url}
                    </a>
                  </p>
                  {atv.insumo.link_titulo && (
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                      {atv.insumo.link_url}
                    </p>
                  )}
                </div>
              ) : atv.insumo?.conteudo_md ? (
                <div className="md-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {atv.insumo.conteudo_md}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="no-content">Nenhum conteúdo gerado para esta atividade.</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Export button ────────────────────────────────────────────────────────────

interface ExportPDFButtonProps {
  project: Project
  iteracao: Iteration | null
}

export function ExportPDFButton({ project, iteracao }: ExportPDFButtonProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const { data: exportData, isLoading, isFetching } = useExportData(project.id, iteracao?.id)

  function handlePrint() {
    if (!printRef.current || !exportData || !iteracao) return

    const content = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=1000,height=800')
    if (!win) {
      alert('Permita pop-ups nesta página para exportar o PDF.')
      return
    }

    const btnStyle = [
      'padding:8px 16px', 'border-radius:6px', 'border:none',
      'font-size:13px', 'font-weight:600', 'cursor:pointer',
    ].join(';')

    win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${project.nome} — Documentação</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:#1e1e2e;border-bottom:1px solid #333;gap:12px">
    <span style="color:#a0a0b0;font-size:12px;font-family:sans-serif">${project.nome} · ${iteracao.nome}</span>
    <div style="display:flex;gap:8px">
      <button onclick="window.print()" style="${btnStyle};background:#6366f1;color:#fff">
        ⬇ Salvar como PDF
      </button>
      <button onclick="window.close()" style="${btnStyle};background:#374151;color:#d1d5db">
        Fechar
      </button>
    </div>
  </div>
  <div style="margin-top:56px">
    ${content}
  </div>
</body>
</html>`)
    win.document.close()
    win.focus()
  }

  const busy = isLoading || isFetching
  const ready = !!exportData && !!iteracao

  return (
    <>
      <button
        onClick={handlePrint}
        disabled={!ready}
        title={
          !iteracao
            ? 'Selecione uma iteração para exportar'
            : busy
            ? 'Carregando dados…'
            : 'Exportar todas as disciplinas como PDF'
        }
        className="relative flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileDown className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Hidden render — off-screen, fixed width for consistent HTML */}
      <div
        ref={printRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
          fontFamily: 'sans-serif',
          fontSize: '13px',
          lineHeight: '1.7',
          color: '#111827',
        }}
      >
        {exportData && iteracao && (
          <PrintDocument data={exportData} project={project} iteracao={iteracao} />
        )}
      </div>
    </>
  )
}
