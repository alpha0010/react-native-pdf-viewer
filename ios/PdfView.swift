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
        let url = URL(fileURLWithPath: source)
        guard let pdf = CGPDFDocument(url as CFURL) else {
            return
        }
        guard let pdfPage = pdf.page(at: page.intValue + 1) else {
            return
        }

        UIGraphicsBeginImageContext(frame.size)
        guard let context = UIGraphicsGetCurrentContext() else {
            UIGraphicsEndImageContext()
            return
        }
        context.saveGState()

        // Change context coordinate system to pdf coordinates
        context.translateBy(x: 0.0, y: frame.height)
        context.scaleBy(x: 1.0, y: -1.0)
        context.concatenate(
            pdfPage.getDrawingTransform(.cropBox, rect: frame, rotate: 0, preserveAspectRatio: true)
        )

        context.interpolationQuality = .high
        context.setRenderingIntent(.defaultIntent)
        context.drawPDFPage(pdfPage)
        let rendered = UIGraphicsGetImageFromCurrentImageContext()

        context.restoreGState()
        UIGraphicsEndImageContext()

        layer.contents = rendered?.cgImage
    }
}
