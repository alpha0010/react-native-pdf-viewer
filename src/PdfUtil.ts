import { NativeModules } from 'react-native';
import { asPath } from './Util';

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
};

const PdfUtilNative: PdfUtilType = NativeModules.RNPdfUtil;

/**
 * Utility pdf actions.
 */
export const PdfUtil: PdfUtilType = {
  getPageCount(source: string) {
    return PdfUtilNative.getPageCount(asPath(source));
  },
  getPageSizes(source: string) {
    return PdfUtilNative.getPageSizes(asPath(source));
  },
};
