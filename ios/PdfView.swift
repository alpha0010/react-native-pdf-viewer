class PdfView: UIView {
    @objc var page: NSNumber = 0 { didSet { renderPdf() } }
    @objc var source = "" { didSet { renderPdf() } }

    private var previousBounds: CGRect = .zero

    override func layoutSubviews() {
        if bounds != previousBounds {
            renderPdf()
            previousBounds = bounds
        }
        super.layoutSubviews()
    }

    private func renderPdf() {
        guard !frame.isEmpty && !source.isEmpty else {
            return
        }

        let currentFrame = frame
        DispatchQueue.global().async {
            let url = URL(fileURLWithPath: self.source)
            guard let pdf = CGPDFDocument(url as CFURL) else {
                return
            }
            guard let pdfPage = pdf.page(at: self.page.intValue + 1) else {
                return
            }

            UIGraphicsBeginImageContextWithOptions(currentFrame.size, true, 0.0)
            guard let context = UIGraphicsGetCurrentContext() else {
                UIGraphicsEndImageContext()
                return
            }
            context.saveGState()

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
            // Change context coordinate system to pdf coordinates
            context.translateBy(x: 0.0, y: currentFrame.height)
            context.scaleBy(x: currentFrame.width / pageWidth, y: -currentFrame.height / pageHeight)
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
                self.layer.contents = rendered?.cgImage
            }
        }
    }
}
