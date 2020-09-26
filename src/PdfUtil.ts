import { NativeModules } from 'react-native';

export type PageDim = { height: number; width: number };

type PdfUtilType = {
  /**
   * Get the number of pages of a pdf.
   */
  getPageCount(source: string): Promise<number>;

  /**
   * Get the dimensions of every page.
   */
  getPageSizes(source: string): Promise<PageDim[]>;

  /**
   * Extract a bundled asset and return its absolute path.
   */
  unpackAsset(source: string): Promise<string>;
};

/**
 * Utility pdf actions.
 */
export const PdfUtil: PdfUtilType = NativeModules.RNPdfUtil;
