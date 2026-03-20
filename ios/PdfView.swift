@objc public enum ResizeMode: Int {
    case CONTAIN, FIT_WIDTH
}

@objc(PdfViewImpl)
public class PdfView: UIView {
    private var annotation = ""
    private var annotationStr = ""
    private var page = 0
    private var resizeMode = ResizeMode.CONTAIN
    private var source = ""

    public typealias PdfErrorHandler = (String) -> Void
    @objc public var onPdfError: PdfErrorHandler?

    public typealias PdfPageSizeHandler = (Int, Int) -> Void
    @objc public var onPdfLoadComplete: PdfPageSizeHandler?
    @objc public var onPdfMeasure: PdfPageSizeHandler?

    private let annotLayer: AnnotationView
    private var previousSize: CGSize = .zero

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
            loadAnnotation(file: false)
        }
    }

    @objc public func prepareForRecycle() {
        source = ""
        resizeMode = ResizeMode.CONTAIN
        previousSize = .zero
        annotation = ""
        annotationStr = ""
        annotLayer.setAnnotationData([])
    }

    @objc public func updateProps(annot: String, annotStr: String, pg: Int, rsMd: ResizeMode, src: String) {
        var isDirty = false
        var needsMeasure = false
        if annotation != annot {
            annotation = annot
            loadAnnotation(file: true)
        }
        if annotationStr != annotStr {
            annotationStr = annotStr
            loadAnnotation(file: false)
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
        if bounds.size != previousSize {
            previousSize = bounds.size
            renderPdf()
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
        guard bounds.width > 2 && bounds.height > 2 && !source.isEmpty else {
            // View layout not yet complete, or nothing to render.
            return
        }

        var currentSize = bounds.size
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

            // TODO: Is it possible to know when layout has stabilized, to
            // avoid guess-and-check rendering?
            for _ in 1...4 {
                let (pageHeight, pageWidth, rendered) = self.doRenderPage(currentSize: currentSize, pdfPage: pdfPage)
                var abort = false
                var success = false
                DispatchQueue.main.sync {
                    if self.bounds.width < 2 || self.bounds.height < 2 {
                        abort = true
                    } else if self.bounds.size == currentSize {
                        success = true
                        self.layer.contents = rendered.cgImage
                    } else {
                        currentSize = self.bounds.size
                    }
                }
                if abort {
                    break
                } else if success {
                    self.dispatchOnLoadComplete(pageWidth: pageWidth, pageHeight: pageHeight)
                    break
                }
            }
        }
    }

    private func doRenderPage(currentSize: CGSize, pdfPage: CGPDFPage) -> (CGFloat, CGFloat, UIImage) {
        var pageHeight: CGFloat = -1;
        var pageWidth: CGFloat = -1;
        let format = UIGraphicsImageRendererFormat()
        format.opaque = true
        let rendered = UIGraphicsImageRenderer(size: currentSize, format: format).image { (uiCtx) in
            let context = uiCtx.cgContext
            context.saveGState()

            // Default color for opaque context is black, so fill with white.
            UIColor.white.setFill()
            context.fill(CGRect(origin: CGPoint(), size: currentSize))

            let pageBounds = pdfPage.getBoxRect(.cropBox)
            if pdfPage.rotationAngle % 180 == 90 {
                pageHeight = pageBounds.width
                pageWidth = pageBounds.height
            } else {
                pageHeight = pageBounds.height
                pageWidth = pageBounds.width
            }
            // Change context coordinate system to pdf coordinates.
            let targetHeight = currentSize.width * pageHeight / pageWidth
            if self.resizeMode == ResizeMode.CONTAIN {
                // Shift/resize so render is contained and centered in the context.
                if targetHeight > currentSize.height {
                    let targetWidth = currentSize.height * pageWidth / pageHeight
                    context.translateBy(x: (currentSize.width - targetWidth) / 2, y: 0.0)
                    let scaleFactor = currentSize.height / targetHeight
                    context.scaleBy(x: scaleFactor, y: scaleFactor)
                } else {
                    context.translateBy(x: 0.0, y: (currentSize.height - targetHeight) / 2)
                }
            }
            context.translateBy(x: 0.0, y: targetHeight)
            context.scaleBy(x: currentSize.width / pageWidth, y: -targetHeight / pageHeight)
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
        return (pageHeight, pageWidth, rendered)
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
