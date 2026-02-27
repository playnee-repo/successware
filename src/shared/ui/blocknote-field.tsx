import { useEffect, useRef, useCallback } from 'react'
import { useCreateBlockNote, useEditorChange } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { cn } from '@/shared/lib/utils'

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
  const lastSyncedValue = useRef<string>(value)

  const loadValueIntoEditor = useCallback(
    async (val: string) => {
      if (!editor) return
      try {
        const blocks = val?.trim()
          ? await editor.tryParseMarkdownToBlocks(val)
          : [{ type: 'paragraph', content: '' }]
        if (blocks.length) {
          editor.replaceBlocks(editor.document, blocks)
        }
      } catch {
        editor.replaceBlocks(editor.document, [{ type: 'paragraph', content: val || '' }])
      }
      lastSyncedValue.current = val
    },
    [editor]
  )

  // Sincronizar editor quando value mudar (ex.: carregamento do banco ou troca de definição)
  useEffect(() => {
    if (!editor) return
    if (lastSyncedValue.current === value) return
    loadValueIntoEditor(value)
  }, [editor, value, loadValueIntoEditor])

  const handleChange = useCallback(
    async (editorInstance: { document: unknown[]; blocksToMarkdownLossy: (doc: unknown[]) => Promise<string> }) => {
      try {
        const markdown = await editorInstance.blocksToMarkdownLossy(editorInstance.document)
        onChange(markdown ?? '')
      } catch {
        // ignore
      }
    },
    [onChange]
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEditorChange(handleChange as any, editor)

  if (!editor) return null

  return (
    <div
      className={cn(
        'bn-blocknote-field overflow-hidden rounded-xl border border-zinc-700/70 bg-zinc-900/50 transition-[border-color,box-shadow] focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-indigo-500/20 [&_.bn-editor]:min-h-[var(--bn-min-h)]',
        variant === 'compact' && 'bn-blocknote-field--compact',
        className
      )}
      style={{ minHeight: effectiveMinHeight, ['--bn-min-h' as string]: effectiveMinHeight }}
    >
      <BlockNoteView editor={editor} theme="dark" editable={editable} />
    </div>
  )
}
