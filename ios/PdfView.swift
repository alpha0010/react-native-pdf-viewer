enum ResizeMode: String {
    case CONTAIN = "contain"
    case FIT_WIDTH = "fitWidth"
}

class PdfView: UIView {
    @objc var page: NSNumber = 0 { didSet { renderPdf() } }
    @objc var resizeMode = ResizeMode.CONTAIN.rawValue { didSet { validateResizeMode() } }
    @objc var source = "" { didSet { renderPdf() } }
    @objc var onPdfError: RCTBubblingEventBlock?
    @objc var onPdfLoadComplete: RCTBubblingEventBlock?

    private var previousBounds: CGRect = .zero
    private var realResizeMode = ResizeMode.CONTAIN

    override func layoutSubviews() {
        if bounds != previousBounds {
            renderPdf()
            previousBounds = bounds
        }
        super.layoutSubviews()
    }

    private func validateResizeMode() {
        guard let resizeEnum = ResizeMode(rawValue: resizeMode) else {
            dispatchOnError(message: "Unknown resizeMode '\(resizeMode)'.")
            return
        }

        realResizeMode = resizeEnum
        renderPdf()
    }

    private func renderPdf() {
        guard !frame.isEmpty && !source.isEmpty else {
            // View layout not yet complete, or nothing to render.
            return
        }

        let currentFrame = frame
        DispatchQueue.global().async {
            let url = URL(fileURLWithPath: self.source)
            guard let pdf = CGPDFDocument(url as CFURL) else {
                self.dispatchOnError(message: "Failed to open '\(self.source)' for reading.")
                return
            }
            guard let pdfPage = pdf.page(at: self.page.intValue + 1) else {
                self.dispatchOnError(message: "Failed to open page '\(self.page)' of '\(self.source)' for reading.")
                return
            }

            UIGraphicsBeginImageContextWithOptions(currentFrame.size, true, 0.0)
            guard let context = UIGraphicsGetCurrentContext() else {
                UIGraphicsEndImageContext()
                self.dispatchOnError(message: "Failed to open graphics context for rendering '\(self.source)'.")
                return
            }
            context.saveGState()

            // Default color for opaque context is black, so fill with white.
            UIColor.white.setFill()
            context.fill(currentFrame)

            let pageBounds = pdfPage.getBoxRect(.cropBox)
            let pageHeight: CGFloat;
            let pageWidth: CGFloat;
            if pdfPage.rotationAngle % 180 == 90 {
                pageHeight = pageBounds.width
                pageWidth = pageBounds.height
            } else {
                pageHeight = pageBounds.height
                pageWidth = pageBounds.width
            }
            // Change context coordinate system to pdf coordinates.
            let targetHeight = currentFrame.width * pageHeight / pageWidth
            if self.realResizeMode == ResizeMode.CONTAIN {
                // Shift/resize so render is contained and centered in the context.
                if targetHeight > currentFrame.height {
                    let targetWidth = currentFrame.height * pageWidth / pageHeight
                    context.translateBy(x: (currentFrame.width - targetWidth) / 2, y: 0.0)
                    let scaleFactor = currentFrame.height / targetHeight
                    context.scaleBy(x: scaleFactor, y: scaleFactor)
                } else {
                    context.translateBy(x: 0.0, y: (currentFrame.height - targetHeight) / 2)
                }
            }
            context.translateBy(x: 0.0, y: targetHeight)
            context.scaleBy(x: currentFrame.width / pageWidth, y: -targetHeight / pageHeight)
            context.concatenate(pdfPage.getDrawingTransform(
                .cropBox,
                rect: CGRect(x: 0.0, y: 0.0, width: pageWidth, height: pageHeight),
                rotate: 0,
                preserveAspectRatio: false
            ))

            context.interpolationQuality = .high
            context.setRenderingIntent(.defaultIntent)
            context.drawPDFPage(pdfPage)
            let rendered = UIGraphicsGetImageFromCurrentImageContext()

            context.restoreGState()
            UIGraphicsEndImageContext()

            DispatchQueue.main.async {
                // Post new bitmap for display.
                self.layer.contents = rendered?.cgImage
            }
            self.dispatchOnLoadComplete(pageWidth: pageWidth, pageHeight: pageHeight)
        }
    }

    private func dispatchOnError(message: String) {
        guard let dispatcher = onPdfError else {
            return
        }
        dispatcher(["message": message])
    }

    private func dispatchOnLoadComplete(pageWidth: CGFloat, pageHeight: CGFloat) {
        guard let dispatcher = onPdfLoadComplete else {
            return
        }
        dispatcher(["width": pageWidth, "height": pageHeight])
    }
}
