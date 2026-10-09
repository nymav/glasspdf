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
