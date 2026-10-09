import { useEffect, useRef } from 'react'
import { openModal } from '../lib/modalFocus'
import { ensurePdfExtension } from '../lib/fileUtils'
import PdfCanvas from './PdfCanvas'

export default function ExportReview({ pages, filename, setFilename, onClose, onConfirm, onEditPage, mode }) {
  const ref = useRef(null)
  useEffect(() => openModal(ref.current), [])
  return <dialog ref={ref} className="glass-dialog export-review-dialog" aria-labelledby="export-review-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="dialog-heading"><h2 id="export-review-title">Review {mode === 'selected' ? 'extraction' : 'export'}</h2><button onClick={onClose} aria-label="Close export review">✕</button></div>
    <p>{pages.length} {pages.length === 1 ? 'page' : 'pages'} · Final output order</p>
    <label htmlFor="review-filename">Filename</label>
    <input autoFocus id="review-filename" className="mac-input" value={filename} onChange={e => setFilename(e.target.value)} />
    <p className="text-xs">Saved as: {ensurePdfExtension(filename)}</p>
    <ol className="review-sequence">{pages.map((page, index) => <li key={page.id}>
      <button className="review-page" onClick={() => onEditPage(page)} aria-label={`Edit output page ${index + 1}: ${page.fileName}, page ${page.pageNumber}`}>
        <PdfCanvas fileId={page.fileId} fileUrl={page.fileUrl} pageNumber={page.pageNumber} rotation={page.rotation} width={120} lazy className="review-thumbnail" />
        <strong>Output {index + 1}</strong><span title={page.fileName}>{page.fileName}</span><span>Source page {page.pageNumber}{page.rotation ? ` · ${page.rotation}°` : ''}</span><span className="review-edit">Back to this page ↗</span>
      </button>
    </li>)}</ol>
    <details className="export-limitations"><summary>What to check before sharing</summary><p className="limitations-note">Exports copy pages into a new PDF. Signatures are not preserved; forms, bookmarks, links, annotations, accessibility tags and metadata may change or be lost. Keep your originals and preview the result.</p></details>
    <div className="dialog-actions"><button className="mac-secondary-button" onClick={onClose}>Back to editing</button><button className="mac-primary-button" onClick={onConfirm}>Create PDF</button></div>
  </dialog>
}
