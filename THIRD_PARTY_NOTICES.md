# OCR dependencies

- Tesseract.js 7.0.0 — Apache-2.0. Source: https://github.com/naptha/tesseract.js
- Tesseract.js-core 7.0.0 — Apache-2.0. Source: https://github.com/naptha/tesseract.js-core
- @tesseract.js-data/eng 1.0.0 — package metadata declares MIT. Source: https://github.com/naptha/tessdata. Includes the English recognition data distributed by that package.

The complete Apache-2.0 licences are included in web and desktop bundles under `ocr/LICENSE-TESSERACT.txt` and `ocr/LICENSE-TESSERACT-CORE.txt`. All dependency source files are used unmodified; application-specific integration is in `src/lib/ocr.js` and `src/lib/ocr.worker.js`.

## MIT licence for the English data package

Copyright (c) Balearica and contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
