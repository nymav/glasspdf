import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'sonner'

import Header from './components/Header'
import UploadDropzone from './components/UploadDropzone'
import FileList from './components/FileList'
import PageOrganizer from './components/PageOrganizer'
import MergeSummary from './components/MergeSummary'
import PdfPreviewModal from './components/PdfPreviewModal'
import StatusBar from './components/StatusBar.jsx'

import {
  ensurePdfExtension,
  makeId,
  parsePageRange,
  toObjectUrl,
} from './lib/fileUtils'

import { runPdfJob, cancelPdfJob } from './lib/pdfJobs'
import { clearPdfPreviewCache, removePdfFromPreviewCache } from './lib/pdfPreviewUtils'
import ExportReview from './components/ExportReview'
import WorkspaceGuide from './components/WorkspaceGuide'

const HISTORY_LIMIT = 25

function App() {
  const [downloadRequested, setDownloadRequested] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const [outputPageCount, setOutputPageCount] = useState(0)
  const [operation, setOperation] = useState(null)
  const [review, setReview] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const operationRef = useRef(null)
  const announce = message => setAnnouncement(message)
  const [files, setFiles] = useState([])
  const [pages, setPages] = useState([])

  const [loading, setLoading] = useState(false)
  const [isDraggingUpload, setIsDraggingUpload] =
    useState(false)

  const [mergeState, setMergeState] =
    useState('idle')

  const [outputUrl, setOutputUrl] =
    useState('')

  const [outputName, setOutputName] =
    useState('merged-document.pdf')

  const [undoStack, setUndoStack] =
    useState([])

  const [redoStack, setRedoStack] =
    useState([])

  const [preview, setPreview] =
    useState(null)

  const sourceUrlRegistry =
    useRef(new Set())

  const outputUrlRef =
    useRef('')

  const workspaceVersionRef =
    useRef(0)

  const fileInputRef =
    useRef(null)

  // =====================================================
  // REFERENCES / CLEANUP
  // =====================================================

  useEffect(() => {
    outputUrlRef.current =
      outputUrl
  }, [outputUrl])

  useEffect(() => {
    const registry = sourceUrlRegistry.current
    return () => {
      cancelPdfJob()
      clearPdfPreviewCache()

      registry.forEach(
        (url) => {
          URL.revokeObjectURL(url)
        },
      )

      registry.clear()

      if (outputUrlRef.current) {
        URL.revokeObjectURL(
          outputUrlRef.current,
        )
      }
    }
  }, [])

  useEffect(() => {
    if (!unsaved) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  // =====================================================
  // LOOKUPS
  // =====================================================

  const filesById =
    useMemo(() => {
      const result = {}

      files.forEach((file) => {
        result[file.id] = file
      })

      return result
    }, [files])

  const validFileCount =
    useMemo(
      () =>
        files.filter(
          (file) => !file.error,
        ).length,
      [files],
    )

  const includedPages =
    useMemo(
      () =>
        pages.filter((page) => {
          const file =
            filesById[page.fileId]

          return (
            page.included &&
            file?.included &&
            !file?.error
          )
        }),
      [pages, filesById],
    )

  const markedPages =
    useMemo(
      () =>
        pages.filter(
          (page) => page.marked,
        ),
      [pages],
    )

  // =====================================================
  // OUTPUT
  // =====================================================

  const invalidateOutput = () => {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(
        outputUrlRef.current,
      )
    }

    outputUrlRef.current = ''

    setOutputUrl('')
    setDownloadRequested(false)
    setOutputPageCount(0)
    setMergeState('idle')
  }

  // =====================================================
  // HISTORY
  // =====================================================

  const pushHistory = () => {
    setUndoStack((previous) => [
      ...previous.slice(
        -(HISTORY_LIMIT - 1),
      ),
      {
        files,
        pages,
      },
    ])

    setRedoStack([])
  }

  const commitWorkspace = (
    nextFiles,
    nextPages,
    {
      trackHistory = true,
      affectsOutput = true,
    } = {},
  ) => {
    if (trackHistory) {
      pushHistory()
    }

    setFiles(nextFiles)
    setPages(nextPages)
    if (affectsOutput) setUnsaved(nextPages.length > 0)

    if (
      preview &&
      !nextFiles.some(
        (file) =>
          file.id === preview.fileId,
      )
    ) {
      setPreview(null)
    }

    if (affectsOutput) {
      workspaceVersionRef.current += 1
      invalidateOutput()
    }
  }

  // =====================================================
  // FILE UPLOAD
  // =====================================================

  const cancelOperation = () => {
    if (operationRef.current) operationRef.current.cancelled = true
    cancelPdfJob()
    announce('Processing cancelled. Your existing workspace is unchanged.')
  }

  const addFiles = async inputFiles => {
    if (operationRef.current) return
    const incoming = Array.from(inputFiles)
    const supported = incoming.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
    const rejected = incoming.length - supported.length
    if (rejected) toast.error(`${rejected} unsupported file${rejected === 1 ? '' : 's'} skipped. Choose PDF documents; images and Office files are not supported.`)
    if (!supported.length) return
    const totalBytes = [...files, ...supported].reduce((sum, file) => sum + file.size, 0)
    if ((supported.some(file => file.size > 25 * 1024 * 1024) || totalBytes > 100 * 1024 * 1024) && !window.confirm('Large PDF workspace: previews and export may use substantial device memory. Try smaller files if your browser is slow. Continue?')) return
    const token = { cancelled: false }; operationRef.current = token
    setLoading(true)
    const newFiles = [], newPages = [], newUrls = []
    let committed = false
    try {
      for (const [index, file] of supported.entries()) {
        if (token.cancelled) throw new DOMException('Cancelled', 'AbortError')
        setOperation({ done: index, total: supported.length, label: `Reading document ${index + 1} of ${supported.length}` })
        const id = makeId()
        try {
          const { pageCount } = await runPdfJob('parse', { file })
          if (token.cancelled) throw new DOMException('Cancelled', 'AbortError')
          const fileUrl = URL.createObjectURL(file); newUrls.push(fileUrl)
          newFiles.push({ id, name: file.name, size: file.size, pageCount, included: true, source: file, fileUrl, error: null })
          for (let index = 0; index < pageCount; index++) newPages.push({ id: makeId(), fileId: id, fileName: file.name, originalPageIndex: index, pageNumber: index + 1, included: true, marked: false, rotation: 0, fileUrl })
        } catch (error) {
          if (error.name === 'AbortError' || token.cancelled) throw error
          newFiles.push({ id, name: file.name, size: file.size, pageCount: 0, included: false, source: null, fileUrl: '', error: error.message })
          toast.error(error.message)
        }
      }
      if (token.cancelled) throw new DOMException('Cancelled', 'AbortError')
      newUrls.forEach(url => sourceUrlRegistry.current.add(url))
      commitWorkspace([...files, ...newFiles], [...pages, ...newPages]); committed = true
      const successful = newFiles.filter(file => !file.error).length
      const message = `${successful} PDF${successful === 1 ? '' : 's'} added, ${newPages.length} pages ready.`
      announce(message); if (successful) toast.success(message)
    } catch (error) {
      if (error.name === 'AbortError' || token.cancelled) toast.message('Import cancelled. Existing documents were kept.')
      else toast.error(error.message || 'Unable to import PDFs.')
    } finally {
      if (!committed) newUrls.forEach(url => URL.revokeObjectURL(url))
      operationRef.current = null; setLoading(false); setOperation(null)
    }
  }

  const loadSample = async () => {
    if (operationRef.current) return
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sample.pdf`)
      if (!response.ok) throw new Error('Sample unavailable. Check your connection and try again.')
      await addFiles([new File([await response.blob()], 'GlassPDF-sample.pdf', { type: 'application/pdf' })])
    } catch (error) { toast.error(error.message) }
  }

  const onInputChange =
    async (event) => {
      if (
        event.target.files
          ?.length
      ) {
        await addFiles(
          event.target.files,
        )
      }

      event.target.value = ''
    }

  const chooseFiles = () => {
    fileInputRef.current?.click()
  }

  const onDrop =
    async (event) => {
      event.preventDefault()

      setIsDraggingUpload(false)

      if (
        event.dataTransfer?.files
          ?.length
      ) {
        await addFiles(
          event.dataTransfer.files,
        )
      }
    }

  // =====================================================
  // FILE MANAGEMENT
  // =====================================================

  const removeFile = (
    fileId,
  ) => {
    const source =
      files.find(
        (file) =>
          file.id === fileId,
      )

    const nextFiles =
      files.filter(
        (file) =>
          file.id !== fileId,
      )

    const nextPages =
      pages.filter(
        (page) =>
          page.fileId !== fileId,
      )

    removePdfFromPreviewCache(
      fileId,
    )

    commitWorkspace(
      nextFiles,
      nextPages,
    )

    if (source) {
      toast.message(
        `${source.name} removed`,
      )
    }
  }

  const toggleFileIncluded = (
    fileId,
  ) => {
    const nextFiles =
      files.map((file) =>
        file.id === fileId
          ? {
              ...file,
              included:
                !file.included,
            }
          : file,
      )

    commitWorkspace(
      nextFiles,
      pages,
    )
  }

  // =====================================================
  // FAST SOURCE REORDER
  //
  // Runs ON DROP ONLY.
  // =====================================================

  const reorderFiles = (
    oldIndex,
    newIndex,
  ) => {
    if (
      oldIndex === newIndex ||
      oldIndex < 0 ||
      newIndex < 0
    ) {
      return
    }

    const nextFiles =
      arrayMove(
        files,
        oldIndex,
        newIndex,
      )

    /*
     * Preserve current page ordering INSIDE each file.
     *
     * Duplicates, rotations and manual page changes
     * stay intact.
     */
    const pageGroups =
      new Map()

    pages.forEach((page) => {
      if (
        !pageGroups.has(
          page.fileId,
        )
      ) {
        pageGroups.set(
          page.fileId,
          [],
        )
      }

      pageGroups
        .get(page.fileId)
        .push(page)
    })

    const nextPages = []

    nextFiles.forEach(
      (file) => {
        const group =
          pageGroups.get(
            file.id,
          )

        if (group) {
          nextPages.push(
            ...group,
          )
        }
      },
    )

    pushHistory()

    /*
     * Only state ordering changes.
     *
     * No PDF parsing.
     * No canvas recreation.
     */
    setFiles(nextFiles)
    setPages(nextPages)

    workspaceVersionRef.current += 1

    invalidateOutput()
  }

  // =====================================================
  // PAGE MANAGEMENT
  // =====================================================

  const togglePageIncluded = (
    pageId,
  ) => {
    const nextPages =
      pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              included:
                !page.included,
            }
          : page,
      )

    commitWorkspace(
      files,
      nextPages,
    )
  }

  const togglePageMarked = (
    pageId,
  ) => {
    /*
     * Selection only.
     * Does not affect generated PDF.
     */
    setPages((previous) =>
      previous.map((page) =>
        page.id === pageId
          ? {
              ...page,
              marked:
                !page.marked,
            }
          : page,
      ),
    )
  }

  const markAllPages = () => {
    setPages((previous) =>
      previous.map((page) => ({
        ...page,
        marked: true,
      })),
    )
  }

  const clearPageMarks = () => {
    setPages((previous) =>
      previous.map((page) => ({
        ...page,
        marked: false,
      })),
    )
  }

  const setFileMarks = (
    fileId,
    marked,
  ) => {
    setPages((previous) =>
      previous.map((page) =>
        page.fileId === fileId
          ? {
              ...page,
              marked,
            }
          : page,
      ),
    )
  }

  const removePage = (
    pageId,
  ) => {
    const nextPages =
      pages.filter(
        (page) =>
          page.id !== pageId,
      )

    const remainingIds =
      new Set(
        nextPages.map(
          (page) =>
            page.fileId,
        ),
      )

    const nextFiles =
      files.filter((file) => {
        if (file.error) {
          return true
        }

        return remainingIds.has(
          file.id,
        )
      })

    const removedFiles =
      files.filter(
        (file) =>
          !nextFiles.some(
            (nextFile) =>
              nextFile.id ===
              file.id,
          ),
      )

    removedFiles.forEach(
      (file) =>
        removePdfFromPreviewCache(
          file.id,
        ),
    )

    commitWorkspace(
      nextFiles,
      nextPages,
    )

    toast.message(
      'Page removed',
    )
  }

  const duplicatePage = (
    pageId,
  ) => {
    const index =
      pages.findIndex(
        (page) =>
          page.id === pageId,
      )

    if (index === -1) {
      return
    }

    const duplicate = {
      ...pages[index],

      id: makeId(),
      marked: false,
    }

    const nextPages = [
      ...pages,
    ]

    nextPages.splice(
      index + 1,
      0,
      duplicate,
    )

    commitWorkspace(
      files,
      nextPages,
    )

    toast.success(
      'Page duplicated',
    )
  }

  const rotatePage = (
    pageId,
    delta,
  ) => {
    const nextPages =
      pages.map((page) => {
        if (
          page.id !== pageId
        ) {
          return page
        }

        const rotation =
          (
            (
              (page.rotation || 0) +
              delta
            ) %
              360 +
            360
          ) %
          360

        return {
          ...page,
          rotation,
        }
      })

    commitWorkspace(
      files,
      nextPages,
    )
  }

  const reorderPages = (
    activeId,
    overId,
  ) => {
    if (
      !overId ||
      activeId === overId
    ) {
      return
    }

    const oldIndex =
      pages.findIndex(
        (page) =>
          page.id === activeId,
      )

    const newIndex =
      pages.findIndex(
        (page) =>
          page.id === overId,
      )

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return
    }

    commitWorkspace(
      files,
      arrayMove(
        pages,
        oldIndex,
        newIndex,
      ),
    )
  }

  // =====================================================
  // BULK PAGE ACTIONS
  // =====================================================

  const setMarkedPagesIncluded = (
    included,
  ) => {
    if (
      markedPages.length === 0
    ) {
      return
    }

    const nextPages =
      pages.map((page) =>
        page.marked
          ? {
              ...page,
              included,
            }
          : page,
      )

    commitWorkspace(
      files,
      nextPages,
    )
  }

  const removeMarkedPages = () => {
    if (
      markedPages.length === 0
    ) {
      return
    }

    const count =
      markedPages.length

    const nextPages =
      pages.filter(
        (page) =>
          !page.marked,
      )

    const remainingIds =
      new Set(
        nextPages.map(
          (page) =>
            page.fileId,
        ),
      )

    const nextFiles =
      files.filter(
        (file) =>
          file.error ||
          remainingIds.has(
            file.id,
          ),
      )

    commitWorkspace(
      nextFiles,
      nextPages,
    )

    toast.message(
      `${count} page${
        count === 1 ? '' : 's'
      } removed`,
    )
  }

  const moveMarkedPages = (
    target,
  ) => {
    if (
      markedPages.length === 0
    ) {
      return
    }

    const selected =
      pages.filter(
        (page) =>
          page.marked,
      )

    const rest =
      pages.filter(
        (page) =>
          !page.marked,
      )

    const nextPages =
      target === 'front'
        ? [
            ...selected,
            ...rest,
          ]
        : [
            ...rest,
            ...selected,
          ]

    commitWorkspace(
      files,
      nextPages,
    )
  }

  const applyPageRange = ({
    mode,
    fileId,
    expression,
    included,
  }) => {
    const file =
      files.find(
        (item) =>
          item.id === fileId,
      )

    if (
      !file ||
      file.error
    ) {
      toast.error(
        'Choose a valid PDF.',
      )
      return
    }

    const result =
      parsePageRange(
        expression,
        file.pageCount,
      )

    if (result.error) {
      toast.error(
        result.error,
      )
      return
    }

    if (mode === 'select') {
      setPages(pages.map(page => ({ ...page, marked: page.fileId === fileId && result.pageNumbers.has(page.pageNumber) })))
      announce(`${result.pageNumbers.size} pages selected for extraction.`)
      return
    }

    const nextPages =
      pages.map((page) => {
        if (
          page.fileId !== fileId ||
          !result.pageNumbers.has(
            page.pageNumber,
          )
        ) {
          return page
        }

        return {
          ...page,
          included,
        }
      })

    commitWorkspace(
      files,
      nextPages,
    )
  }

  // =====================================================
  // HISTORY
  // =====================================================

  const undoWorkspace = () => {
    if (
      undoStack.length === 0
    ) {
      return
    }

    const previous =
      undoStack[
        undoStack.length - 1
      ]

    const current = {
      files,
      pages,
    }

    setUndoStack(
      undoStack.slice(
        0,
        -1,
      ),
    )

    setRedoStack(
      (stack) => [
        ...stack,
        current,
      ],
    )

    setUnsaved(previous.pages.length > 0)
    setFiles(
      previous.files,
    )

    setPages(
      previous.pages,
    )

    setPreview(null)

    workspaceVersionRef.current += 1

    invalidateOutput()
  }

  const redoWorkspace = () => {
    if (
      redoStack.length === 0
    ) {
      return
    }

    const next =
      redoStack[
        redoStack.length - 1
      ]

    const current = {
      files,
      pages,
    }

    setRedoStack(
      redoStack.slice(
        0,
        -1,
      ),
    )

    setUndoStack(
      (stack) => [
        ...stack,
        current,
      ],
    )

    setUnsaved(next.pages.length > 0)
    setFiles(next.files)
    setPages(next.pages)

    setPreview(null)

    workspaceVersionRef.current += 1

    invalidateOutput()
  }

  // =====================================================
  // CLEAR
  // =====================================================

  const clearWorkspace = () => {
    if (
      files.length > 0 &&
      !window.confirm(
        'Clear all documents, previews, generated output and undo history from this app? Downloads and original files on your device will remain.',
      )
    ) {
      return
    }

    clearPdfPreviewCache()

    sourceUrlRegistry.current.forEach(
      (url) => {
        URL.revokeObjectURL(url)
      },
    )

    sourceUrlRegistry.current.clear()

    workspaceVersionRef.current += 1

    invalidateOutput()

    setFiles([])
    setPages([])

    setUndoStack([])
    setRedoStack([])

    setPreview(null)
    setReview(null)
    setUnsaved(false)
    setDownloadRequested(false)
    const message = 'Workspace cleared. Documents, previews and undo history were released from the app. This does not securely erase device memory or delete originals and downloads.'
    announce(message); toast.success(message)
  }

  // =====================================================
  // MERGE
  // =====================================================

  const requestExport = (mode = 'all') => {
    if (operationRef.current) return
    const selected = mode === 'selected'
      ? pages.filter(page => page.marked && filesById[page.fileId]?.source)
      : includedPages
    if (!selected.length) { toast.error(mode === 'selected' ? 'Select at least one page to extract.' : 'Include at least one page.'); return }
    setReview({ pages: selected.map(page => ({ ...page })), mode, version: workspaceVersionRef.current })
    if (mode === 'selected') setOutputName('extracted-pages.pdf')
  }

  const mergeIncludedPages = async () => {
    if (!review || operationRef.current) return
    const snapshot = review; setReview(null)
    if (snapshot.version !== workspaceVersionRef.current) { toast.error('Workspace changed. Review the export again.'); return }
    const token = { cancelled: false }; operationRef.current = token
    invalidateOutput(); setMergeState('merging'); setOperation({ done: 0, total: snapshot.pages.length, label: 'Preparing export' })
    try {
      const mergedBytes = await runPdfJob('merge', { selectedPages: snapshot.pages, files: files.filter(file => !file.error && snapshot.pages.some(page => page.fileId === file.id)).map(file => ({ id: file.id, source: file.source })) }, progress => {
        setOperation(progress)
      })
      if (token.cancelled || workspaceVersionRef.current !== snapshot.version) throw new DOMException('Cancelled', 'AbortError')
      const mergedUrl = toObjectUrl(mergedBytes, 'application/pdf')
      outputUrlRef.current = mergedUrl; setOutputUrl(mergedUrl); setOutputPageCount(snapshot.pages.length); setMergeState('done'); setDownloadRequested(false); setUnsaved(true)
      announce(`Verified PDF ready. ${snapshot.pages.length} pages checked in output order.`); toast.success('PDF verified and ready')
    } catch (error) {
      setMergeState('idle')
      if (error.name === 'AbortError' || token.cancelled) { toast.message('Export cancelled. Your documents were kept.'); announce('Export cancelled.') }
      else { toast.error(error.message || 'Unable to create PDF. Try fewer pages.'); announce('Export failed.') }
    } finally { operationRef.current = null; setOperation(null) }
  }

  const downloadMergedPdf =
    () => {
      if (!outputUrl) {
        return
      }

      const link =
        document.createElement(
          'a',
        )

      link.href =
        outputUrl

      link.download =
        ensurePdfExtension(
          outputName,
        )

      document.body.appendChild(
        link,
      )

      link.click()

      link.remove()
      setDownloadRequested(true)
      setUnsaved(false)
      announce('Download requested. Check your downloads folder; original files are unchanged.')
    }

  const previewMergedPdf =
    () => {
      if (!outputUrl) {
        return
      }

      setPreview({ fileId: 'generated-output', pageNumber: 1, pageId: null })
    }

  // =====================================================
  // PREVIEW
  // =====================================================

  const openFilePreview = (
    fileId,
  ) => {
    setPreview({
      fileId,
      pageNumber: 1,
      pageId: null,
    })
  }

  const openPagePreview = (
    page,
  ) => {
    setPreview({
      fileId:
        page.fileId,

      pageNumber:
        page.pageNumber,

      pageId:
        page.id,
    })
  }

  const resolvePreviewRotation = (
    pageNumber,
  ) => {
    if (
      !preview?.pageId ||
      pageNumber !==
        preview.pageNumber
    ) {
      return 0
    }

    return (
      pages.find(
        (page) =>
          page.id ===
          preview.pageId,
      )?.rotation || 0
    )
  }

  const previewFile =
    preview
      ? preview.fileId === 'generated-output'
        ? { id: 'generated-output', name: ensurePdfExtension(outputName), fileUrl: outputUrl, pageCount: outputPageCount }
        : filesById[preview.fileId]
      : null

  // =====================================================
  // MAC / DESKTOP KEYBOARD SHORTCUTS
  // =====================================================

  useEffect(() => {
    const isEditableTarget = (
      target,
    ) => {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )
    }

    const handleKeyboard = (
      event,
    ) => {
      const command =
        event.metaKey ||
        event.ctrlKey

      const editable =
        isEditableTarget(
          event.target,
        )

      if (event.defaultPrevented || document.querySelector('dialog[open]') || operationRef.current || preview) return

      if (
        command &&
        event.key.toLowerCase() ===
          'o'
      ) {
        event.preventDefault()
        chooseFiles()
        return
      }

      if (
        command &&
        event.key.toLowerCase() ===
          'z' &&
        !event.shiftKey
      ) {
        if (editable) return

        event.preventDefault()
        undoWorkspace()
        return
      }

      if (
        command &&
        event.key.toLowerCase() ===
          'z' &&
        event.shiftKey
      ) {
        if (editable) return

        event.preventDefault()
        redoWorkspace()
        return
      }

      if (
        command &&
        event.key.toLowerCase() ===
          'e'
      ) {
        if (editable) return

        event.preventDefault()
        requestExport()
        return
      }

      if (
        command &&
        event.key.toLowerCase() ===
          'a'
      ) {
        if (editable) return

        event.preventDefault()
        markAllPages()
        return
      }

      if (
        event.code === 'Space' &&
        !event.target.closest('button, a, summary') &&
        !editable &&
        markedPages.length === 1
      ) {
        event.preventDefault()

        openPagePreview(
          markedPages[0],
        )

        return
      }

      if (
        (
          event.key ===
            'Backspace' ||
          event.key ===
            'Delete'
        ) &&
        !editable &&
        markedPages.length > 0
      ) {
        event.preventDefault()

        removeMarkedPages()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyboard,
    )

    return () =>
      window.removeEventListener(
        'keydown',
        handleKeyboard,
      )
  })

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <input
        ref={fileInputRef}

        type="file"

        multiple

        aria-label="Choose PDF documents"
        accept="application/pdf,.pdf"

        className="sr-only"

        onChange={
          onInputChange
        }
      />

      <main className="min-h-screen px-3 py-3 sm:px-5 sm:py-5 lg:px-7">

        <div className="mx-auto max-w-[1740px]">

          <div className="mac-window">

            <Header
              busy={!!operation}
              fileCount={
                validFileCount
              }

              pageCount={
                includedPages.length
              }

              canUndo={
                undoStack.length > 0
              }

              canRedo={
                redoStack.length > 0
              }

              hasFiles={
                files.length > 0
              }

              onAddFiles={
                chooseFiles
              }

              onUndo={
                undoWorkspace
              }

              onRedo={
                redoWorkspace
              }

              onClear={
                clearWorkspace
              }
            />

            <WorkspaceGuide onSample={loadSample} busy={!!operation} />
            {operation && <section className="operation-panel" aria-label="PDF processing progress">
              <p role="status">{operation.label} · {operation.done} / {operation.total}</p>
              <progress value={operation.done} max={Math.max(1, operation.total)} aria-label={operation.label} />
              <button className="mac-secondary-button" onClick={cancelOperation}>Cancel processing</button>
            </section>}
            <fieldset disabled={!!operation} className="workspace-fieldset">
            <div className="px-3 pb-3">

              <UploadDropzone
                compact={
                  files.length > 0
                }

                loading={
                  loading
                }

                isDragging={
                  isDraggingUpload
                }

                onChoose={
                  chooseFiles
                }

                onDrop={
                  onDrop
                }

                onDragOver={(
                  event,
                ) => {
                  event.preventDefault()

                  setIsDraggingUpload(
                    true,
                  )
                }}

                onDragLeave={() =>
                  setIsDraggingUpload(
                    false,
                  )
                }
              />

              {files.length ===
              0 ? (
                <section className="empty-workspace">

                  <div className="empty-icon">
                    +
                  </div>

                  <h2>
                    Start a new PDF
                  </h2>

                  <p>
                    Add documents, arrange pages and export one final PDF.
                  </p>

                  <button
                    type="button"

                    onClick={
                      chooseFiles
                    }

                    className="mac-primary-button mt-5"
                  >
                    Choose PDFs
                  </button>

                  <p className="mt-4 text-[11px] text-slate-500">
                    ⌘O to add files · Processing stays local
                  </p>

                </section>
              ) : (
                <section className="workspace-grid">

                  <FileList
                    files={
                      files
                    }

                    onReorder={
                      reorderFiles
                    }

                    onToggleInclude={
                      toggleFileIncluded
                    }

                    onRemove={
                      removeFile
                    }

                    onPreview={
                      openFilePreview
                    }

                    onAddFiles={
                      chooseFiles
                    }
                  />

                  <PageOrganizer
                    pages={
                      pages
                    }

                    filesById={
                      filesById
                    }

                    onReorderPages={
                      reorderPages
                    }

                    onToggleIncluded={
                      togglePageIncluded
                    }

                    onToggleMarked={
                      togglePageMarked
                    }

                    onRemovePage={
                      removePage
                    }

                    onDuplicatePage={
                      duplicatePage
                    }

                    onRotatePage={
                      rotatePage
                    }

                    onPreviewPage={
                      openPagePreview
                    }

                    onMarkAll={
                      markAllPages
                    }

                    onClearMarks={
                      clearPageMarks
                    }

                    onSetFileMarks={
                      setFileMarks
                    }

                    onIncludeMarked={() =>
                      setMarkedPagesIncluded(
                        true,
                      )
                    }

                    onExcludeMarked={() =>
                      setMarkedPagesIncluded(
                        false,
                      )
                    }

                    onMoveFront={() =>
                      moveMarkedPages(
                        'front',
                      )
                    }

                    onMoveBack={() =>
                      moveMarkedPages(
                        'back',
                      )
                    }

                    onRemoveMarked={
                      removeMarkedPages
                    }

                    onApplyRange={
                      applyPageRange
                    }
                  />

                  <MergeSummary
                    downloadRequested={downloadRequested}
                    outputPageCount={outputPageCount}
                    selectedCount={markedPages.filter(page => filesById[page.fileId]?.source).length}
                    onExtract={() => requestExport('selected')}
                    files={
                      files
                    }

                    pages={
                      pages
                    }

                    mergeState={
                      mergeState
                    }

                    outputUrl={
                      outputUrl
                    }

                    outputName={
                      outputName
                    }

                    setOutputName={
                      setOutputName
                    }

                    onMerge={
                      requestExport
                    }

                    onDownload={
                      downloadMergedPdf
                    }

                    onPreviewOutput={
                      previewMergedPdf
                    }
                  />

                </section>
              )}

            </div>

            </fieldset>
            <StatusBar
              fileCount={
                validFileCount
              }

              totalPages={
                pages.length
              }

              includedPages={
                includedPages.length
              }

              selectedPages={
                markedPages.length
              }
            />

          </div>

        </div>

        <aside aria-label="Document privacy" className="mx-auto max-w-3xl px-6 py-5 text-center text-xs leading-6 text-slate-600">
          <p>PDFs are processed locally in your browser. GlassPDF does not upload or store your documents on a server. Your original files stay unchanged; exports are new PDFs.</p>
          <details className="mt-1">
            <summary className="cursor-pointer underline underline-offset-4">Privacy details</summary>
            <p className="mt-2">Documents are held temporarily in browser memory while you work. Downloaded PDFs are saved on your device. GlassPDF has no analytics or saved workspace. Offline support caches only app files and the public sample, never your documents. GitHub Pages records visitor IP addresses for security; your browser or operating system may retain local history, cache, or temporary data.</p>
          </details>
        </aside>
      </main>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement} {markedPages.length} pages selected. {includedPages.length} pages included in output.</p>
      {review && <ExportReview pages={review.pages} mode={review.mode} filename={outputName} setFilename={setOutputName} onClose={() => setReview(null)} onConfirm={mergeIncludedPages} />}
      {previewFile ? (
        <PdfPreviewModal
          key={`${previewFile.id}-${preview.pageNumber}`}
          file={
            previewFile
          }

          initialPage={
            preview.pageNumber
          }

          resolveRotation={
            resolvePreviewRotation
          }

          onClose={() =>
            setPreview(null)
          }
        />
      ) : null}
    </>
  )
}

export default App