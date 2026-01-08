#import "PdfView.h"
#import "react_native_pdf_light-Swift.h"

#import <react/renderer/components/PdfViewSpec/ComponentDescriptors.h>
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
            if (strongSelf) {
                static_cast<const PdfViewEventEmitter &>(*strongSelf->_eventEmitter)
                    .onPdfError({[message UTF8String]});
            }
        };
        _view.onPdfLoadComplete = ^(CGFloat width, CGFloat height) {
            PdfView *strongSelf = weakSelf;
            if (strongSelf) {
                PdfViewEventEmitter::OnPdfLoadComplete evt;
                evt.width = width;
                evt.height = height;
                static_cast<const PdfViewEventEmitter &>(*strongSelf->_eventEmitter)
                    .onPdfLoadComplete(evt);
            }
        };
        _view.onPdfMeasure = ^(CGFloat width, CGFloat height) {
            PdfView *strongSelf = weakSelf;
            if (strongSelf && strongSelf->_state) {
                strongSelf->_state->updateState({static_cast<int>(width), static_cast<int>(height)});
            }
        };

        self.contentView = _view;
    }

    return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<PdfViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<PdfViewProps const>(props);

    bool needsMeasure = false;
    if (oldViewProps.annotation != newViewProps.annotation) {
        _view.annotation = [NSString stringWithUTF8String:newViewProps.annotation.c_str()];
    }
    if (oldViewProps.annotationStr != newViewProps.annotationStr) {
        _view.annotationStr = [NSString stringWithUTF8String:newViewProps.annotationStr.c_str()];
    }
    if (oldViewProps.page != newViewProps.page) {
        _view.page = newViewProps.page;
        needsMeasure = true;
    }
    if (oldViewProps.resizeMode != newViewProps.resizeMode) {
        switch (newViewProps.resizeMode) {
            case PdfViewResizeMode::Contain:
                _view.resizeMode = ResizeModeCONTAIN;
                break;
            case facebook::react::PdfViewResizeMode::FitWidth:
                _view.resizeMode = ResizeModeFIT_WIDTH;
                break;
        }
    }
    if (oldViewProps.source != newViewProps.source) {
        _view.source = [NSString stringWithUTF8String:newViewProps.source.c_str()];
        needsMeasure = true;
    }

    if (needsMeasure && _state) {
        [_view measurePdf];
    }

    [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(const facebook::react::State::Shared &)state oldState:(const facebook::react::State::Shared &)oldState
{
    _state = std::static_pointer_cast<const PdfViewShadowNode::ConcreteState>(state);
    [_view measurePdf];
    [super updateState:state oldState:oldState];
}

Class<RCTComponentViewProtocol> PdfViewCls(void)
{
    return PdfView.class;
}

@end
