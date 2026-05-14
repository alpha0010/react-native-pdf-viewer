#include "PdfViewState.h"

namespace facebook::react {

namespace {
// Heuristic: guess that new pages will be the same dimensions as the last
// measured page.
int defaultWidth = 1;
int defaultHeight = 1;
} // namespace

PdfViewState::PdfViewState() : width(defaultWidth), height(defaultHeight) {}

PdfViewState::PdfViewState(int _width, int _height) : width(_width), height(_height) {
  defaultWidth = width;
  defaultHeight = height;
}

#ifdef RN_SERIALIZABLE_STATE
PdfViewState::PdfViewState(const PdfViewState& previousState, folly::dynamic data)
  : width(data["width"].getInt()), height(data["height"].getInt()) {
  defaultWidth = width;
  defaultHeight = height;
}

folly::dynamic PdfViewState::getDynamic() const {
  return folly::dynamic::object("width", width)("height", height);
}
#endif

} // namespace facebook::react
