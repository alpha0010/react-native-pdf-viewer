#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE(RNPdfView, PdfViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(page, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)
RCT_EXPORT_VIEW_PROPERTY(source, NSString)

RCT_EXPORT_VIEW_PROPERTY(onPdfError, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPdfLoadComplete, RCTBubblingEventBlock)

RCT_EXPORT_SHADOW_PROPERTY(page, NSNumber)
RCT_EXPORT_SHADOW_PROPERTY(source, NSString)

@end
