import type { IArtefatoRepository } from '@/entities/artifact/api/IArtefatoRepository'
import type { IAtividadeRepository } from '@/entities/artifact/api/IAtividadeRepository'
import type { IConfiguracaoRepository } from '@/entities/artifact/api/IConfiguracaoRepository'
import type {
  Artefato,
  Atividade,
  ConfiguracaoAtividade,
  ApprovalStatus,
  ViewPreference,
  CreateArtefatoInput,
  AtividadeComProgresso,
  Disciplina,
} from '@/entities/artifact/model/types'

export class ArtefatoService {
  constructor(
    private readonly artefatoRepo: IArtefatoRepository,
    private readonly atividadeRepo: IAtividadeRepository,
    private readonly configuracaoRepo: IConfiguracaoRepository,
  ) {}

  findById(id: string): Promise<Artefato> {
    return this.artefatoRepo.findById(id)
  }

  findByIteracao(iteracaoId: string, atividadeId?: string): Promise<Artefato[]> {
    return this.artefatoRepo.findByIteracao(iteracaoId, atividadeId)
  }

  create(input: CreateArtefatoInput): Promise<Artefato> {
    return this.artefatoRepo.create(input)
  }

  updateStatus(artefatoId: string, status: ApprovalStatus): Promise<Artefato> {
    return this.artefatoRepo.updateStatus(artefatoId, status)
  }

  updateContent(artefatoId: string, conteudoJson: Record<string, unknown>): Promise<Artefato> {
    return this.artefatoRepo.updateContent(artefatoId, conteudoJson)
  }

  updateViewPreference(artefatoId: string, preference: ViewPreference): Promise<Artefato> {
    return this.artefatoRepo.updateViewPreference(artefatoId, preference)
  }

  getDistinctDisciplinas(): Promise<string[]> {
    return this.atividadeRepo.findDistinctDisciplinas()
  }

  getAtividades(disciplina?: Disciplina): Promise<Atividade[]> {
    return this.atividadeRepo.findAll(disciplina)
  }

  getAtividade(id: string): Promise<Atividade> {
    return this.atividadeRepo.findById(id)
  }

  getConfiguracoes(atividadeId?: string): Promise<ConfiguracaoAtividade[]> {
    return this.configuracaoRepo.findByAtividade(atividadeId)
  }

  async getAtividadesComProgresso(
    disciplina: Disciplina,
    iteracaoId: string,
    projetoTipo?: string | null,
  ): Promise<AtividadeComProgresso[]> {
    const [atividades, configuracoes, artefatos] = await Promise.all([
      this.atividadeRepo.findAll(disciplina),
      this.configuracaoRepo.findByAtividade(),
      this.artefatoRepo.findByIteracao(iteracaoId),
    ])

    return atividades.map((atividade) => {
      const atividadeConfiguracoes = configuracoes.filter(c => {
        if (c.atividade_id !== atividade.id) return false
        if (!c.tipos_projeto || c.tipos_projeto.length === 0) return true
        return !!projetoTipo && c.tipos_projeto.includes(projetoTipo)
      })
      const atividadeArtefatos = artefatos.filter(a => a.atividade_id === atividade.id)

      const artefatosPorNome = new Map<string, Artefato>()
      for (const artefato of atividadeArtefatos) {
        if (!artefatosPorNome.has(artefato.nome)) {
          artefatosPorNome.set(artefato.nome, artefato)
        }
      }

      const artefatosUnicos = Array.from(artefatosPorNome.values())
      const totalArtefatos = artefatosUnicos.length
      const artefatosAprovados = artefatosUnicos.filter(a => a.status_aprovacao === 'aprovado').length
      const progresso = totalArtefatos > 0
        ? Math.round((artefatosAprovados / totalArtefatos) * 100)
        : 0

      return {
        ...atividade,
        configuracoes: atividadeConfiguracoes,
        artefatos: atividadeArtefatos,
        progresso,
        total_artefatos: totalArtefatos,
        artefatos_aprovados: artefatosAprovados,
      }
    })
  }

  async getExportData(iteracaoId: string): Promise<{ atividades: Atividade[]; artefatos: Artefato[] }> {
    const [atividades, artefatos] = await Promise.all([
      this.atividadeRepo.findAll(),
      this.artefatoRepo.findByIteracao(iteracaoId),
    ])
    return { atividades, artefatos }
  }
}
