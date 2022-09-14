// https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html
export interface PDFPageProxy {
  getViewport(...arg: any[])
  render(...arg: any[])
}

// https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFDocumentProxy.html
export interface PDFDocumentProxy {
  numPages: number
  getPage(pageNumber: number): Promise<PDFPageProxy>
}
