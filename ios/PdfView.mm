#import "PdfView.h"

#if __has_include(<react_native_pdf_light/react_native_pdf_light-Swift.h>)
#import <react_native_pdf_light/react_native_pdf_light-Swift.h>
#import <react_native_pdf_light/react/renderer/components/PdfViewSpec/ComponentDescriptors.h>
#else
#import "react_native_pdf_light-Swift.h"
#import <react/renderer/components/PdfViewSpec/ComponentDescriptors.h>
#endif

#import <react/renderer/components/PdfViewSpec/EventEmitters.h>
#import <react/renderer/components/PdfViewSpec/Props.h>
#import <react/renderer/components/PdfViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface PdfView () <RCTPdfViewViewProtocol>

@end

@implementation PdfView {
    PdfViewImpl *_view;
    PdfViewShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<PdfViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const PdfViewProps>();
        _props = defaultProps;

        _view = [[PdfViewImpl alloc] init];

        __weak PdfView *weakSelf = self;
        _view.onPdfError = ^(NSString *message) {
            PdfView *strongSelf = weakSelf;
            if (strongSelf && strongSelf->_eventEmitter) {
                static_cast<const PdfViewEventEmitter &>(*strongSelf->_eventEmitter)
                    .onPdfError({[message UTF8String]});
            }
        };
        _view.onPdfLoadComplete = ^(NSInteger width, NSInteger height) {
            PdfView *strongSelf = weakSelf;
            if (strongSelf && strongSelf->_eventEmitter) {
                PdfViewEventEmitter::OnPdfLoadComplete evt;
                evt.width = static_cast<int>(width);
                evt.height = static_cast<int>(height);
                static_cast<const PdfViewEventEmitter &>(*strongSelf->_eventEmitter)
                    .onPdfLoadComplete(evt);
            }
        };
        _view.onPdfMeasure = ^(NSInteger width, NSInteger height) {
            PdfView *strongSelf = weakSelf;
            if (strongSelf && strongSelf->_state && (
                strongSelf->_state->getData().getPageWidth() != width
                || strongSelf->_state->getData().getPageHeight() != height)) {
                strongSelf->_state->updateState({static_cast<int>(width), static_cast<int>(height)});
            }
        };

        self.contentView = _view;
    }

    return self;
}

- (void)prepareForRecycle
{
    [super prepareForRecycle];
    [_view prepareForRecycle];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &newViewProps = *std::static_pointer_cast<PdfViewProps const>(props);

    [_view updatePropsWithAnnot:[NSString stringWithUTF8String:newViewProps.annotation.c_str()]
                       annotStr:[NSString stringWithUTF8String:newViewProps.annotationStr.c_str()]
                             pg:newViewProps.page
                           rsMd:newViewProps.resizeMode == facebook::react::PdfViewResizeMode::FitWidth ? ResizeModeFIT_WIDTH : ResizeModeCONTAIN
                            src:[NSString stringWithUTF8String:newViewProps.source.c_str()]];

    [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(const facebook::react::State::Shared &)state oldState:(const facebook::react::State::Shared &)oldState
{
    _state = std::static_pointer_cast<const PdfViewShadowNode::ConcreteState>(state);
    [_view measurePdf];
    [super updateState:state oldState:oldState];
}

- (void)handleCommand:(nonnull const NSString *)commandName args:(nonnull const NSArray *)args {
    RCTPdfViewHandleCommand(self, commandName, args);
}

- (void)imperativeApplyAnnotation:(NSString *)annotation
{
    [_view updatePropsWithAnnotStr:annotation];
}

Class<RCTComponentViewProtocol> PdfViewCls(void)
{
    return PdfView.class;
}

@end
