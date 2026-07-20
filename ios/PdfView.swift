enum ResizeMode: String {
    case CONTAIN = "contain"
    case FIT_WIDTH = "fitWidth"
}

class PdfView: UIView {
    @objc var annotationStr = "" { didSet { loadAnnotation(file: false) } }
    @objc var annotation = "" { didSet { loadAnnotation(file: true) } }
    @objc var page: NSNumber = 0 { didSet { renderPdf() } }
    @objc var resizeMode = ResizeMode.CONTAIN.rawValue { didSet { validateResizeMode() } }
    @objc var source = "" { didSet { renderPdf() } }
    @objc var onPdfError: RCTBubblingEventBlock?
    @objc var onPdfLoadComplete: RCTBubblingEventBlock?

    private var annotationData = [AnnotationPage]()
    private var previousBounds: CGRect = .zero
    private var realResizeMode = ResizeMode.CONTAIN

    override func layoutSubviews() {
        if bounds != previousBounds {
            renderPdf()
            previousBounds = bounds
        }
        super.layoutSubviews()
    }

    private func loadAnnotation(file: Bool) {
        guard !annotation.isEmpty || !annotationStr.isEmpty else {
            if !annotationData.isEmpty {
                annotationData.removeAll()
                renderPdf()
            }
            return
        }

        let decoder = JSONDecoder()
        do {
            let data: Data;
            if (file) {
                data = try Data(contentsOf: URL(fileURLWithPath: annotation))
            }
            else {
                data = annotationStr.data(using: .utf8)!;
            }
            annotationData = try decoder.decode([AnnotationPage].self, from: data)
        } catch {
            dispatchOnError(
                message: "Failed to load annotation from '\(annotation)'. \(error.localizedDescription)"
            )
            return
        }
        renderPdf()
    }

    private func validateResizeMode() {
        guard let resizeEnum = ResizeMode(rawValue: resizeMode) else {
            dispatchOnError(message: "Unknown resizeMode '\(resizeMode)'.")
            return
        }

        realResizeMode = resizeEnum
        renderPdf()
    }

    private func parseColor(_ hex: String) -> UIColor {
        // Parse HTML hex color. Assumes leading `#`.
        guard let colorInt = UInt64(hex.dropFirst().prefix(6), radix: 16) else {
            return UIColor.black
        }
        var alpha = CGFloat(1.0)
        if hex.count == 9, let alphaInt = UInt64(hex.suffix(2), radix: 16) {
            // Extract alpha channel.
            alpha = CGFloat(alphaInt) / 255.0
        }
        return UIColor(
            red: CGFloat((colorInt & 0xFF0000) >> 16) / 255.0,
            green: CGFloat((colorInt & 0x00FF00) >> 8) / 255.0,
            blue: CGFloat(colorInt & 0x0000FF) / 255.0,
            alpha: alpha
        )
    }

    private func makeCGPoint(_ point: [CGFloat], _ scaleX: CGFloat, _ scaleY: CGFloat) -> CGPoint {
        return CGPoint(x: scaleX * point[0], y: scaleY * point[1])
    }

    private func computeDist(_ a: [CGFloat], _ b: [CGFloat], scaleX: CGFloat, scaleY: CGFloat) -> CGFloat {
        return hypot(scaleX * (a[0] - b[0]), scaleY * (a[1] - b[1]))
    }

    private func computePath(_ context: CGContext, _ coordinates: [[CGFloat]], scaleX: CGFloat, scaleY: CGFloat) {
        // Start path at the first point.
        var prevPoint = coordinates[0]
        context.move(to: makeCGPoint(prevPoint, scaleX, scaleY))
        for point in coordinates.dropFirst() {
            guard computeDist(prevPoint, point, scaleX: scaleX, scaleY: scaleY) > 3 else {
                // Smooth small irregularities.
                continue
            }
            let midX = (prevPoint[0] + point[0]) / 2
            let midY = (prevPoint[1] + point[1]) / 2
            // Draw line to the midpoint between the next two points. Use the first
            // point as curve control (line will bend toward it).
            context.addQuadCurve(
                to: makeCGPoint([midX, midY], scaleX, scaleY),
                control: makeCGPoint(prevPoint, scaleX, scaleY)
            )
            prevPoint = point
        }
        // Draw line to the last point.
        prevPoint = coordinates.last!
        context.addLine(to: makeCGPoint(prevPoint, scaleX, scaleY))
    }

    private func renderAnnotation(_ context: CGContext, scaleX: CGFloat, scaleY: CGFloat) {
        guard page.intValue < annotationData.count else {
            // No annotation data for current page.
            return
        }
        let annotationPage = annotationData[page.intValue]

        // Draw strokes.
        context.setLineCap(.round)
        context.setLineJoin(.round)
        for stroke in annotationPage.strokes {
            guard stroke.path.count > 1 else {
                continue
            }
            context.setStrokeColor(parseColor(stroke.color).cgColor)
            context.setLineWidth(stroke.width)

            context.beginPath()
            computePath(context, stroke.path, scaleX: scaleX, scaleY: scaleY)
            context.strokePath()
        }

        // Draw text.
        for msg in annotationPage.text {
            // Increase the font for larger views, but do so at a reduced rate.
            let scaledFont = 9 + (msg.fontSize * scaleX) / 1000
            msg.str.draw(
                at: makeCGPoint(msg.point, scaleX, scaleY),
                withAttributes: [
                    .font: UIFont.systemFont(ofSize: scaledFont),
                    .foregroundColor: parseColor(msg.color)
                ]
            )
        }
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
            context.restoreGState()

            context.saveGState()
            self.renderAnnotation(context, scaleX: currentFrame.width, scaleY: currentFrame.height)
            context.restoreGState()

            let rendered = UIGraphicsGetImageFromCurrentImageContext()

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
