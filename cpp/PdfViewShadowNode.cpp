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
  int pageWidth = getStateData().getPageWidth();
  int pageHeight = getStateData().getPageHeight();
  Float aspectRatio = static_cast<Float>(pageWidth) / pageHeight;
  Float targetWidth = layoutConstraints.maximumSize.height * aspectRatio;
  if (std::isinf(layoutConstraints.maximumSize.width) || layoutConstraints.maximumSize.width < 1) {
    if (std::isinf(layoutConstraints.maximumSize.height) || layoutConstraints.maximumSize.height < 1) {
      // No restrictions on dimensions? Use pdf dimensions.
      return {static_cast<Float>(pageWidth), static_cast<Float>(pageHeight)};
    }
    // No width requirements? Scale page to match requested height.
    return {targetWidth, layoutConstraints.maximumSize.height};
  }

  if (targetWidth <= layoutConstraints.maximumSize.width) {
    // When scaled to match requested height, page scaled width is
    // within width bounds. Scale page to match requested height.
    return {targetWidth, layoutConstraints.maximumSize.height};
  }
  // Scale page to match requested width.
  return {layoutConstraints.maximumSize.width, layoutConstraints.maximumSize.width / aspectRatio};
}

} // namespace facebook::react
