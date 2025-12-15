#pragma once

#include <react/renderer/core/ConcreteComponentDescriptor.h>

#include "PdfViewShadowNode.h"

namespace facebook::react {

class PdfViewComponentDescriptor final
  : public ConcreteComponentDescriptor<PdfViewShadowNode> {
public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
  void adopt(ShadowNode& shadowNode) const override;
};

} // namespace facebook::react
