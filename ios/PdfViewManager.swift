@objc(PdfViewManager)
class PdfViewManager: RCTViewManager {
    override func shadowView() -> RCTShadowView! {
        return PdfViewShadowNode()
    }

    override func view() -> UIView! {
        return PdfView()
    }
}
