import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import PdfCanvas from './PdfCanvas'

function PdfPreviewModal({
  file,

  initialPage = 1,

  resolveRotation,

  onClose,
}) {
  const [
    currentPage,
    setCurrentPage,
  ] = useState(
    initialPage,
  )

  const [
    zoom,
    setZoom,
  ] = useState(1)

  const [
    viewportWidth,
    setViewportWidth,
  ] = useState(
    window.innerWidth,
  )

  useEffect(() => {
    setCurrentPage(
      Math.min(
        Math.max(
          initialPage,
          1,
        ),
        file.pageCount,
      ),
    )

    setZoom(1)
  }, [
    file.id,
    file.pageCount,
    initialPage,
  ])

  useEffect(() => {
    const updateViewport =
      () =>
        setViewportWidth(
          window.innerWidth,
        )

    window.addEventListener(
      'resize',
      updateViewport,
    )

    return () =>
      window.removeEventListener(
        'resize',
        updateViewport,
      )
  }, [])

  useEffect(() => {
    const handleKeyDown = (
      event,
    ) => {
      if (
        event.key ===
        'Escape'
      ) {
        onClose()
      }

      if (
        event.key ===
        'ArrowLeft'
      ) {
        setCurrentPage(
          (page) =>
            Math.max(
              1,
              page - 1,
            ),
        )
      }

      if (
        event.key ===
        'ArrowRight'
      ) {
        setCurrentPage(
          (page) =>
            Math.min(
              file.pageCount,
              page + 1,
            ),
        )
      }

      if (
        event.key === '+'
      ) {
        setZoom(
          (value) =>
            Math.min(
              2,
              Number(
                (
                  value +
                  0.1
                ).toFixed(1),
              ),
            ),
        )
      }

      if (
        event.key === '-'
      ) {
        setZoom(
          (value) =>
            Math.max(
              0.5,
              Number(
                (
                  value -
                  0.1
                ).toFixed(1),
              ),
            ),
        )
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () =>
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
  }, [
    file.pageCount,
    onClose,
  ])

  const previewWidth =
    useMemo(() => {
      const available =
        Math.max(
          320,
          Math.min(
            860,
            viewportWidth -
              140,
          ),
        )

      return Math.round(
        available * zoom,
      )
    }, [
      viewportWidth,
      zoom,
    ])

  return (
    <div
      className="quicklook-backdrop"

      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >

      <section className="quicklook-window">

        <header className="quicklook-header">

          <div className="flex min-w-0 items-center gap-3">

            <div
              className="hidden items-center gap-[6px] sm:flex"
              aria-hidden="true"
            >
              <span className="traffic-light bg-[#ff5f57]" />
              <span className="traffic-light bg-[#febc2e]" />
              <span className="traffic-light bg-[#28c840]" />
            </div>

            <div className="min-w-0">

              <p className="truncate text-[12px] font-medium text-slate-800">
                {file.name}
              </p>

              <p className="text-[10px] text-slate-500">
                Page {currentPage} of {file.pageCount}
              </p>

            </div>

          </div>

          <div className="flex items-center gap-1">

            <button
              type="button"

              disabled={
                currentPage <= 1
              }

              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1,
                    ),
                )
              }

              className="quicklook-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"

              disabled={
                currentPage >=
                file.pageCount
              }

              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      file.pageCount,
                      page + 1,
                    ),
                )
              }

              className="quicklook-button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-slate-900/10" />

            <button
              type="button"

              onClick={() =>
                setZoom(
                  (value) =>
                    Math.max(
                      0.5,
                      Number(
                        (
                          value -
                          0.1
                        ).toFixed(1),
                      ),
                    ),
                )
              }

              className="quicklook-button"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <span className="w-10 text-center text-[10px] font-medium text-slate-500">
              {Math.round(
                zoom * 100,
              )}
              %
            </span>

            <button
              type="button"

              onClick={() =>
                setZoom(
                  (value) =>
                    Math.min(
                      2,
                      Number(
                        (
                          value +
                          0.1
                        ).toFixed(1),
                      ),
                    ),
                )
              }

              className="quicklook-button"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <button
              type="button"

              onClick={
                onClose
              }

              className="quicklook-button ml-1"
            >
              <X className="h-4 w-4" />
            </button>

          </div>

        </header>

        <div className="quicklook-canvas-area">

          <div className="mx-auto flex min-h-full w-max items-start justify-center">

            <PdfCanvas
              fileId={
                file.id
              }

              fileUrl={
                file.fileUrl
              }

              pageNumber={
                currentPage
              }

              rotation={
                resolveRotation
                  ? resolveRotation(
                      currentPage,
                    )
                  : 0
              }

              width={
                previewWidth
              }

              lazy={
                false
              }

              className="min-h-[420px] rounded-lg shadow-2xl"
            />

          </div>

        </div>

        <footer className="quicklook-footer">

          <span>
            ← → pages
          </span>

          <span>
            + − zoom
          </span>

          <span>
            Esc close
          </span>

        </footer>

      </section>

    </div>
  )
}

export default PdfPreviewModal