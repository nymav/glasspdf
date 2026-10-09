import {
  Check,
  Copy,
  Eye,
  GripVertical,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react'

import {
  defaultAnimateLayoutChanges,
  useSortable,
} from '@dnd-kit/sortable'

import {
  CSS,
} from '@dnd-kit/utilities'

import PdfCanvas from './PdfCanvas'

const animateLayoutChanges = (
  args,
) => {
  /*
   * Source-file reorder:
   * no page-card animation.
   *
   * Direct page drag:
   * normal dnd-kit animation.
   */
  if (
    args.isSorting ||
    args.wasDragging
  ) {
    return defaultAnimateLayoutChanges(
      args,
    )
  }

  return false
}

function PageCard({
  page,

  sourceIncluded,
  sourcePageCount,

  outputIndex,
  thumbnailWidth,

  onToggleIncluded,
  onToggleMarked,

  onRemove,
  onDuplicate,
  onRotate,
  onPreview,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,

    transform,
    transition,

    isDragging,
  } = useSortable({
    id: page.id,

    animateLayoutChanges,
  })

  const style = {
    transform:
      isDragging
        ? undefined
        : CSS.Transform.toString(
            transform,
          ),

    transition,
  }

  return (
    <article
      ref={
        setNodeRef
      }

      style={
        style
      }

      onDoubleClick={() =>
        onPreview(page)
      }

      className={`page-card group ${
        page.marked
          ? 'page-card-selected'
          : ''
      } ${
        !page.included ||
        !sourceIncluded
          ? 'page-card-excluded'
          : ''
      } ${
        isDragging
          ? 'opacity-30'
          : ''
      }`}
    >

      <div className="relative">

        <div className="page-paper">

          <PdfCanvas
            fileId={
              page.fileId
            }

            fileUrl={
              page.fileUrl
            }

            pageNumber={
              page.pageNumber
            }

            rotation={
              page.rotation
            }

            width={
              thumbnailWidth
            }

            lazy

            className="pointer-events-none aspect-[0.72/1]"
          />

        </div>

        <button
          type="button"

          onClick={() =>
            onToggleMarked(
              page.id,
            )
          }

          className={`page-select-button ${
            page.marked
              ? 'page-select-button-active'
              : ''
          }`}

          aria-label={`Select ${page.fileName}, page ${page.pageNumber}`}
          aria-pressed={page.marked}
          title="Select page"
        >
          {page.marked ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
        </button>

        <button
          type="button"

          {...attributes}
          {...listeners}

          className="page-drag-handle"

          aria-label={`Reorder ${page.fileName}, page ${page.pageNumber}`}
          title="Reorder page (Space, arrow keys, Space)"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span className="page-number-badge">
          {outputIndex}
        </span>

        <div className="page-hover-toolbar">

          <button
            type="button"

            onClick={() =>
              onPreview(page)
            }

            title="Quick Look"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"

            onClick={() =>
              onRotate(
                page.id,
                -90,
              )
            }

            title="Rotate left"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"

            onClick={() =>
              onRotate(
                page.id,
                90,
              )
            }

            title="Rotate right"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"

            onClick={() =>
              onDuplicate(
                page.id,
              )
            }

            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"

            onClick={() =>
              onRemove(
                page.id,
              )
            }

            className="danger"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

        </div>

      </div>

      <div className="mt-2 min-w-0 px-0.5">

        <p
          className="truncate text-[11px] font-medium text-slate-700"

          title={
            page.fileName
          }
        >
          {page.fileName}
        </p>

        <div className="mt-[2px] flex items-center justify-between gap-2">

          <p className="text-[10px] text-slate-500">
            p.{page.pageNumber}

            {sourcePageCount
              ? ` / ${sourcePageCount}`
              : ''}

            {page.rotation
              ? ` · ${page.rotation}°`
              : ''}
          </p>

          <label
            className="inline-flex cursor-pointer items-center gap-1 text-[9px] text-slate-500"

            title="Include in final PDF"
          >

            <input
              type="checkbox"

              disabled={
                !sourceIncluded
              }

              checked={
                page.included &&
                sourceIncluded
              }

              onChange={() =>
                onToggleIncluded(
                  page.id,
                )
              }

              className="h-3 w-3 accent-[#007aff]"
            />

            Final

          </label>

        </div>

      </div>

    </article>
  )
}

export default PageCard