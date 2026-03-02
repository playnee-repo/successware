import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth'
import { artefatoService } from '@/shared/api/container'
import type {
  Atividade,
  ConfiguracaoAtividade,
  Artefato,
  ArtefatoTipo,
  ApprovalStatus,
  ViewPreference,
  Disciplina,
  AtividadeComProgresso,
} from '@/entities/artifact/model/types'

// ==============================
// DISCIPLINAS (distinct from DB)
// ==============================
export function useDisciplinas() {
  return useQuery({
    queryKey: ['disciplinas'],
    queryFn: () => artefatoService.getDistinctDisciplinas(),
  })
}

// ==============================
// ATIVIDADES
// ==============================
export function useAtividades(disciplina?: Disciplina) {
  return useQuery({
    queryKey: ['atividades', disciplina],
    queryFn: () => artefatoService.getAtividades(disciplina),
  })
}

// ==============================
// ATIVIDADE (single)
// ==============================
export function useAtividade(atividadeId: string | undefined) {
  return useQuery({
    queryKey: ['atividade', atividadeId],
    queryFn: () => artefatoService.getAtividade(atividadeId!),
    enabled: !!atividadeId,
  })
}

// ==============================
// CONFIGURAÇÕES DE ATIVIDADE
// ==============================
export function useConfiguracoesAtividade(atividadeId?: string) {
  return useQuery({
    queryKey: ['configuracoes', atividadeId],
    queryFn: () => artefatoService.getConfiguracoes(atividadeId),
    enabled: !!atividadeId,
  })
}

/** @deprecated Use useConfiguracoesAtividade instead */
export const useDefinicoes = useConfiguracoesAtividade

// ==============================
// ARTEFATOS DO PROJETO
// ==============================
export function useArtefato(artefatoId: string | undefined) {
  return useQuery({
    queryKey: ['artefato', artefatoId],
    queryFn: () => artefatoService.findById(artefatoId!),
    enabled: !!artefatoId,
  })
}

/** @deprecated Use useArtefato instead */
export const useInsumo = useArtefato

export function useArtefatos(iteracaoId: string, atividadeId?: string) {
  return useQuery({
    queryKey: ['artefatos', iteracaoId, atividadeId],
    queryFn: () => artefatoService.findByIteracao(iteracaoId, atividadeId),
    enabled: !!iteracaoId,
  })
}

/** @deprecated Use useArtefatos instead */
export const useInsumos = useArtefatos

// ==============================
// ATIVIDADES COM PROGRESSO
// ==============================
export function useAtividadesComProgresso(disciplina: Disciplina, iteracaoId: string, projetoTipo?: string | null) {
  return useQuery({
    queryKey: ['atividades-progresso', disciplina, iteracaoId, projetoTipo ?? null],
    queryFn: () => artefatoService.getAtividadesComProgresso(disciplina, iteracaoId, projetoTipo),
    enabled: !!iteracaoId,
  })
}

// ==============================
// ATUALIZAR STATUS DE APROVAÇÃO
// ==============================
export function useUpdateApprovalStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ artefatoId, status }: { artefatoId: string; status: ApprovalStatus; iteracaoId: string }) =>
      artefatoService.updateStatus(artefatoId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artefatos', variables.iteracaoId] })
      queryClient.invalidateQueries({ queryKey: ['atividades-progresso'] })
    },
  })
}

// ==============================
// ATUALIZAR CONTEÚDO DO ARTEFATO
// ==============================
export function useUpdateArtefatoContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ artefatoId, conteudo_json }: { artefatoId: string; conteudo_json: Record<string, unknown>; iteracaoId: string }) =>
      artefatoService.updateContent(artefatoId, conteudo_json),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artefato', variables.artefatoId] })
      queryClient.invalidateQueries({ queryKey: ['artefatos', variables.iteracaoId] })
      queryClient.invalidateQueries({ queryKey: ['atividades-progresso'] })
    },
  })
}

/** @deprecated Use useUpdateArtefatoContent instead */
export const useUpdateInsumoContent = useUpdateArtefatoContent

// ==============================
// CRIAR ARTEFATO (não-IA)
// ==============================
export function useCreateArtefato() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({
      iteracao_id,
      atividade_id,
      configuracao_id,
      nome,
      tipo,
      conteudo_json,
      status_aprovacao,
    }: {
      iteracao_id: string
      atividade_id: string
      configuracao_id: string | null
      nome: string
      tipo: ArtefatoTipo
      conteudo_json: Record<string, unknown>
      status_aprovacao: ApprovalStatus
    }): Promise<Artefato> =>
      artefatoService.create({
        iteracao_id,
        atividade_id,
        configuracao_id,
        nome,
        tipo,
        conteudo_json,
        versao: 1,
        agente_autor: 'usuario',
        status_aprovacao,
        empresa_id: user!.empresaId,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['artefatos', vars.iteracao_id] })
      queryClient.invalidateQueries({ queryKey: ['atividades-progresso'] })
    },
  })
}

// ==============================
// ATUALIZAR PREFERÊNCIA DE VIEW
// ==============================
export function useUpdateViewPreference() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ artefatoId, preference }: { artefatoId: string; preference: ViewPreference; iteracaoId: string }) =>
      artefatoService.updateViewPreference(artefatoId, preference),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artefatos', variables.iteracaoId] })
    },
  })
}
