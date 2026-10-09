import { useEffect, useState } from 'react'
export default function WorkspaceGuide({ onSample, busy }) {
  const [offlineReady, setOfflineReady] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState(null)
  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    const ready = () => setOfflineReady(true)
    const install = event => { event.preventDefault(); setInstallPrompt(event) }
    const check = () => navigator.serviceWorker?.controller?.postMessage({ type: 'STATUS' })
    const message = event => { if (event.data?.type === 'OFFLINE_READY') ready() }
    window.addEventListener('online', updateOnline); window.addEventListener('offline', updateOnline)
    window.addEventListener('beforeinstallprompt', install)
    navigator.serviceWorker?.addEventListener('message', message)
    navigator.serviceWorker?.addEventListener('controllerchange', check)
    check()
    return () => {
      window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline)
      window.removeEventListener('beforeinstallprompt', install)
      navigator.serviceWorker?.removeEventListener('message', message)
      navigator.serviceWorker?.removeEventListener('controllerchange', check)
    }
  }, [])
  const desktop = import.meta.env.MODE === 'desktop'
  return <section className="workspace-guide" aria-label="Workspace help">
    <div className="guide-actions">
      <button className="mac-secondary-button" onClick={onSample} disabled={busy}>Try a sample PDF</button>
      <span role="status">{desktop ? 'Desktop edition · offline by default' : offlineReady ? (online ? 'Ready for offline use' : 'Offline · ready to work') : 'Offline setup requires one complete online visit'}</span>
      {installPrompt && <button className="mac-secondary-button" onClick={async () => { await installPrompt.prompt(); setInstallPrompt(null) }}>Install app</button>}
    </div>
    <details><summary>Help & shortcuts</summary>
      <ul><li>Add PDFs, then drag anywhere on a page preview, or focus the preview and press Space, arrow keys, then Space to place. Escape cancels a move. On touch screens, hold a preview briefly to move it; swipe normally to scroll.</li>
      <li>Select page buttons to mark pages. “Final” controls inclusion in the full export. “Extract selected” saves marked pages separately without changing the workspace.</li>
      <li>Range accepts 1–4, 7, 10–12 (use a hyphen). Choose Select to extract that range, or Include/Exclude to change the full export.</li>
      <li>Ctrl/⌘ O: add files · Ctrl/⌘ Z: undo · Ctrl/⌘ Shift Z: redo · Ctrl/⌘ A: select pages · Ctrl/⌘ E: review export · Space: preview one selected page · Delete: remove selected pages.</li>
      <li>Clear workspace releases documents, previews and undo history from the app, without promising secure erasure of device memory. Reloading closes your unsaved workspace; download your result first. Your original files are never overwritten.</li>
      <li>Install through the browser’s app menu, or use Share → Add to Home Screen on supported devices. Offline readiness appears after the app and PDF tools finish caching.</li></ul>
    </details>
    <details><summary>File guidance & limitations</summary>
      <p>PDFs only. Unlock password-protected files first. Files over 25 MB or workspaces over 100 MB trigger a warning because previews and editing use extra memory; these are guidance thresholds, not guaranteed device limits. Large workspaces show 120 pages per batch and render only visible thumbnails. Selection and export work across all batches. Use fewer pages or smaller files if processing is slow. Cancel stops processing without uploading anything.</p>
      <p>Exports copy pages into a new document. Digital signatures are not preserved. Forms, bookmarks, links, annotations, accessibility tags, and metadata may be changed or lost. This is not a PDF signing, redaction, or compression tool. Visually inspect the exported PDF and retain your originals.</p>
    </details>
    {!desktop && <p><a href="https://github.com/nymav/glasspdf/releases" target="_blank" rel="noopener noreferrer">Download desktop edition ↗</a></p>}
    <a href="https://github.com/nymav/glasspdf/issues/new" target="_blank" rel="noopener noreferrer">Report a problem ↗</a>
    <p className="text-xs">Report a bug with the steps and browser you used. GitHub issues are public—use a dummy PDF if an example is needed.</p>
  </section>
}
