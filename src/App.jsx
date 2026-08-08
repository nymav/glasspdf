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
import StatusBar from './components/StatusBar'

import {
  ensurePdfExtension,
  makeId,
  parsePageRange,
  toObjectUrl,
} from './lib/fileUtils'

import {
  mergePdfPages,
  parsePdfFile,
} from './lib/pdfUtils'

import {
  clearPdfPreviewCache,
  removePdfFromPreviewCache,
} from './lib/pdfPreviewUtils'

const HISTORY_LIMIT = 25

function App() {
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
    return () => {
      clearPdfPreviewCache()

      sourceUrlRegistry.current.forEach(
        (url) => {
          URL.revokeObjectURL(url)
        },
      )

      sourceUrlRegistry.current.clear()

      if (outputUrlRef.current) {
        URL.revokeObjectURL(
          outputUrlRef.current,
        )
      }
    }
  }, [])

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

  const addFiles = async (
    inputFiles,
  ) => {
    const pdfFiles =
      Array.from(inputFiles).filter(
        (file) =>
          file.type ===
            'application/pdf' ||
          file.name
            .toLowerCase()
            .endsWith('.pdf'),
      )

    if (pdfFiles.length === 0) {
      toast.error(
        'Only PDF files are supported.',
      )
      return
    }

    setLoading(true)

    const newFiles = []
    const newPages = []

    try {
      for (const file of pdfFiles) {
        const id = makeId()

        try {
          const {
            bytes,
            pageCount,
          } =
            await parsePdfFile(file)

          /*
           * PDF.js gets the original browser File.
           * pdf-lib keeps its Uint8Array separately.
           */
          const fileUrl =
            URL.createObjectURL(file)

          sourceUrlRegistry.current.add(
            fileUrl,
          )

          newFiles.push({
            id,

            name: file.name,
            size: file.size,

            pageCount,

            included: true,

            bytes,
            fileUrl,

            error: null,
          })

          for (
            let index = 0;
            index < pageCount;
            index += 1
          ) {
            newPages.push({
              id: makeId(),

              fileId: id,
              fileName: file.name,

              originalPageIndex:
                index,

              pageNumber:
                index + 1,

              included: true,
              marked: false,

              rotation: 0,

              fileUrl,
            })
          }
        } catch (error) {
          newFiles.push({
            id,

            name: file.name,
            size: file.size,

            pageCount: 0,
            included: false,

            bytes: null,
            fileUrl: '',

            error:
              error?.message ||
              'Unable to read this PDF.',
          })

          toast.error(
            `${file.name}: ${
              error?.message ||
              'Unable to read this PDF.'
            }`,
          )
        }
      }

      commitWorkspace(
        [
          ...files,
          ...newFiles,
        ],
        [
          ...pages,
          ...newPages,
        ],
      )

      const successful =
        newFiles.filter(
          (file) => !file.error,
        ).length

      if (successful > 0) {
        toast.success(
          `${successful} PDF${
            successful === 1
              ? ''
              : 's'
          } added`,
        )
      }
    } finally {
      setLoading(false)
    }
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
        'Remove every PDF from this workspace?',
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
  }

  // =====================================================
  // MERGE
  // =====================================================

  const mergeIncludedPages =
    async () => {
      if (
        includedPages.length === 0
      ) {
        toast.error(
          'Include at least one page.',
        )
        return
      }

      const version =
        workspaceVersionRef.current

      try {
        invalidateOutput()

        setMergeState(
          'merging',
        )

        const mergedBytes =
          await mergePdfPages({
            selectedPages:
              includedPages,

            files:
              files.filter(
                (file) =>
                  file.included &&
                  !file.error,
              ),
          })

        if (
          workspaceVersionRef.current !==
          version
        ) {
          setMergeState(
            'idle',
          )

          toast.message(
            'Workspace changed. Create the PDF again.',
          )

          return
        }

        const mergedUrl =
          toObjectUrl(
            mergedBytes,
            'application/pdf',
          )

        outputUrlRef.current =
          mergedUrl

        setOutputUrl(
          mergedUrl,
        )

        setMergeState(
          'done',
        )

        toast.success(
          'PDF ready',
        )
      } catch (error) {
        console.error(error)

        setMergeState(
          'idle',
        )

        toast.error(
          'Unable to create PDF.',
        )
      }
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
    }

  const previewMergedPdf =
    () => {
      if (!outputUrl) {
        return
      }

      window.open(
        outputUrl,
        '_blank',
        'noopener,noreferrer',
      )
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
      ? filesById[
          preview.fileId
        ]
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
        mergeIncludedPages()
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
                      mergeIncludedPages
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

      </main>

      {previewFile ? (
        <PdfPreviewModal
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