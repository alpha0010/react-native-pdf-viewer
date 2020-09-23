@objc(PdfUtilModule)
class PdfUtilModule: NSObject {
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc(unpackAsset:withResolver:withRejecter:)
    func unpackAsset(source: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        guard let cacheDirectory = NSSearchPathForDirectoriesInDomains(FileManager.SearchPathDirectory.cachesDirectory, FileManager.SearchPathDomainMask.userDomainMask, true).first else {
            reject("", "Unable to find cache directory", nil)
            return
        }
        let destination = "\(cacheDirectory)/\(source)"
        guard !FileManager.default.fileExists(atPath: destination) else {
            resolve(destination)
            return
        }
        guard let asset = Bundle.main.path(forResource: source, ofType: nil) else {
            reject("ENOENT", "Asset \(source) not found", nil)
            return
        }

        do {
            try FileManager.default.copyItem(atPath: asset, toPath: destination)
        } catch {
            reject("", "Failed to copy assset to \(destination)", error)
            return
        }

        resolve(destination)
    }

    @objc(getPageCount:withResolver:withRejecter:)
    func getPageCount(source: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let url = URL(fileURLWithPath: source)
        guard let pdf = CGPDFDocument(url as CFURL) else {
            reject("ENOENT", "Unable to read pdf \(source)", nil)
            return
        }
        resolve(pdf.numberOfPages)
    }

    @objc(getPageSizes:withResolver:withRejecter:)
    func getPageSizes(source: String, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let url = URL(fileURLWithPath: source)
        guard let pdf = CGPDFDocument(url as CFURL) else {
            reject("ENOENT", "Unable to read pdf \(source)", nil)
            return
        }

        var pages: [[String: CGFloat]] = []
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
