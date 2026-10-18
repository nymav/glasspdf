import { useEffect, useRef } from 'react'
import { openModal } from '../lib/modalFocus'
export default function PlanLimitDialog({ reason, onClose }) {
 const ref = useRef(null)
 useEffect(() => openModal(ref.current), [])
 return <dialog ref={ref} className="glass-dialog export-review-dialog" aria-labelledby="plan-limit-title" onCancel={event => { event.preventDefault(); onClose() }}>
  <div className="dialog-heading"><h2 id="plan-limit-title">You’re on GlassPDF Free</h2><button onClick={onClose} aria-label="Close plan information">✕</button></div>
  <p>{reason}</p><p>Free includes 5 successful PDF exports per day and files up to 25 MB each. Daily usage resets at midnight on this device.</p>
  <p>Your workspace and existing downloads are still available. Previewing, arranging pages and local OCR remain free.</p>
  <p>Need a higher allowance? Pro access is not available for purchase in the app yet. Contact Teyrin to discuss your requirements.</p>
  <div className="flex flex-wrap gap-3 mt-5"><a className="mac-primary-button" href="mailto:ny@teyrinlabs.com?subject=GlassPDF%20Pro%20enquiry">Request Pro</a><button className="mac-secondary-button" onClick={onClose}>Keep working on Free</button></div>
 </dialog>
}
