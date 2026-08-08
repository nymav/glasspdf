export const formatFileSize = (
  bytes,
) => {
  if (
    !bytes &&
    bytes !== 0
  ) {
    return '--'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kb =
    bytes / 1024

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(
    kb / 1024
  ).toFixed(2)} MB`
}

export const makeId = () => {
  if (
    typeof crypto !==
      'undefined' &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`
}

export const toObjectUrl = (
  bytes,
  mimeType,
) => {
  const blob =
    new Blob(
      [bytes],
      {
        type: mimeType,
      },
    )

  return URL.createObjectURL(
    blob,
  )
}

export const ensurePdfExtension = (
  value,
) => {
  let filename =
    value
      ?.trim()
      .replace(
        /[\\/:*?"<>|]+/g,
        '-',
      ) ||
    'merged-document.pdf'

  if (
    !filename
      .toLowerCase()
      .endsWith('.pdf')
  ) {
    filename += '.pdf'
  }

  return filename
}

export const parsePageRange = (
  expression,
  pageCount,
) => {
  const input =
    expression?.trim()

  if (!input) {
    return {
      pageNumbers:
        new Set(),

      error:
        'Enter a page range such as 1-4, 7, 10-12.',
    }
  }

  const result =
    new Set()

  const parts =
    input
      .split(',')
      .map(
        (part) =>
          part.trim(),
      )
      .filter(Boolean)

  for (const part of parts) {
    if (
      /^\d+$/.test(part)
    ) {
      const page =
        Number(part)

      if (
        page < 1 ||
        page > pageCount
      ) {
        return {
          pageNumbers:
            new Set(),

          error: `Page ${page} is outside pages 1-${pageCount}.`,
        }
      }

      result.add(page)

      continue
    }

    const match =
      part.match(
        /^(\d+)\s*-\s*(\d+)$/,
      )

    if (!match) {
      return {
        pageNumbers:
          new Set(),

        error: `Could not understand "${part}". Use 1-4, 7, 10-12.`,
      }
    }

    const start =
      Number(match[1])

    const end =
      Number(match[2])

    if (start > end) {
      return {
        pageNumbers:
          new Set(),

        error: `Invalid range "${part}".`,
      }
    }

    if (
      start < 1 ||
      end > pageCount
    ) {
      return {
        pageNumbers:
          new Set(),

        error: `Range "${part}" must stay between pages 1 and ${pageCount}.`,
      }
    }

    for (
      let page = start;
      page <= end;
      page += 1
    ) {
      result.add(page)
    }
  }

  return {
    pageNumbers:
      result,

    error: null,
  }
}