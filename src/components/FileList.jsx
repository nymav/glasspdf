import {
  useState,
} from 'react'

import FileRow from './FileRow'

function FileList({
  files,

  onReorder,
  onToggleInclude,

  onRemove,
  onPreview,

  onAddFiles,
}) {
  const [expanded, setExpanded] = useState(false)
  const [
    draggingIndex,
    setDraggingIndex,
  ] = useState(null)

  const [
    overIndex,
    setOverIndex,
  ] = useState(null)

  const resetDrag = () => {
    setDraggingIndex(null)
    setOverIndex(null)
  }

  const handleDrop = (
    targetIndex,
  ) => {
    if (
      draggingIndex === null
    ) {
      resetDrag()
      return
    }

    if (
      draggingIndex !==
      targetIndex
    ) {
      onReorder(
        draggingIndex,
        targetIndex,
      )
    }

    resetDrag()
  }

  return (
    <aside className="sidebar-panel" data-expanded={expanded}>

      <div className="sidebar-heading">

        <div>

          <h2>
            Documents
          </h2>

          <p>
            Drag to move entire document blocks
          </p>

        </div>

        <span className="mac-count">
          {files.length}
        </span>

      </div>

      <button className="mobile-documents-toggle mac-secondary-button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Hide documents' : 'Show documents'} ({files.length})</button>
      <div className="document-list" id="document-list">

        {files.map(
          (
            file,
            index,
          ) => (
            <FileRow
              key={file.id}

              file={file}

              index={index}

              dragging={
                draggingIndex ===
                index
              }

              dragOver={
                overIndex ===
                  index &&
                draggingIndex !==
                  index
              }

              onDragStart={(
                event,
              ) => {
                setDraggingIndex(
                  index,
                )

                event.dataTransfer.effectAllowed =
                  'move'

                event.dataTransfer.setData(
                  'text/plain',
                  file.id,
                )

                const row =
                  event.currentTarget.closest(
                    'article',
                  )

                if (row) {
                  event.dataTransfer.setDragImage(
                    row,
                    24,
                    24,
                  )
                }
              }}

              onDragEnter={() => {
                if (
                  draggingIndex !==
                  null
                ) {
                  setOverIndex(
                    index,
                  )
                }
              }}

              onDragOver={(
                event,
              ) => {
                event.preventDefault()

                event.dataTransfer.dropEffect =
                  'move'
              }}

              onDrop={(
                event,
              ) => {
                event.preventDefault()

                handleDrop(
                  index,
                )
              }}

              onDragEnd={
                resetDrag
              }

              onToggleInclude={
                onToggleInclude
              }

              onRemove={
                onRemove
              }

              onPreview={
                onPreview
              }
            />
          ),
        )}

      </div>

      <div className="sidebar-add-area">

        <button
          type="button"

          onClick={
            onAddFiles
          }

          className="sidebar-add-button"
        >
          <span className="text-lg leading-none">
            +
          </span>

          Add document
        </button>

      </div>

    </aside>
  )
}

export default FileList