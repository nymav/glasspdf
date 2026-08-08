# Local PDF Studio

A polished, offline-first PDF merger built with React + Vite.

## Features

- Upload multiple PDFs with drag-and-drop or file picker
- Include or exclude files from the merge pipeline
- Preview and curate page thumbnails per PDF
- Select or deselect pages globally and by file
- Drag-and-drop page reordering with move-to-front/back actions
- Remove individual pages or selected page groups
- Merge selected pages only with `pdf-lib`
- Download merged output with custom filename
- Runs completely locally in your browser after install

## Tech Stack

- React
- Vite
- Tailwind CSS
- pdf-lib
- react-pdf / pdf.js
- dnd-kit
- lucide-react
- sonner (toast notifications)

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build for local deployment

```bash
npm run build
npm run preview
```

## Offline & Privacy Note

- All PDF parsing, previewing, reordering, and merging is done in your browser.
- No cloud APIs are used.
- No analytics or remote uploads are included.
- Your files stay on your device.

## Known Limitations

- Encrypted/password-protected PDFs may fail to parse.
- Very large documents can be memory-intensive in browser environments.
- Thumbnail generation for many pages can take time on lower-end devices.
