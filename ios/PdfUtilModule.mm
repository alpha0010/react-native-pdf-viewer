#import "PdfUtilModule.h"

#if __has_include(<react_native_pdf_light/react_native_pdf_light-Swift.h>)
#import <react_native_pdf_light/react_native_pdf_light-Swift.h>
#else
#import "react_native_pdf_light-Swift.h"
#endif

@implementation PdfUtilModule {
    PdfUtilModuleImpl *impl;
}

- (id) init {
    if (self = [super init]) {
        impl = [PdfUtilModuleImpl new];
    }
    return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativePdfUtilSpecJSI>(params);
}

- (void)getPageCount:(nonnull NSString *)source resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    [impl getPageCountWithSource:source resolve:resolve reject:reject];
}

- (void)getPageSizes:(nonnull NSString *)source resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    [impl getPageSizesWithSource:source resolve:resolve reject:reject];
}

+ (NSString *)moduleName {
    return @"NativePdfUtil";
}

@end
