import Vue, { VueConstructor } from 'vue';

export interface PdfSignerProps {
  /** URL to a PDF file */
  pdfUrl?: string;
  /** URL to an image file */
  imageUrl?: string;
  /** Generic source URL (can be PDF or image) */
  src?: string;
}

export interface PdfSignerEvents {
  /** Emitted when the PDF/image is loaded and ready */
  ready: void;
}

/** PDF Signer Vue component for signing and annotating PDFs and images */
declare const PdfSigner: VueConstructor<Vue & {
  /** URL to a PDF file */
  pdfUrl?: string;
  /** URL to an image file */
  imageUrl?: string;
  /** Generic source URL (can be PDF or image) */
  src?: string;
}>;

export { PdfSigner };
export default PdfSigner;

