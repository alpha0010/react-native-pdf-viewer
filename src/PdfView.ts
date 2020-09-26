import { requireNativeComponent, ViewStyle } from 'react-native';

type PdfViewProps = {
  /**
   * Page (0-indexed) of document to display.
   */
  page: number;
  /**
   * Document to display.
   */
  source: string;
  style?: ViewStyle;
};

/**
 * Single page of a pdf.
 */
export const PdfView = requireNativeComponent<PdfViewProps>('RNPdfView');
