# GlassPDF — Local PDF Studio

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

## Local Development

Install dependencies:

```bash
npm install