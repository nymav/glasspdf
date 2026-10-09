import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

import {
  createPortal,
} from 'react-dom'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  ArrowDownToLine,
  ArrowUpToLine,
  Eye,
  EyeOff,
  Trash2,
  X,
} from 'lucide-react'

import PageCard from './PageCard'
import Toolbar from './Toolbar'

function PageOrganizer({
  pages,
  revealPage,
  filesById,

  onReorderPages,

  onToggleIncluded,
  onToggleMarked,

  onRemovePage,
  onDuplicatePage,
  onRotatePage,
  onPreviewPage,

  onMarkAll,
  onClearMarks,

  onSetFileMarks,

  onIncludeMarked,
  onExcludeMarked,

  onMoveFront,
  onMoveBack,

  onRemoveMarked,

  onApplyRange,
}) {
  const [
    activeId,
    setActiveId,
  ] = useState(null)

  const [
    viewSize,
    setViewSize,
  ] = useState('medium')

  const [dragPreview, setDragPreview] = useState(null)
  const scrollRef = useRef(null)
  const BATCH_SIZE = 120
  const [batchState, setBatchState] = useState({ number: 0, revealAt: null })
  let batch = batchState.number
  if (revealPage && revealPage.at !== batchState.revealAt) {
    const index = pages.findIndex(page => page.id === revealPage.id)
    batch = Math.max(0, Math.floor(index / BATCH_SIZE))
    setBatchState({ number: batch, revealAt: revealPage.at })
  }
  const setBatch = number => setBatchState(previous => ({ ...previous, number }))
  const currentBatch = Math.min(batch, Math.max(0, Math.ceil(pages.length / BATCH_SIZE) - 1))
  const batchStart = currentBatch * BATCH_SIZE
  const visiblePages = pages.slice(batchStart, batchStart + BATCH_SIZE)
  useEffect(() => {
    if (!revealPage) return
    const index = pages.findIndex(page => page.id === revealPage.id)
    if (index < 0) return
    const targetBatch = Math.floor(index / BATCH_SIZE)
    if (currentBatch !== targetBatch) return
    const frame = requestAnimationFrame(() => {
      const card = scrollRef.current?.querySelector(`[data-page-id="${revealPage.id}"]`)
      card?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      card?.querySelector('.page-drag-surface')?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [revealPage, pages, currentBatch])

  const sensors =
    useSensors(
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
      useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
      useSensor(
        MouseSensor,
        {
          activationConstraint: {
            distance: 6,
          },
        },
      ),
    )

  const includedCount =
    useMemo(
      () =>
        pages.filter(
          (page) =>
            page.included &&
            filesById[
              page.fileId
            ]?.included,
        ).length,

      [
        pages,
        filesById,
      ],
    )

  const markedCount =
    useMemo(
      () =>
        pages.filter(
          (page) =>
            page.marked,
        ).length,

      [pages],
    )

  const activePage =
    activeId
      ? pages.find(
          (page) =>
            page.id === activeId,
        )
      : null

  const sizeConfig = {
    small: {
      className:
        'page-grid-small',

      width: 145,
    },

    medium: {
      className:
        'page-grid-medium',

      width: 185,
    },

    large: {
      className:
        'page-grid-large',

      width: 235,
    },
  }

  const currentSize =
    sizeConfig[
      viewSize
    ]

  return (
    <section className="page-workspace" aria-label="Page organizer">

      <div className="workspace-heading">

        <div>

          <h2>
            Final Page Order
          </h2>

          <p>
            Drag to reorder · Select pages for actions
          </p>

        </div>

        <div className="flex items-center gap-2">

          <span className="mac-count mac-count-blue">
            {includedCount} pages
          </span>

        </div>

      </div>

      <Toolbar
        files={
          Object.values(
            filesById,
          )
        }

        viewSize={
          viewSize
        }

        setViewSize={
          setViewSize
        }

        onMarkAll={
          onMarkAll
        }

        onClearMarks={
          onClearMarks
        }

        onSetFileMarks={
          onSetFileMarks
        }

        onApplyRange={
          onApplyRange
        }
      />

      {pages.length > BATCH_SIZE && <nav className="page-batch-nav" aria-label="Browse document pages">
        <button className="mac-secondary-button" disabled={currentBatch === 0} onClick={() => { setBatch(currentBatch - 1); scrollRef.current.scrollTop = 0 }}>Previous pages</button>
        <span role="status">Showing {batchStart + 1}–{Math.min(batchStart + BATCH_SIZE, pages.length)} of {pages.length}. Selection and export include all batches.</span>
        <button className="mac-secondary-button" disabled={batchStart + BATCH_SIZE >= pages.length} onClick={() => { setBatch(currentBatch + 1); scrollRef.current.scrollTop = 0 }}>Next pages</button>
      </nav>}
      <div ref={scrollRef} className="page-scroll-area">

        <DndContext
          sensors={
            sensors
          }

          accessibility={{
            screenReaderInstructions: { draggable: 'Press Space to pick up a page. Use arrow keys to move it. Press Space to place it, or Escape to cancel.' },
            announcements: {
              onDragStart: ({active}) => `Picked up page ${pages.findIndex(page => page.id === active.id) + 1}.`,
              onDragOver: ({over}) => over ? `Move to position ${pages.findIndex(page => page.id === over.id) + 1}.` : undefined,
              onDragEnd: ({over}) => over ? `Page placed at position ${pages.findIndex(page => page.id === over.id) + 1}.` : 'Move cancelled.',
              onDragCancel: () => 'Move cancelled.',
            },
          }}
          collisionDetection={
            closestCenter
          }

          onDragStart={({ active }) => {
            const card = document.querySelector(`[data-page-id="${active.id}"]`)
            const canvas = card?.querySelector('canvas')
            const paper = card?.querySelector('.page-paper')
            const rect = card?.getBoundingClientRect()
            setDragPreview({ width: rect?.width || currentSize.width, paperHeight: paper?.getBoundingClientRect().height || currentSize.width / .72, image: canvas?.width ? canvas.toDataURL('image/png') : null })
            setActiveId(active.id)
          }}

          onDragCancel={() => { setActiveId(null); setDragPreview(null) }}

          onDragEnd={({
            active,
            over,
          }) => {
            setActiveId(null)
            setDragPreview(null)

            if (!over) {
              return
            }

            onReorderPages(
              active.id,
              over.id,
            )
          }}
        >

          <SortableContext
            items={visiblePages.map(
              (page) =>
                page.id,
            )}

            strategy={
              rectSortingStrategy
            }
          >

            <div
              className={`page-grid ${currentSize.className}`}
            >

              {visiblePages.map(
                (
                  page,
                  index,
                ) => (
                  <PageCard
                    key={
                      page.id
                    }

                    page={
                      page
                    }

                    outputIndex={
                      batchStart + index + 1
                    }

                    sourceIncluded={
                      filesById[
                        page.fileId
                      ]?.included ??
                      false
                    }

                    sourcePageCount={
                      filesById[
                        page.fileId
                      ]?.pageCount
                    }

                    thumbnailWidth={
                      currentSize.width
                    }

                    onToggleIncluded={
                      onToggleIncluded
                    }

                    onToggleMarked={
                      onToggleMarked
                    }

                    onRemove={
                      onRemovePage
                    }

                    onDuplicate={
                      onDuplicatePage
                    }

                    onRotate={
                      onRotatePage
                    }

                    onPreview={
                      onPreviewPage
                    }
                  />
                ),
              )}

            </div>

          </SortableContext>

          {typeof document !==
            'undefined'
            ? createPortal(
                <DragOverlay
                  dropAnimation={
                    null
                  }
                >

                  {activePage ? (
                    <div className="page-card page-full-drag-overlay" style={{ width: dragPreview?.width }} aria-hidden="true">
                      <div className="page-paper" style={{ height: dragPreview?.paperHeight }}>
                        {dragPreview?.image ? <img src={dragPreview.image} alt="" className="drag-page-image" /> : <div className="drag-page-placeholder">Page {activePage.pageNumber}</div>}
                      </div>
                      <p className="mt-2 truncate text-[11px] font-medium text-slate-700">{activePage.fileName}</p>
                      <p className="text-[10px] text-slate-500">p.{activePage.pageNumber}</p>
                    </div>
                  ) : null}

                </DragOverlay>,

                document.body,
              )
            : null}

        </DndContext>

      </div>

      {markedCount > 0 ? (
        <div className="selection-bar">

          <div className="flex items-center gap-2">

            <span className="selection-count">
              {markedCount}
            </span>

            <span className="text-xs font-medium text-slate-700">
              selected
            </span>

          </div>

          <div className="selection-divider" />

          <button
            type="button"

            onClick={
              onIncludeMarked
            }

            title="Include selected"
          >
            <Eye className="h-4 w-4" />
            <span>
              Include
            </span>
          </button>

          <button
            type="button"

            onClick={
              onExcludeMarked
            }

            title="Exclude selected"
          >
            <EyeOff className="h-4 w-4" />

            <span>
              Exclude
            </span>
          </button>

          <button
            type="button"

            onClick={
              onMoveFront
            }
          >
            <ArrowUpToLine className="h-4 w-4" />

            <span className="hidden xl:inline">
              To start
            </span>
          </button>

          <button
            type="button"

            onClick={
              onMoveBack
            }
          >
            <ArrowDownToLine className="h-4 w-4" />

            <span className="hidden xl:inline">
              To end
            </span>
          </button>

          <button
            type="button"

            onClick={
              onRemoveMarked
            }

            className="selection-danger"
          >
            <Trash2 className="h-4 w-4" />

            <span className="hidden lg:inline">
              Delete
            </span>
          </button>

          <div className="selection-divider" />

          <button
            type="button"

            onClick={
              onClearMarks
            }

            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      ) : null}

    </section>
  )
}

export default PageOrganizer