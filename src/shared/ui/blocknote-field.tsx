import { useEffect, useRef, useCallback } from 'react'
import { useCreateBlockNote, useEditorChange } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { cn } from '@/shared/lib/utils'
import { useTheme } from '@/shared/lib/theme-provider'

export interface BlockNoteFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Altura mínima do editor (ex: "120px", "8rem") */
  minHeight?: string
  /** Se false, apenas exibe o conteúdo (sem edição) */
  editable?: boolean
  /** Variante compacta (menor altura, menos padding) para listas e campos curtos */
  variant?: 'default' | 'compact'
}

/** Reduz quebras de linha excessivas para evitar documento gigante (muitos blocos vazios). */
function normalizeMarkdownNewlines(md: string): string {
  if (!md?.trim()) return md ?? ''
  return md
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Campo de texto rico baseado em blocos (BlockNote).
 * Valor é persistido como Markdown; aceita texto simples ou markdown na entrada.
 */
export function BlockNoteField({
  value,
  onChange,
  className,
  minHeight,
  editable = true,
  variant = 'default',
}: BlockNoteFieldProps) {
  const effectiveMinHeight = minHeight ?? (variant === 'compact' ? '72px' : '120px')
  const editor = useCreateBlockNote({ initialContent: undefined })
  /** Ref para não recarregar quando o pai re-renderiza com o mesmo valor; null = ainda não sincronizamos. */
  const lastSyncedValue = useRef<string | null>(null)

  const loadValueIntoEditor = useCallback(
    async (val: string) => {
      if (!editor) return
      const normalized = normalizeMarkdownNewlines(val ?? '')
      try {
        const blocks = normalized
          ? await editor.tryParseMarkdownToBlocks(normalized)
          : [{ type: 'paragraph', content: '' }]
        if (blocks.length) {
          editor.replaceBlocks(editor.document, blocks)
        }
      } catch {
        editor.replaceBlocks(editor.document, [{ type: 'paragraph', content: normalized || '' }])
      }
      lastSyncedValue.current = val
    },
    [editor]
  )

  // Sincronizar editor quando value mudar (carregamento do banco ou troca de insumo/definição)
  useEffect(() => {
    if (!editor) return
    if (lastSyncedValue.current === value) return
    loadValueIntoEditor(value)
  }, [editor, value, loadValueIntoEditor])

  const handleChange = useCallback(
    async (editorInstance: { document: unknown[]; blocksToMarkdownLossy: (doc: unknown[]) => Promise<string> }) => {
      try {
        const markdown = await editorInstance.blocksToMarkdownLossy(editorInstance.document)
        const normalized = normalizeMarkdownNewlines(markdown ?? '')
        lastSyncedValue.current = normalized
        onChange(normalized)
      } catch {
        // ignore
      }
    },
    [onChange]
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEditorChange(handleChange as any, editor)

  const { mode } = useTheme()
  const blockNoteTheme = mode === 'dark' ? 'dark' : 'light'

  if (!editor) return null

  return (
    <div
      className={cn(
        'bn-blocknote-field overflow-hidden rounded-xl border border-border bg-card/50 transition-[border-color,box-shadow] focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/20 [&_.bn-editor]:min-h-[var(--bn-min-h)]',
        variant === 'compact' && 'bn-blocknote-field--compact',
        className
      )}
      style={{ minHeight: effectiveMinHeight, ['--bn-min-h' as string]: effectiveMinHeight }}
    >
      <BlockNoteView editor={editor} theme={blockNoteTheme} editable={editable} />
    </div>
  )
}
