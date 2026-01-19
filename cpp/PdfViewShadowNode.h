#pragma once

#include <react/renderer/components/PdfViewSpec/EventEmitters.h>
#include <react/renderer/components/PdfViewSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <jsi/jsi.h>

#include "PdfViewState.h"

namespace facebook::react {

JSI_EXPORT extern const char PdfViewComponentName[];

/*
 * `ShadowNode` for <PdfView> component.
 */
class PdfViewShadowNode final
  : public ConcreteViewShadowNode<
    PdfViewComponentName,
    PdfViewProps,
    PdfViewEventEmitter,
    PdfViewState> {
public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits();

  Size measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const override;
};

} // namespace facebook::react
