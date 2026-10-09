// Native modal semantics plus explicit keyboard cycling for consistent Mac/WebKit behavior.
export function openModal(dialog) {
  const invoker = document.activeElement
  const handleKey = event => {
    if (event.key !== 'Tab') return
    const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(node => node.getClientRects().length > 0)
    if (!controls.length) return
    const index = controls.indexOf(document.activeElement)
    const next = event.shiftKey ? (index <= 0 ? controls.length - 1 : index - 1) : (index + 1) % controls.length
    event.preventDefault(); controls[next].focus()
  }
  dialog.addEventListener('keydown', handleKey)
  dialog.showModal()
  return () => {
    dialog.removeEventListener('keydown', handleKey)
    dialog.close()
    if (invoker?.isConnected) invoker.focus()
  }
}
