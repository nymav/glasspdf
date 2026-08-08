import {
  FilePlus2,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

function Header({
  fileCount,
  pageCount,

  canUndo,
  canRedo,
  hasFiles,

  onAddFiles,
  onUndo,
  onRedo,
  onClear,
}) {
  return (
    <header className="mac-titlebar">

      <div className="flex min-w-0 items-center gap-3">

        <div
          className="hidden items-center gap-[7px] sm:flex"
          aria-hidden="true"
        >
          <span className="traffic-light bg-[#ff5f57]" />
          <span className="traffic-light bg-[#febc2e]" />
          <span className="traffic-light bg-[#28c840]" />
        </div>

        <div className="hidden h-6 w-px bg-slate-900/10 sm:block" />

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <h1 className="truncate text-[14px] font-semibold tracking-[-0.01em] text-slate-900">
              Local PDF Studio
            </h1>

            <span className="local-pill">
              <ShieldCheck className="h-3 w-3" />
              Local
            </span>

          </div>

          <p className="mt-[1px] text-[10px] text-slate-500">
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

        <button
          type="button"

          onClick={
            onAddFiles
          }

          className="mac-title-button"
          title="Add PDFs (⌘O)"
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
            !canUndo
          }

          className="mac-title-button"
          title="Undo (⌘Z)"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"

          onClick={
            onRedo
          }

          disabled={
            !canRedo
          }

          className="mac-title-button"
          title="Redo (⌘⇧Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <button
          type="button"

          onClick={
            onClear
          }

          disabled={
            !hasFiles
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