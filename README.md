# GlassPDF — Local PDF Studio

A product of **Teyrin**.

A polished, privacy-first PDF workspace built with React + Vite.

GlassPDF lets you combine, preview, rearrange, rotate, duplicate, include, exclude, and export PDF pages directly in your browser.

The interface is inspired by macOS/iOS-style glass surfaces while keeping PDF processing local and lightweight.

## Features

- Upload multiple PDF files with drag-and-drop or file picker
- Add more PDFs without leaving the current workspace
- Reorder complete source documents
- Automatically move each document's page block when source order changes
- Rearrange individual pages independently
- Preview complete source PDFs
- Quick Look individual pages
- Navigate PDF previews page-by-page
- Zoom PDF previews
- Rotate pages left or right
- Duplicate individual pages
- Delete individual pages
- Automatically remove a source document when all of its pages are deleted
- Include or exclude entire documents
- Include or exclude individual pages
- Select pages for bulk actions without affecting merge inclusion
- Bulk include or exclude selected pages
- Move selected pages to the beginning or end
- Delete selected pages
- Select pages by document
- Apply page ranges such as `1-4, 7, 10-12`
- Undo and redo workspace changes
- Clear the complete workspace
- Generate a merged PDF with the exact visible page order
- Preserve page rotation in the exported PDF
- Preview generated output
- Download with a custom filename
- Lazy-render PDF thumbnails for better performance
- Cache parsed PDF documents instead of reopening the same PDF for every page
- macOS-inspired keyboard shortcuts
- Local-only browser processing

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘O` / `Ctrl+O` | Add PDFs |
| `⌘Z` / `Ctrl+Z` | Undo |
| `⌘⇧Z` / `Ctrl+Shift+Z` | Redo |
| `⌘A` / `Ctrl+A` | Select all pages |
| `Space` | Quick Look when one page is selected |
| `Delete` / `Backspace` | Delete selected pages |
| `⌘E` / `Ctrl+E` | Create final PDF |
| `←` / `→` | Previous / next page in Quick Look |
| `+` / `-` | Zoom in / out in Quick Look |
| `Esc` | Close Quick Look |

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- `pdf-lib`
- `pdfjs-dist`
- `dnd-kit`
- `lucide-react`
- `sonner`

## PDF Architecture

GlassPDF separates PDF editing and PDF rendering.

### PDF preview

`pdfjs-dist` is used to render PDF pages directly to HTML canvas elements.

Each source PDF is cached once and reused across page thumbnails and previews.

This avoids repeatedly parsing the same PDF for every page.

### PDF generation

`pdf-lib` is used to:

- copy selected pages
- preserve final page order
- apply rotations
- duplicate source pages
- generate the final merged PDF

## Performance Design

Source-document reordering and individual-page reordering use different strategies.

### Source document reordering

Source files use lightweight browser drag-and-drop.

The page workspace is updated only after the document is dropped.

Reordering a source file does **not**:

- reparse PDFs
- regenerate object URLs
- recreate page objects
- rerender every PDF document from scratch

Instead, existing page objects are regrouped according to the new source order.

### Page thumbnails

PDF thumbnails:

- render lazily when approaching the viewport
- reuse a cached PDF.js document
- use capped display pixel density to reduce excessive Retina rendering cost
- avoid loading a separate PDF document for every thumbnail

## Privacy

GlassPDF is designed so the documents themselves stay local to the browser.

PDF files are processed using browser APIs, `pdfjs-dist`, and `pdf-lib`.

The application currently contains:

- no PDF upload API
- no backend PDF processing
- no cloud PDF service
- no database
- no analytics integration
- no remote document storage
- no `localStorage` workspace persistence
- no IndexedDB document storage

Uploaded files are held temporarily in browser memory and referenced using local `blob:` URLs.

The generated PDF is also created locally in browser memory.

Your PDF content is not intentionally transmitted to a server by the application.

> If GlassPDF is hosted online, the browser still downloads the application assets such as HTML, JavaScript, CSS, and the PDF.js worker from the hosting environment. The PDF documents themselves are processed locally by the application.

## Workspace features

- Try a public, three-page sample PDF with no sensitive data.
- Review exact page order, output count and filename before export.
- Extract marked pages into a separate PDF without modifying the workspace.
- Progress indicators and cancellable import/export using disposable web workers.
- File-type validation, actionable encrypted/damaged PDF errors and memory guidance.
- Keyboard page reordering (Space, arrows, Space), visible focus and screen-reader announcements.
- Help, shortcuts, export limitations and a public GitHub feedback link.
- Original GlassPDF logo, favicon, installation icons and app manifest.

## Offline use

After one complete online visit, the app reports **Ready for offline use**. The service worker caches only application assets and the public sample PDF, never user documents or output blobs. Browser storage permissions and cache eviction can affect availability. Reloading does not restore your documents: download results before leaving. Supported browsers offer app installation; installation is optional for offline use.

PDF processing libraries load separately from the initial interface. After a short delay, offline setup downloads those libraries in the background so they can also run without a connection.

## Export limitations

Export copies pages into a new document. Digital signatures are not preserved. Interactive forms, bookmarks, links, annotations, accessibility tags and metadata may be changed or lost. Inspect the exported file and retain originals. GlassPDF is not a signing, redaction or compression tool.

## Hosting privacy

PDFs are processed locally in your browser. GlassPDF does not upload or store your documents on a server. Documents and output blobs are temporarily held by the browser. Downloads are saved on the user's device. GitHub Pages logs visitor IP addresses for security; browsers and operating systems may keep local history, cache or temporary data.

## Local development

```bash
npm ci
npm run dev
```

Production and quality checks:

```bash
npm run lint
npm test
npm run build
npm run preview
```

The GitHub Actions workflow builds and deploys `main` to https://nymav.github.io/glasspdf/. It runs lint and PDF processing tests before publishing.

## Sensitive-document safeguards (0.3.0)

- Closing or reloading warns while valid work or an output is undownloaded. Browsers choose their own warning wording and may suppress it in some mobile/background situations. “Download requested” is not proof the user completed the save dialog; check the destination folder.
- Clear workspace revokes document/output blob URLs and drops documents, previews and undo/redo history from the app. It does not delete original/downloaded files or promise secure erasure of OS/browser memory.
- Export reopens the serialized PDF and checks count, positional content streams, dimensions and rotation against the reviewed builder output before enabling download. This is structural verification, not a visual, signature or accessibility certification.
- The UI retains original File objects, not duplicate PDF byte arrays. Export reads only referenced source files in a disposable worker; output bytes transfer back without another worker-message copy.
- At most 120 page cards mount per batch. Only intersecting thumbnails render, and offscreen raster buffers are released. Selection, extraction and export span all batches.
- Public error messages are restricted to known, actionable messages. Arbitrary parser errors and document filenames are not copied into app logs or error toasts. Filenames remain visible inside the local workspace so users can identify their files.
- Original input files are read, never overwritten. Exports are new files.

## Desktop edition

Downloads: https://github.com/nymav/glasspdf/releases

The Electron edition bundles the complete interface, sample, PDF libraries and workers. It requires no hosting connection to start or process PDFs. Its document session is in memory, Node integration is disabled in the renderer, context isolation and sandboxing are enabled, and a custom local protocol serves only bundled assets. Outbound app requests and permissions are blocked. Only the explicit feedback link opens the fixed public GitHub issue URL in the user's browser. There is no auto-update telemetry or saved workspace.

```bash
npm ci
npm run desktop:dev
npm run desktop:package
```

Tags such as `v0.3.0` trigger Mac (Apple Silicon and Intel), Windows x64 and Linux x64 packaging and publish the resulting downloads. Builds are unsigned/not notarized; operating systems may require approval to open them. The Mac Apple Silicon package is tested locally; other-platform build success does not replace testing on those physical devices.
