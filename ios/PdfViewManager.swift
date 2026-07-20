@objc(PdfViewManager)
class PdfViewManager: RCTViewManager {
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    override func shadowView() -> RCTShadowView! {
        return PdfViewShadowNode()
    }

    override func view() -> UIView! {
        return PdfView()
    }
}
