@objc(PdfUtilModule)
class PdfUtilModule: NSObject {
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    /**
     * Get the number of pages of a pdf.
     */
    @objc(getPageCount:withResolver:withRejecter:)
    func getPageCount(source: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let url = URL(fileURLWithPath: source)
        guard let pdf = CGPDFDocument(url as CFURL) else {
            reject("ENOENT", "Unable to read pdf \(source)", nil)
            return
        }
        resolve(pdf.numberOfPages)
    }

    /**
     * Get the dimensions of every page.
     */
    @objc(getPageSizes:withResolver:withRejecter:)
    func getPageSizes(source: String, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let url = URL(fileURLWithPath: source)
        guard let pdf = CGPDFDocument(url as CFURL) else {
            reject("ENOENT", "Unable to read pdf \(source)", nil)
            return
        }

        // Read dimensions (in pdf units) of all pages.
        var pages: [[String: CGFloat]] = []
        // CGPDFDocument pages are 1-indexed.
        for pageNum in 1...pdf.numberOfPages {
            guard let pdfPage = pdf.page(at: pageNum) else {
                reject(nil, "Unable to read pdf page \(pageNum)", nil)
                return
            }

            let pageBounds = pdfPage.getBoxRect(.cropBox)
            let pageHeight: CGFloat
            let pageWidth: CGFloat
            if pdfPage.rotationAngle % 180 == 90 {
                pageHeight = pageBounds.width
                pageWidth = pageBounds.height
            } else {
                pageHeight = pageBounds.height
                pageWidth = pageBounds.width
            }

            pages.append([
                "height": pageHeight,
                "width": pageWidth
            ])
        }
        resolve(pages)
    }
}
