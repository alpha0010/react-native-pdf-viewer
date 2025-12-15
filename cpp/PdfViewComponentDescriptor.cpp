#include "react/renderer/components/PdfViewSpec/ComponentDescriptors.h"

namespace facebook::react {

void PdfViewComponentDescriptor::adopt(ShadowNode& shadowNode) const {
  ConcreteComponentDescriptor::adopt(shadowNode);
  auto& pdfShadowNode = static_cast<PdfViewShadowNode&>(shadowNode);
  pdfShadowNode.enableMeasurement();
  // TODO: When is this called?
  // Can we avoid dirtyLayout() when page sizing does not change?
  pdfShadowNode.dirtyLayout();
}

} // namespace facebook::react
