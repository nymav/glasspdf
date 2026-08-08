import {
    Eye,
    GripVertical,
    MoreHorizontal,
    Trash2,
  } from 'lucide-react'
  
  import {
    useState,
  } from 'react'
  
  import {
    formatFileSize,
  } from '../lib/fileUtils'
  
  function FileRow({
    file,
    index,
  
    dragging,
    dragOver,
  
    onDragStart,
    onDragEnter,
    onDragOver,
    onDrop,
    onDragEnd,
  
    onToggleInclude,
    onRemove,
    onPreview,
  }) {
    const [
      menuOpen,
      setMenuOpen,
    ] = useState(false)
  
    return (
      <article
        onDragEnter={
          onDragEnter
        }
  
        onDragOver={
          onDragOver
        }
  
        onDrop={
          onDrop
        }
  
        className={`document-row ${
          dragging
            ? 'document-row-dragging'
            : ''
        } ${
          dragOver
            ? 'document-row-over'
            : ''
        } ${
          !file.included
            ? 'document-row-disabled'
            : ''
        }`}
      >
  
        <div className="flex items-start gap-2">
  
          {!file.error ? (
            <button
              type="button"
  
              draggable
  
              onDragStart={
                onDragStart
              }
  
              onDragEnd={
                onDragEnd
              }
  
              className="document-drag-handle"
  
              title="Drag document"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : (
            <div className="w-7" />
          )}
  
          <div className="min-w-0 flex-1">
  
            <div className="flex items-start justify-between gap-2">
  
              <div className="min-w-0">
  
                <p
                  className="truncate text-[12px] font-medium text-slate-800"
  
                  title={
                    file.name
                  }
                >
                  {file.name}
                </p>
  
                <p className="mt-[2px] text-[10px] text-slate-500">
                  {file.error
                    ? 'Unreadable PDF'
                    : `${file.pageCount} page${
                        file.pageCount ===
                        1
                          ? ''
                          : 's'
                      } · ${formatFileSize(
                        file.size,
                      )}`}
                </p>
  
              </div>
  
              {!file.error ? (
                <div className="relative">
  
                  <button
                    type="button"
  
                    onClick={() =>
                      setMenuOpen(
                        (value) =>
                          !value,
                      )
                    }
  
                    className="document-more"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
  
                  {menuOpen ? (
                    <div className="document-menu">
  
                      <button
                        type="button"
  
                        onClick={() => {
                          onPreview(
                            file.id,
                          )
  
                          setMenuOpen(
                            false,
                          )
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Quick Look
                      </button>
  
                      <button
                        type="button"
  
                        onClick={() => {
                          onToggleInclude(
                            file.id,
                          )
  
                          setMenuOpen(
                            false,
                          )
                        }}
                      >
                        {file.included
                          ? 'Exclude document'
                          : 'Include document'}
                      </button>
  
                      <div className="document-menu-divider" />
  
                      <button
                        type="button"
  
                        onClick={() => {
                          onRemove(
                            file.id,
                          )
  
                          setMenuOpen(
                            false,
                          )
                        }}
  
                        className="document-menu-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
  
                    </div>
                  ) : null}
  
                </div>
              ) : null}
  
            </div>
  
            {!file.error ? (
              <div className="mt-2 flex items-center gap-2">
  
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] text-slate-500">
  
                  <input
                    type="checkbox"
  
                    checked={
                      file.included
                    }
  
                    onChange={() =>
                      onToggleInclude(
                        file.id,
                      )
                    }
  
                    className="h-3.5 w-3.5 accent-[#007aff]"
                  />
  
                  In final PDF
  
                </label>
  
                <button
                  type="button"
  
                  onClick={() =>
                    onPreview(
                      file.id,
                    )
                  }
  
                  className="ml-auto text-[10px] font-medium text-[#007aff] hover:underline"
                >
                  Preview
                </button>
  
              </div>
            ) : (
              <button
                type="button"
  
                onClick={() =>
                  onRemove(
                    file.id,
                  )
                }
  
                className="mt-2 text-[10px] font-medium text-rose-600"
              >
                Remove
              </button>
            )}
  
          </div>
  
        </div>
  
      </article>
    )
  }
  
  export default FileRow