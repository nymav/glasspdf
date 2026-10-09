import {
  DndContext,
  DragOverlay,
  PointerSensor,
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
  useMemo,
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

  const sensors =
    useSensors(
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
      useSensor(
        PointerSensor,
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
            Drag pages, or use Space and arrow keys on a reorder handle
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

      <div className="page-scroll-area">

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

          onDragStart={({
            active,
          }) =>
            setActiveId(
              active.id,
            )
          }

          onDragCancel={() =>
            setActiveId(null)
          }

          onDragEnd={({
            active,
            over,
          }) => {
            setActiveId(null)

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
            items={pages.map(
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

              {pages.map(
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
                      index + 1
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
                    <div className="page-drag-overlay">

                      <p className="truncate text-xs font-semibold text-slate-800">
                        {activePage.fileName}
                      </p>

                      <p className="mt-1 text-[10px] text-[#007aff]">
                        Page {activePage.pageNumber}
                      </p>

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