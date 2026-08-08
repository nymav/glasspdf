import {
  CheckCircle2,
  Download,
  ExternalLink,
  LoaderCircle,
  Merge,
} from 'lucide-react'

function MergeSummary({
  files,
  pages,

  mergeState,

  outputUrl,
  outputName,

  setOutputName,

  onMerge,
  onDownload,
  onPreviewOutput,
}) {
  const fileMap =
    new Map(
      files.map(
        (file) => [
          file.id,
          file,
        ],
      ),
    )

  const activeFiles =
    files.filter(
      (file) =>
        file.included &&
        !file.error,
    )

  const finalPages =
    pages.filter(
      (page) => {
        const source =
          fileMap.get(
            page.fileId,
          )

        return (
          page.included &&
          source?.included &&
          !source?.error
        )
      },
    )

  const firstPage =
    finalPages[0]

  const lastPage =
    finalPages[
      finalPages.length - 1
    ]

  return (
    <aside className="export-panel">

      <div className="sidebar-heading">

        <div>

          <h2>
            Export
          </h2>

          <p>
            Create the final PDF
          </p>

        </div>

      </div>

      <div className="export-content">

        <div className="export-stats">

          <div>

            <strong>
              {activeFiles.length}
            </strong>

            <span>
              Documents
            </span>

          </div>

          <div>

            <strong>
              {finalPages.length}
            </strong>

            <span>
              Pages
            </span>

          </div>

        </div>

        {firstPage ? (
          <div className="export-summary">

            <div>

              <span>
                Starts with
              </span>

              <p>
                {firstPage.fileName}
                {' · '}
                p.{firstPage.pageNumber}
              </p>

            </div>

            <div>

              <span>
                Ends with
              </span>

              <p>
                {lastPage.fileName}
                {' · '}
                p.{lastPage.pageNumber}
              </p>

            </div>

          </div>
        ) : null}

        <div>

          <label className="mac-label">
            Filename
          </label>

          <input
            type="text"

            value={
              outputName
            }

            onChange={(event) =>
              setOutputName(
                event.target.value,
              )
            }

            className="mac-input"

            placeholder="merged-document.pdf"
          />

        </div>

        <button
          type="button"

          onClick={
            onMerge
          }

          disabled={
            finalPages.length ===
              0 ||
            mergeState ===
              'merging'
          }

          className="mac-primary-button w-full justify-center"
        >

          {mergeState ===
          'merging' ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Merge className="h-4 w-4" />
          )}

          {mergeState ===
          'merging'
            ? 'Creating…'
            : 'Create PDF'}

        </button>

        {outputUrl ? (
          <div className="space-y-2">

            <div className="pdf-ready">

              <CheckCircle2 className="h-4 w-4" />

              PDF ready

            </div>

            <button
              type="button"

              onClick={
                onPreviewOutput
              }

              className="mac-secondary-button w-full justify-center"
            >
              <ExternalLink className="h-4 w-4" />
              Preview
            </button>

            <button
              type="button"

              onClick={
                onDownload
              }

              className="mac-download-button"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>

          </div>
        ) : null}

        <div className="export-privacy">

          <div className="privacy-dot" />

          Generated locally in your browser

        </div>

        <div className="shortcut-card">

          <p>
            Keyboard
          </p>

          <span>
            ⌘O Add files
          </span>

          <span>
            ⌘Z Undo
          </span>

          <span>
            Space Quick Look
          </span>

          <span>
            ⌘E Export
          </span>

        </div>

      </div>

    </aside>
  )
}

export default MergeSummary