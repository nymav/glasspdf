let pdfjsPromise
const loadPdfjs = () => pdfjsPromise ||= Promise.all([
  import('pdfjs-dist'),
  import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
]).then(([pdfjs, worker]) => {
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  return pdfjs
})

const documentCache =
  new Map()

const normalizeRotation = (
  value = 0,
) =>
  (
    (value % 360) +
    360
  ) %
  360

export const getCachedPdfDocument =
  async ({
    fileId,
    fileUrl,
  }) => {
    const cached =
      documentCache.get(
        fileId,
      )

    if (cached) {
      return cached.promise
    }

    const pdfjsLib = await loadPdfjs()
    const existing = documentCache.get(fileId)
    if (existing) return existing.promise
    const loadingTask =
      pdfjsLib.getDocument({
        url: fileUrl,
        verbosity: 0,
        isEvalSupported: false,
      })

    const promise =
      loadingTask.promise.catch(
        (error) => {
          documentCache.delete(
            fileId,
          )

          throw error
        },
      )

    documentCache.set(
      fileId,
      {
        loadingTask,
        promise,
      },
    )

    return promise
  }

export const startPdfPageRender =
  async ({
    fileId,
    fileUrl,

    pageNumber,

    canvas,

    targetWidth,

    additionalRotation = 0,
  isCancelled = () => false,
  }) => {
    if (!canvas) {
      throw new Error(
        'Preview canvas is unavailable.',
      )
    }

    const pdf =
      await getCachedPdfDocument({
        fileId,
        fileUrl,
      })

    const page =
      await pdf.getPage(
        pageNumber,
      )

    if (isCancelled()) throw new DOMException('Cancelled', 'AbortError')

    const sourceRotation =
      Number(
        page.rotate || 0,
      )

    const finalRotation =
      normalizeRotation(
        sourceRotation +
          additionalRotation,
      )

    const baseViewport =
      page.getViewport({
        scale: 1,
        rotation:
          finalRotation,
      })

    const cssScale =
      targetWidth /
      baseViewport.width

    /*
     * Limit high-DPI cost.
     *
     * 1.5 looks crisp without rendering enormous canvases
     * for every thumbnail on a Retina display.
     */
    const pixelRatio =
      Math.min(
        window.devicePixelRatio ||
          1,

        1.5,
      )

    const viewport =
      page.getViewport({
        scale:
          cssScale *
          pixelRatio,

        rotation:
          finalRotation,
      })

    canvas.width =
      Math.ceil(
        viewport.width,
      )

    canvas.height =
      Math.ceil(
        viewport.height,
      )

    canvas.style.width =
      `${
        viewport.width /
        pixelRatio
      }px`

    canvas.style.height =
      `${
        viewport.height /
        pixelRatio
      }px`

    const context =
      canvas.getContext(
        '2d',
        {
          alpha: false,
        },
      )

    if (!context) {
      throw new Error(
        'Unable to create preview canvas.',
      )
    }

    const renderTask =
      page.render({
        canvasContext:
          context,

        viewport,

        background:
          '#ffffff',
      })

    return {
      renderTask,
    }
  }

export const removePdfFromPreviewCache =
  (fileId) => {
    const cached =
      documentCache.get(
        fileId,
      )

    if (!cached) return

    documentCache.delete(
      fileId,
    )

    try {
      const result =
        cached.loadingTask.destroy()

      result?.catch?.(
        () => {},
      )
    } catch {
      // Cleanup must not break UI.
    }
  }

export const clearPdfPreviewCache =
  () => {
    for (
      const cached of documentCache.values()
    ) {
      try {
        const result =
          cached.loadingTask.destroy()

        result?.catch?.(
          () => {},
        )
      } catch {
        // Ignore cleanup failures.
      }
    }

    documentCache.clear()
  }