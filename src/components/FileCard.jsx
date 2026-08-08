import {
  ArrowDown,
  ArrowUp,
  Eye,
  GripVertical,
  Trash2,
} from 'lucide-react'

import { formatFileSize } from '../lib/fileUtils'

function FileCard({
  file,
  index,
  total,

  listeners,
  attributes,
  setNodeRef,
  transform,
  transition,
  isDragging,

  onToggleInclude,
  onMoveUp,
  onMoveDown,
  onRemove,
  onPreview,
}) {
  const style = {
    transform,
    transition,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`
        rounded-2xl
        border border-white/15
        bg-white/[0.07]
        p-4
        shadow-lg shadow-slate-950/15
        transition-colors
        hover:border-white/25
        hover:bg-white/[0.10]

        ${!file.included ? 'opacity-65' : ''}
        ${isDragging ? 'opacity-20' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">
          <p
            className="truncate text-sm font-semibold text-white"
            title={file.name}
          >
            {file.name}
          </p>

          <p className="mt-1 text-xs text-slate-300">
            {file.error
              ? 'Unreadable PDF'
              : `${file.pageCount} page${
                  file.pageCount === 1 ? '' : 's'
                } · ${formatFileSize(file.size)}`}
          </p>
        </div>

        {!file.error ? (
          <button
            type="button"

            {...attributes}
            {...listeners}

            className="
              touch-none
              cursor-grab
              rounded-lg
              p-2
              text-slate-300
              transition
              hover:bg-white/10
              hover:text-white
              active:cursor-grabbing
            "

            aria-label={`Drag ${file.name} to reorder`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}

      </div>

      {!file.error ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">

            <label
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-white/10
                px-3
                py-1.5
                text-xs
                text-slate-100
              "
            >
              <input
                type="checkbox"
                checked={file.included}
                onChange={() => onToggleInclude(file.id)}
                className="accent-sky-500"
              />

              Include document
            </label>

            <button
              type="button"
              onClick={() => onPreview(file.id)}
              className="
                rounded-xl
                bg-white/10
                px-3
                py-1.5
                text-xs
                text-slate-100
                transition
                hover:bg-white/20
              "
            >
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Preview
              </span>
            </button>

          </div>

          <div className="mt-3 flex items-center gap-2">

            <button
              type="button"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="
                rounded-xl
                bg-white/10
                p-2
                text-slate-100
                transition
                hover:bg-white/20
                disabled:cursor-not-allowed
                disabled:opacity-20
              "
              aria-label={`Move ${file.name} up`}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onMoveDown(index)}
              disabled={index === total - 1}
              className="
                rounded-xl
                bg-white/10
                p-2
                text-slate-100
                transition
                hover:bg-white/20
                disabled:cursor-not-allowed
                disabled:opacity-20
              "
              aria-label={`Move ${file.name} down`}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onRemove(file.id)}
              className="
                ml-auto
                rounded-xl
                bg-rose-500/20
                p-2
                text-rose-100
                transition
                hover:bg-rose-500/35
              "
              aria-label={`Remove ${file.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>

          </div>
        </>
      ) : (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="
              rounded-xl
              bg-rose-500/20
              px-3
              py-2
              text-xs
              text-rose-100
              hover:bg-rose-500/35
            "
          >
            Remove
          </button>
        </div>
      )}

      {file.error ? (
        <p className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-100">
          {file.error}
        </p>
      ) : null}
    </article>
  )
}

export default FileCard