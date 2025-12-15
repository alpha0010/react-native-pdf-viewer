#pragma once

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#endif

namespace facebook::react {

class PdfViewState {
private:
  int width;
  int height;

public:
  PdfViewState();
#ifdef RN_SERIALIZABLE_STATE
  PdfViewState(const PdfViewState& previousState, folly::dynamic data);
  folly::dynamic getDynamic() const;
#endif

  int getPageWidth() const { return width; }
  int getPageHeight() const { return height; }
};

} // namespace facebook::react
