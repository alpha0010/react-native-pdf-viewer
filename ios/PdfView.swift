@objc public enum ResizeMode: Int {
    case CONTAIN, FIT_WIDTH
}

@objc(PdfViewImpl)
public class PdfView: UIView {
    private var annotation = "" { didSet { loadAnnotation(file: true) } }
    private var annotationStr = "" { didSet { loadAnnotation(file: false) } }
    private var page = 0
    private var resizeMode = ResizeMode.CONTAIN
    private var source = ""

    @objc public var readyToRender = false

    public typealias PdfErrorHandler = (String) -> Void
    @objc public var onPdfError: PdfErrorHandler?

    public typealias PdfPageSizeHandler = (Int, Int) -> Void
    @objc public var onPdfLoadComplete: PdfPageSizeHandler?
    @objc public var onPdfMeasure: PdfPageSizeHandler?

    private let annotLayer: AnnotationView
    private var previousBounds: CGRect = .zero

    public override init(frame: CGRect) {
        annotLayer = AnnotationView()
        super.init(frame: frame)
        annotLayer.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        annotLayer.isOpaque = false
        addSubview(annotLayer)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    @objc public func measurePdf() {
        guard !source.isEmpty, let dispatcher = onPdfMeasure else {
            return
        }
        let url = URL(fileURLWithPath: source)
        guard let pdf = CGPDFDocument(url as CFURL) else {
            return
        }
        guard let pdfPage = pdf.page(at: page + 1) else {
            return
        }
        // Apply crop and rotation to dimensions.
        let pageBounds = pdfPage.getBoxRect(.cropBox)
        let nextWidth: Int
        let nextHeight: Int
        if pdfPage.rotationAngle % 180 == 90 {
            nextWidth = Int(pageBounds.height.rounded())
            nextHeight = Int(pageBounds.width.rounded())
        } else {
            nextWidth = Int(pageBounds.width.rounded())
            nextHeight = Int(pageBounds.height.rounded())
        }
        dispatcher(nextWidth, nextHeight)
    }

    @objc public func updateProps(annotStr: String) {
        if annotationStr != annotStr {
            annotationStr = annotStr
            renderPdf()
        }
    }

    @objc public func updateProps(annot: String, annotStr: String, pg: Int, rsMd: ResizeMode, src: String) {
        var isDirty = false
        var needsMeasure = false
        if annotation != annot {
            annotation = annot
        }
        if annotationStr != annotStr {
            annotationStr = annotStr
        }
        if page != pg {
            page = pg
            isDirty = true
            needsMeasure = true
            annotLayer.setPage(pg)
        }
        if resizeMode != rsMd {
            resizeMode = rsMd
            isDirty = true
        }
        if source != src {
            source = src
            isDirty = true
            needsMeasure = true
        }
        if needsMeasure {
            measurePdf()
        }
        if isDirty {
            renderPdf()
        }
    }

    public override func layoutSubviews() {
        if bounds != previousBounds {
            renderPdf()
            previousBounds = bounds
            annotLayer.setNeedsDisplay()
        }
        super.layoutSubviews()
    }

    private func loadAnnotation(file: Bool) {
        guard !annotation.isEmpty || !annotationStr.isEmpty else {
            annotLayer.setAnnotationData([])
            return
        }

        let decoder = JSONDecoder()
        do {
            let data: Data;
            if (file) {
                data = try Data(contentsOf: URL(fileURLWithPath: annotation))
            } else {
                data = annotationStr.data(using: .utf8)!;
            }
            annotLayer.setAnnotationData(try decoder.decode([AnnotationPage].self, from: data))
        } catch {
            dispatchOnError(
                message: "Failed to load annotation from '\(annotation)'. \(error.localizedDescription)"
            )
            return
        }
    }

    private func renderPdf() {
        guard !frame.isEmpty && !source.isEmpty && readyToRender else {
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
            guard let pdfPage = pdf.page(at: self.page + 1) else {
                self.dispatchOnError(message: "Failed to open page '\(self.page)' of '\(self.source)' for reading.")
                return
            }

            var pageHeight: CGFloat = -1;
            var pageWidth: CGFloat = -1;
            let format = UIGraphicsImageRendererFormat()
            format.opaque = true
            let rendered = UIGraphicsImageRenderer(size: currentFrame.size, format: format).image { (uiCtx) in
                let context = uiCtx.cgContext
                context.saveGState()

                // Default color for opaque context is black, so fill with white.
                UIColor.white.setFill()
                context.fill(CGRect(origin: CGPoint(), size: currentFrame.size))

                let pageBounds = pdfPage.getBoxRect(.cropBox)
                if pdfPage.rotationAngle % 180 == 90 {
                    pageHeight = pageBounds.width
                    pageWidth = pageBounds.height
                } else {
                    pageHeight = pageBounds.height
                    pageWidth = pageBounds.width
                }
                // Change context coordinate system to pdf coordinates.
                let targetHeight = currentFrame.width * pageHeight / pageWidth
                if self.resizeMode == ResizeMode.CONTAIN {
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
            }

            DispatchQueue.main.async {
                // Post new bitmap for display.
                self.layer.contents = rendered.cgImage
            }
            self.dispatchOnLoadComplete(pageWidth: pageWidth, pageHeight: pageHeight)
        }
    }

    private func dispatchOnError(message: String) {
        // Queue message to give RN core a chance to init event emitters.
        DispatchQueue.main.async {
            guard let dispatcher = self.onPdfError else {
                return
            }
            dispatcher(message)
        }
    }

    private func dispatchOnLoadComplete(pageWidth: CGFloat, pageHeight: CGFloat) {
        guard let dispatcher = onPdfLoadComplete else {
            return
        }
        dispatcher(Int(pageWidth.rounded()), Int(pageHeight.rounded()))
    }
}
