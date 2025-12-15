#include "PdfViewState.h"

namespace facebook::react {

PdfViewState::PdfViewState() : width(1), height(1) {}

#ifdef RN_SERIALIZABLE_STATE
PdfViewState::PdfViewState(const PdfViewState& previousState, folly::dynamic data)
  : width(data["width"].getInt()), height(data["height"].getInt()) {}

folly::dynamic PdfViewState::getDynamic() const {
  return folly::dynamic::object("width", width)("height", height);
}
#endif

} // namespace facebook::react
