# GlassPDF release checks — 9 October 2026

All 12 requested additions are implemented: sample PDF; file guidance and actionable errors; on-demand PDF libraries; help; selected-page/range extraction; export review; progress/cancel; offline app; keyboard/focus/screen-reader improvements; feedback; export limitations; original logo replacing starter assets.

## Verification

- ESLint: no errors or warnings. Node PDF tests: 3 passed. Production build passed.
- Chromium 155, Firefox 153 and WebKit 26.5: PDF import, page rotation, keyboard reordering, review focus cycling, export/download and four viewport widths (320, 390, 768, 1440).
- Automated axe WCAG A/AA checks: no detected violations in the populated workspace and review dialog. This is automated testing, not an accessibility certification or a substitute for user testing.
- Chromium and Firefox: cached app reload, sample import and PDF export with network emulation disabled. WebKit: the same flow with an isolated app server shut down; Playwright's WebKit network emulation itself produced an internal error, so real server unavailability was used instead.
- Cancellation: import and export workers terminated; prior workspace retained; cancelled output unavailable.
- Unsupported extension, renamed non-PDF, corrupted PDF and large-file warning paths checked. Export tests verify requested source order, rotation, count and missing-source failure.
- Extraction review, sanitized output filename, native dialog Escape/focus return and page-range selection checked.
- No document upload or telemetry requests observed during import/edit/export. Cache contained 13 public app/sample assets, no user documents. localStorage/sessionStorage were empty; no IndexedDB databases.
- Initial interface JavaScript: approximately 100 KB gzip (previously 394 KB). PDF.js, its worker and the processing worker load separately. Offline setup fetches those assets after initial loading. This is bundle-size evidence, not a field performance score.

## User-facing limits

Offline support needs one complete online visit and browser cache availability. PDF workspace state is not saved. Users must download their results before reloading. Signatures are not preserved; forms/bookmarks/annotations/tags/metadata may change or be lost. GitHub hosting logs and browser/OS temporary data remain outside the app's document-processing guarantee.

## 0.3.0 sensitive-document update

Six Node tests pass, including wrong-order rejection for pages with equal dimensions, damaged/count mismatch rejection, File-based export and original-byte preservation, and parser-error redaction. ESLint and production/desktop builds pass.

Chrome/Firefox/WebKit checks pass for export, rotation, focus cycling and 320/390/768/1440 layouts. Chrome/Firefox offline reload/export pass; WebKit offline reload/export passes with the test server unavailable. Automated axe review checks have no detected violations.

A 350-page test confirms 120 mounted cards, eight active raster thumbnails in a 1440px viewport, zero-width freed offscreen rasters, next-batch navigation and extraction of pages 1 and 350. Close/reload dismissal preserves work; clearing removes cards/history; generated files show a verified state. No filename echoed into app error toasts/logs and no non-GET document-processing requests observed.

The packaged Mac ARM64 desktop edition starts from its bundled protocol, imports/verifies/exports a three-page sample and previews output. Renderer Node access is absent; localStorage is empty. An intentional external-fetch probe is blocked by CSP/request filtering, with no HTTP requests and no application errors. Desktop session storage is in memory; OS temporary memory is not a secure-erasure guarantee. Desktop packages are unsigned/not notarized. Windows/Linux/Intel-Mac runtime behavior requires testing on those devices.

## 0.3.1 whole-page dragging

The full preview surface is the accessible drag target; the small handle is removed. The drag overlay captures the visible raster and preserves the preview's width and height instead of collapsing to a text tile. Action buttons remain separate from the drag target, and the temporary drag snapshot is released on drop/cancel.

Chrome, Firefox and WebKit tests pass for dragging from the preview center, preserved overlay dimensions, page order, independent selection/rotation buttons and keyboard movement. Touch tests pass for hold-and-drag reordering and ordinary swipe scrolling without starting a drag. No page errors observed.
