#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(RNPdfUtil, PdfUtilModule, NSObject)

RCT_EXTERN_METHOD(getPageCount:(NSString *)source
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getPageSizes:(NSString *)source
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

@end
