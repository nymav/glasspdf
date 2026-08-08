import {

  PDFDocument,

  degrees,

} from 'pdf-lib'

const normalizeRotation = (

  value,

) =>

  (

    (value % 360) +

    360

  ) %

  360

export const parsePdfFile =

  async (file) => {

    const arrayBuffer =

      await file.arrayBuffer()

    const bytes =

      new Uint8Array(

        arrayBuffer,

      )

    let document

    try {

      document =

        await PDFDocument.load(

          bytes,

        )

    } catch {

      throw new Error(

        'This PDF could not be read. It may be encrypted, password-protected, or corrupted.',

      )

    }

    return {

      bytes,

      pageCount:

        document.getPageCount(),

    }

  }

export const mergePdfPages =

  async ({

    selectedPages,

    files,

  }) => {

    const output =

      await PDFDocument.create()

    const sourceCache =

      new Map()

    const fileMap =

      new Map(

        files.map(

          (file) => [

            file.id,

            file,

          ],

        ),

      )

    for (

      const page of selectedPages

    ) {

      const sourceFile =

        fileMap.get(

          page.fileId,

        )

      if (

        !sourceFile ||

        !sourceFile.bytes

      ) {

        continue

      }

      if (

        !sourceCache.has(

          sourceFile.id,

        )

      ) {

        sourceCache.set(

          sourceFile.id,

          await PDFDocument.load(

            sourceFile.bytes,

          ),

        )

      }

      const sourceDocument =

        sourceCache.get(

          sourceFile.id,

        )

      const [

        copiedPage,

      ] =

        await output.copyPages(

          sourceDocument,

          [

            page.originalPageIndex,

          ],

        )

      const sourceRotation =

        copiedPage

          .getRotation()

          ?.angle || 0

      copiedPage.setRotation(

        degrees(

          normalizeRotation(

            sourceRotation +

              (page.rotation ||

                0),

          ),

        ),

      )

      output.addPage(

        copiedPage,

      )

    }

    output.setCreator(

      'Local PDF Studio',

    )

    output.setProducer(

      'Local PDF Studio',

    )

    return output.save()

  }