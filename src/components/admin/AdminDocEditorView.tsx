import DocxEditor from '../DocxEditor'

type Props = {
  title: string
  content: string
  saving: boolean
  onTitleChange: (title: string) => void
  onSave: (content: string) => void
  onExport: (content: string) => void
  onCancel: () => void
}

export default function AdminDocEditorView({ title, content, saving, onTitleChange, onSave, onExport, onCancel }: Props) {
  return (
    <div className="space-y-4" style={{ height: 'calc(100vh - 180px)' }}>
      <DocxEditor
        initialContent={content}
        title={title}
        onTitleChange={onTitleChange}
        onSave={onSave}
        onExport={onExport}
        onCancel={onCancel}
      />
      {saving ? <p className="text-sm text-neutral-600">Saving document...</p> : null}
    </div>
  )
}
