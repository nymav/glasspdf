import {
  LockKeyhole,
} from 'lucide-react'

function StatusBar({
  fileCount,
  totalPages,
  includedPages,
  selectedPages,
}) {
  return (
    <footer className="mac-statusbar">

      <div className="flex items-center gap-4">

        <span>
          {fileCount} document
          {fileCount === 1
            ? ''
            : 's'}
        </span>

        <span>
          {totalPages} pages
        </span>

        <span>
          {includedPages} included
        </span>

        {selectedPages > 0 ? (
          <span className="font-medium text-[#007aff]">
            {selectedPages} selected
          </span>
        ) : null}

      </div>

      <span className="inline-flex items-center gap-1.5">

        <LockKeyhole className="h-3 w-3" />

        Local processing

      </span>

    </footer>
  )
}

export default StatusBar