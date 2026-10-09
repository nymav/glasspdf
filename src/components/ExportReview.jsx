import { useEffect, useRef } from 'react'
import { openModal } from '../lib/modalFocus'
import { ensurePdfExtension } from '../lib/fileUtils'
export default function ExportReview({ pages, filename, setFilename, onClose, onConfirm, mode }) {
  const ref = useRef(null)
  useEffect(() => {
    return openModal(ref.current)
  }, [])
  return <dialog ref={ref} className="glass-dialog" aria-labelledby="export-review-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="dialog-heading"><h2 id="export-review-title">Review {mode === 'selected' ? 'extraction' : 'export'}</h2><button onClick={onClose} aria-label="Close export review">✕</button></div>
    <p>{pages.length} {pages.length === 1 ? 'page' : 'pages'} · Listed in the exact output order</p>
    <label htmlFor="review-filename">Filename</label>
    <input autoFocus id="review-filename" className="mac-input" value={filename} onChange={e => setFilename(e.target.value)} />
    <p className="text-xs">Saved as: {ensurePdfExtension(filename)}</p>
    <ol className="review-sequence">{pages.map((page, index) => <li key={page.id}><strong>{index + 1}.</strong> <span>{page.fileName} — page {page.pageNumber}{page.rotation ? ` · rotated ${page.rotation}°` : ''}</span></li>)}</ol>
    <p className="limitations-note">Page copying may remove digital signatures, interactive forms, bookmarks, links, annotations, accessibility tags, and document metadata. Check the result before sharing; keep your originals.</p>
    <div className="dialog-actions"><button className="mac-secondary-button" onClick={onClose}>Back to editing</button><button className="mac-primary-button" onClick={onConfirm}>Create PDF</button></div>
  </dialog>
}
