import {
  CheckCircle2,
  Download,
  ExternalLink,
  LoaderCircle,
  Merge,
} from 'lucide-react'

function MergeSummary({
  downloadRequested,
  outputStale,
  outputPageCount,
  selectedCount,
  onExtract,
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
      <div className="mobile-export-bar"><span>{outputUrl ? `${outputPageCount} pages ready` : `${finalPages.length} pages in export`}</span><button className="mac-primary-button" disabled={!finalPages.length || mergeState === 'merging'} onClick={outputUrl ? onDownload : onMerge}>{outputUrl ? 'Download PDF' : 'Review export'}</button></div>

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
              {new Set(finalPages.map(page => page.fileId)).size}
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

          <label htmlFor="output-filename" className="mac-label">
            Filename
          </label>

          <input
            id="output-filename"
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

          className={`${outputUrl ? 'mac-secondary-button' : 'mac-primary-button'} w-full justify-center`}
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
            : outputUrl ? 'Create another export' : 'Review export'}

        </button>

        {outputStale && <p role="status" className="text-xs leading-5 text-slate-600">Workspace changed. Review export to create an updated PDF.</p>}
        <button type="button" className="mac-secondary-button w-full justify-center" disabled={!selectedCount || mergeState === 'merging'} onClick={onExtract}>Extract selected ({selectedCount || 0})</button>

        {outputUrl ? (
          <div className="space-y-2">

            <div className="pdf-ready">

              <CheckCircle2 className="h-4 w-4" />

              PDF ready · {outputPageCount} {outputPageCount === 1 ? 'page' : 'pages'}

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

        {outputUrl && <p className="text-xs leading-5 text-slate-600">Page count, order and rotation checked. Preview before sharing.</p>}
        {outputUrl && <p className="text-xs leading-5 text-slate-600">{downloadRequested ? 'Download requested. Check your downloads folder.' : 'Not downloaded yet. Download before closing or reloading.'}</p>}

        <div className="export-privacy">

          <div className="privacy-dot" />

          {import.meta.env.MODE === 'desktop' ? 'Processed on your device' : 'Processed in your browser'}

        </div>


      </div>

    </aside>
  )
}

export default MergeSummary