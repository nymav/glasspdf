import {
  CheckSquare2,
  Rows3,
} from 'lucide-react'

import {
  useState,
} from 'react'

function Toolbar({
  files,

  viewSize,
  setViewSize,

  onMarkAll,
  onClearMarks,

  onSetFileMarks,
  onApplyRange,
}) {
  const usableFiles =
    files.filter(
      (file) =>
        !file.error &&
        file.pageCount > 0,
    )

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(
    usableFiles[0]?.id || '',
  )

  const [
    range,
    setRange,
  ] = useState('')

  const [
    rangeOpen,
    setRangeOpen,
  ] = useState(false)

  const activeFile = usableFiles.some(file => file.id === selectedFile) ? selectedFile : usableFiles[0]?.id || ''

  return (
    <div className="page-toolbar">

      <div className="flex items-center gap-1">

        <button
          type="button"

          onClick={
            onMarkAll
          }

          className="page-toolbar-button"
        >
          <CheckSquare2 className="h-3.5 w-3.5" />
          Select all
        </button>

        <button
          type="button"

          onClick={() =>
            setRangeOpen(
              (value) =>
                !value,
            )
          }

          className={`page-toolbar-button ${
            rangeOpen
              ? 'page-toolbar-button-active'
              : ''
          }`}
        >
          <Rows3 className="h-3.5 w-3.5" />
          Range
        </button>

      </div>

      <div className="flex items-center gap-2">

        <span className="text-[10px] text-slate-500">
          View
        </span>

        <div className="view-switch">

          {[
            ['small', 'S'],
            ['medium', 'M'],
            ['large', 'L'],
          ].map(
            ([value, label]) => (
              <button
                key={value}

                type="button"

                onClick={() =>
                  setViewSize(
                    value,
                  )
                }

                className={`view-button ${
                  viewSize ===
                  value
                    ? 'view-button-active'
                    : ''
                }`}
              >
                {label}
              </button>
            ),
          )}

        </div>

      </div>

      {rangeOpen ? (
        <div className="range-popover">

          <p className="mb-2 text-[11px] font-semibold text-slate-700">
            Select page range
          </p>

          <select
            value={
              activeFile
            }

            onChange={(event) =>
              setSelectedFile(
                event.target.value,
              )
            }

            aria-label="Document for page range"
            className="mac-input"
          >

            {usableFiles.map(
              (file) => (
                <option
                  key={
                    file.id
                  }

                  value={
                    file.id
                  }
                >
                  {file.name}
                </option>
              ),
            )}

          </select>

          <input
            type="text"

            value={
              range
            }

            onChange={(event) =>
              setRange(
                event.target.value,
              )
            }

            aria-label="Page range"
            placeholder="1-4, 7, 10-12"

            className="mac-input mt-2"
          />

          <div className="mt-2 flex gap-1.5">
            <button type="button" className="mac-secondary-button flex-1 justify-center" onClick={() => onApplyRange({ fileId: activeFile, expression: range, mode: 'select' })}>Select</button>


            <button
              type="button"

              onClick={() =>
                onApplyRange({
                  fileId:
                    activeFile,

                  expression:
                    range,

                  included:
                    true,
                })
              }

              className="mac-secondary-button flex-1 justify-center"
            >
              Include
            </button>

            <button
              type="button"

              onClick={() =>
                onApplyRange({
                  fileId:
                    activeFile,

                  expression:
                    range,

                  included:
                    false,
                })
              }

              className="mac-secondary-button flex-1 justify-center"
            >
              Exclude
            </button>

          </div>

          <div className="mt-3 border-t border-slate-900/10 pt-2">

            <button
              type="button"

              onClick={() =>
                onSetFileMarks(
                  activeFile,
                  true,
                )
              }

              className="range-text-button"
            >
              Select entire document
            </button>

            <button
              type="button"

              onClick={
                onClearMarks
              }

              className="range-text-button"
            >
              Clear page selection
            </button>

          </div>

        </div>
      ) : null}

    </div>
  )
}

export default Toolbar