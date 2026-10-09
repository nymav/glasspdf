import {
  memo,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  startPdfPageRender,
} from '../lib/pdfPreviewUtils'

function PdfCanvas({
  fileId,
  fileUrl,

  pageNumber,

  rotation = 0,

  width = 185,

  lazy = true,

  className = '',
}) {
  const wrapperRef =
    useRef(null)

  const canvasRef =
    useRef(null)

  const renderTaskRef =
    useRef(null)

  const [
    shouldRender,
    setShouldRender,
  ] = useState(!lazy)

  const [
    result,
    setResult,
  ] = useState(null)
  const renderKey = `${fileId}:${fileUrl}:${pageNumber}:${rotation}:${width}`
  const status = result?.key === renderKey ? result.status : 'loading'

  useEffect(() => {
    if (!lazy) {
      return undefined
    }

    const element =
      wrapperRef.current

    if (!element) {
      return undefined
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting
          ) {
            setShouldRender(
              true,
            )

            observer.disconnect()
          }
        },

        {
          rootMargin: '350px',
        },
      )

    observer.observe(element)

    return () =>
      observer.disconnect()
  }, [lazy])

  useEffect(() => {
    if (lazy && !shouldRender) {
      return undefined
    }

    let cancelled = false

    const render =
      async () => {
        try {
          const {
            renderTask,
          } =
            await startPdfPageRender({
              fileId,
              fileUrl,

              pageNumber,

              canvas:
                canvasRef.current,

              targetWidth:
                width,

              additionalRotation:
                rotation,
            })

          if (cancelled) {
            renderTask.cancel()
            await renderTask.promise.catch(() => {})
            return
          }

          renderTaskRef.current =
            renderTask

          await renderTask.promise

          if (!cancelled) {
            setResult({ key: renderKey, status: 'ready' })
          }
        } catch (error) {
          if (
            cancelled ||
            error?.name ===
              'RenderingCancelledException'
          ) {
            return
          }

          console.error(
            'PDF preview failed:',
            {
              fileId,
              pageNumber,
              error,
            },
          )

          setResult({ key: renderKey, status: 'error' })
        }
      }

    render()

    return () => {
      cancelled = true

      try {
        renderTaskRef.current?.cancel()
      } catch {
        // Ignore cancellation.
      }

      renderTaskRef.current =
        null
    }
  }, [
    shouldRender,
    lazy,
    renderKey,

    fileId,
    fileUrl,

    pageNumber,
    rotation,
    width,
  ])

  return (
    <div
      ref={
        wrapperRef
      }

      className={`pdf-canvas relative flex items-center justify-center overflow-hidden bg-white ${className}`}
    >

      {status ===
      'loading' ? (
        <div className="absolute inset-0 animate-pulse bg-slate-100" />
      ) : null}

      {status ===
      'error' ? (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-[10px] text-rose-600">
          Preview unavailable
        </div>
      ) : null}

      <canvas
        ref={
          canvasRef
        }

        role="img"
      aria-label={`Preview of page ${pageNumber}`}
      className={`block transition-opacity duration-150 ${
          status ===
          'ready'
            ? 'opacity-100'
            : 'opacity-0'
        }`}
      />

    </div>
  )
}

export default memo(PdfCanvas)