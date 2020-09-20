@objc(PdfViewManager)
class PdfViewManager: RCTViewManager {
    override func view() -> UIView! {
        return PdfView()
    }
}
