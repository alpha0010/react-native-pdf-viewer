import NativePdfUtil from './NativePdfUtil';
import { asPath } from './Util';

/**
 * Utility pdf actions.
 */
export const PdfUtil = {
  /**
   * Get the number of pages of a pdf.
   */
  getPageCount(source: string) {
    return NativePdfUtil.getPageCount(asPath(source));
  },

  /**
   * Get the dimensions of every page.
   */
  getPageSizes(source: string) {
    return NativePdfUtil.getPageSizes(asPath(source));
  },
};
