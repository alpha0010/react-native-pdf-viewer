#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE(RNPdfView, PdfViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(page, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(source, NSString)

@end
