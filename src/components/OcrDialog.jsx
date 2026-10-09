import { useEffect, useRef, useState } from 'react'
import { openModal } from '../lib/modalFocus'
import { createOcrSession } from '../lib/ocr'

export default function OcrDialog({ includedPages, selectedPages, onClose }) {
  const dialog = useRef(null)
  const session = useRef(null)
  const [scope, setScope] = useState(selectedPages.length ? 'selected' : 'included')
  const [state, setState] = useState('idle')
  const [progress, setProgress] = useState({ index: 0, fraction: 0, phase: 'Preparing OCR' })
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const pages = scope === 'selected' ? selectedPages : includedPages
  useEffect(() => {
    const restore = openModal(dialog.current)
    return () => { session.current?.cancel(); session.current = null; restore() }
  }, [])
  const stop = () => { session.current?.cancel(); session.current = null; setState('idle'); setMessage('OCR cancelled. Your PDF pages are unchanged.') }
  const start = async () => {
    if (!pages.length) return
    if (pages.length > 20 && !window.confirm(`Read text from ${pages.length} pages? Large jobs take longer and use more device memory. You can cancel at any time.`)) return
    setResults([]); setError(''); setMessage(''); setState('running'); setProgress({ index: 0, fraction: 0, phase: 'Preparing OCR' })
    const job = createOcrSession(); session.current = job
    try {
      const output = await job.run(pages, update => { if (session.current === job) setProgress(previous => ({ ...previous, ...update })) })
      if (session.current !== job) return
      setResults(output); setState('done'); setMessage('Text ready. Check the result against your original pages.')
    } catch (failure) {
      if (session.current !== job) return
      setState('idle')
      if (failure.name !== 'AbortError') setError('OCR could not finish. Try fewer pages. On first use, check your internet connection so the OCR tools can load.')
    } finally { if (session.current === job) session.current = null }
  }
  const text = results.map(result => `Page ${result.position} (source page ${result.pageNumber})\n${result.text || '[No text detected]'}`).join('\n\n')
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'glasspdf-extracted-text.txt'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <dialog ref={dialog} className="glass-dialog ocr-dialog" aria-labelledby="ocr-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="dialog-heading"><h2 id="ocr-title">Read scanned text</h2><button aria-label="Close OCR" onClick={onClose}>✕</button></div>
    <p>English OCR · Processed on your device. Original PDFs stay unchanged.</p>
    <p className="text-xs">{import.meta.env.MODE === 'desktop' ? 'Recognition tools are included for offline use.' : 'First use loads about 7 MB of recognition tools. With offline support ready, OCR can work offline after its tools have loaded and remain cached.'}</p>
    <label htmlFor="ocr-scope">Pages to read</label>
    <select id="ocr-scope" className="mac-input" value={scope} disabled={state === 'running'} onChange={event => { setScope(event.target.value); setResults([]); setState('idle'); setMessage('') }}>
      <option value="included">Pages in export ({includedPages.length})</option>
      <option value="selected" disabled={!selectedPages.length}>Selected pages ({selectedPages.length})</option>
    </select>
    {state === 'running' && <section className="ocr-progress"><p role="status">{progress.phase} · {Math.min(progress.index + 1, pages.length)} / {pages.length} pages</p><progress aria-label="OCR progress" value={progress.index + progress.fraction} max={pages.length} /><button className="mac-secondary-button" onClick={stop}>Cancel OCR</button></section>}
    {error && <p role="alert" className="text-rose-800">{error}</p>}
    {message && <p role="status">{message}</p>}
    {results.length > 0 && <><label htmlFor="ocr-text">Extracted text</label><textarea id="ocr-text" className="mac-input ocr-text" value={text} readOnly spellCheck={false} /><p className="text-xs">{results.filter(result => !result.text).length} {results.filter(result => !result.text).length === 1 ? 'page' : 'pages'} with no text detected. OCR can misread scans, handwriting, tables and numbers. This creates a text file, not a searchable PDF.</p><div className="dialog-actions"><button className="mac-secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(text); setMessage('Text copied.') } catch { setMessage('Copy unavailable. Select the text above or download it.') } }}>Copy text</button><button className="mac-primary-button" onClick={download}>Download text</button></div></>}
    {state !== 'running' && <div className="dialog-actions"><button className="mac-secondary-button" onClick={onClose}>Close</button><button className="mac-primary-button" disabled={!pages.length} onClick={start}>{results.length ? 'Read again' : `Read ${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`}</button></div>}
    <p className="text-xs">Results stay in memory and are discarded when this panel closes. Only Copy or Download saves text outside this panel.</p>
  </dialog>
}
