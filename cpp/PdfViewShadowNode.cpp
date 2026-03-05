#include "PdfViewShadowNode.h"

#include <react/renderer/core/LayoutConstraints.h>

namespace facebook::react {

extern const char PdfViewComponentName[] = "PdfView";

ShadowNodeTraits PdfViewShadowNode::BaseTraits()
{
  auto traits = ConcreteViewShadowNode::BaseTraits();
  traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
  traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
  return traits;
}

Size PdfViewShadowNode::measureContent(
  const LayoutContext& layoutContext,
  const LayoutConstraints& layoutConstraints) const {
  Float pageWidth = getStateData().getPageWidth();
  Float pageHeight = getStateData().getPageHeight();
  Float aspectRatio = pageWidth / pageHeight;
  if (std::isfinite(layoutConstraints.maximumSize.width)) {
    // Scale page to match requested width.
    pageWidth = layoutConstraints.maximumSize.width;
    pageHeight = pageWidth / aspectRatio;
  }
  if (std::isfinite(layoutConstraints.maximumSize.height)) {
    // Scale page to match requested height.
    pageHeight = std::isfinite(layoutConstraints.maximumSize.width)
      ? std::min(pageHeight, layoutConstraints.maximumSize.height)
      : layoutConstraints.maximumSize.height;
    pageWidth = pageHeight * aspectRatio;
  }
  return {
    std::max(pageWidth, layoutConstraints.minimumSize.width),
    std::max(pageHeight, layoutConstraints.minimumSize.height)
  };
}

} // namespace facebook::react
