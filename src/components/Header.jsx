import {
  FilePlus2,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

function Header({
  busy,
  fileCount,
  pageCount,

  canUndo,
  canRedo,
  hasFiles,

  onOcr,
  onAddFiles,
  onUndo,
  onRedo,
  onClear,
}) {
  const modifier = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'
  return (
    <header className="mac-titlebar">

      <div className="flex min-w-0 items-center gap-3">

        <img src={`${import.meta.env.BASE_URL}favicon.svg`} width="36" height="36" alt="" className="shrink-0" />
        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <h1 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-slate-900">
              GlassPDF
            </h1>

            <span className="local-pill">
              <ShieldCheck className="h-3 w-3" />
              Local
            </span>

          </div>

          <p className="mt-[1px] text-[12px] text-slate-500">
            {fileCount > 0
              ? `${fileCount} document${
                  fileCount === 1
                    ? ''
                    : 's'
                } · ${pageCount} output page${
                  pageCount === 1
                    ? ''
                    : 's'
                }`
              : 'Private PDF workspace'}
          </p>

        </div>

      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button className="mac-title-button" onClick={onOcr} disabled={busy || !hasFiles} title="Read scanned text (OCR)" aria-label="Read scanned text (OCR)">OCR</button>

        <button
          type="button"

          disabled={busy}
          onClick={
            onAddFiles
          }

          className="mac-title-button"
          title={`Add PDFs (${modifier}O)`}
        >
          <FilePlus2 className="h-4 w-4" />

          <span className="hidden lg:inline">
            Add
          </span>
        </button>

        <button
          type="button"

          onClick={
            onUndo
          }

          disabled={
            busy || !canUndo
          }

          className="mac-title-button"
          title={`Undo (${modifier}Z)`}
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"

          onClick={
            onRedo
          }

          disabled={
            busy || !canRedo
          }

          className="mac-title-button"
          title={`Redo (${modifier}Shift+Z)`}
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <button
          type="button"

          onClick={
            onClear
          }

          disabled={
            busy || !hasFiles
          }

          className="mac-title-button mac-title-danger"
          title="Clear workspace"
        >
          <Trash2 className="h-4 w-4" />
        </button>

      </div>

    </header>
  )
}

export default Header