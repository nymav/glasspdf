import {
  FilePlus2,
  LoaderCircle,
  Upload,
} from 'lucide-react'

function UploadDropzone({
  compact,
  loading,

  isDragging,

  onChoose,

  onDrop,
  onDragOver,
  onDragLeave,
}) {
  if (compact) {
    return (
      <section
        onDrop={onDrop}

        onDragOver={
          onDragOver
        }

        onDragLeave={
          onDragLeave
        }

        className={`compact-dropzone ${
          isDragging
            ? 'compact-dropzone-active'
            : ''
        }`}
      >

        <div className="flex items-center gap-2.5">

          <div className="compact-drop-icon">
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </div>

          <div>

            <p className="text-[12px] font-medium text-slate-700">
              {loading
                ? 'Reading PDFs…'
                : 'Drop PDFs here'}
            </p>

            <p className="text-[10px] text-slate-500">
              Add more documents without leaving the workspace
            </p>

          </div>

        </div>

        <button
          type="button"

          onClick={
            onChoose
          }

          disabled={
            loading
          }

          className="mac-secondary-button"
        >
          <FilePlus2 className="h-3.5 w-3.5" />
          Add PDFs
        </button>

      </section>
    )
  }

  return (
    <section
      onDrop={onDrop}

      onDragOver={
        onDragOver
      }

      onDragLeave={
        onDragLeave
      }

      className={`large-dropzone ${
        isDragging
          ? 'large-dropzone-active'
          : ''
      }`}
    >

      <div className="drop-icon">
        {loading ? (
          <LoaderCircle className="h-6 w-6 animate-spin" />
        ) : (
          <Upload className="h-6 w-6" />
        )}
      </div>

      <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
        Drop PDFs here
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        Merge, rearrange and curate documents privately on this device.
      </p>

      <button
        type="button"

        onClick={
          onChoose
        }

        className="mac-primary-button mt-5"
      >
        <FilePlus2 className="h-4 w-4" />
        Choose PDFs
      </button>

    </section>
  )
}

export default UploadDropzone