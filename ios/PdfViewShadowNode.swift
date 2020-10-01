class PdfViewShadowNode: RCTShadowView {
    @objc var page: NSNumber = 0 { didSet { measurePdf() } }
    var pageHeight: Float = 1.0
    var pageWidth: Float = 1.0
    @objc var source = "" { didSet { measurePdf() } }

    override init() {
        super.init()
        YGNodeSetMeasureFunc(self.yogaNode, measure)
    }

    private func measurePdf() {
        guard !source.isEmpty else {
            return
        }
        let url = URL(fileURLWithPath: source)
        guard let pdf = CGPDFDocument(url as CFURL) else {
            return
        }
        guard let pdfPage = pdf.page(at: page.intValue + 1) else {
            return
        }
        // Apply crop and rotation to dimensions.
        let pageBounds = pdfPage.getBoxRect(.cropBox)
        if pdfPage.rotationAngle % 180 == 90 {
            pageHeight = Float(pageBounds.width)
            pageWidth = Float(pageBounds.height)
        } else {
            pageHeight = Float(pageBounds.height)
            pageWidth = Float(pageBounds.width)
        }

        YGNodeMarkDirty(self.yogaNode)
    }
}

func measure(node: YGNodeRef?, width: Float, widthMode: YGMeasureMode, height: Float, heightMode: YGMeasureMode) -> YGSize {
    // Cast raw pointer back to object.
    let shadowNode = Unmanaged<PdfViewShadowNode>.fromOpaque(YGNodeGetContext(node)).takeUnretainedValue()

    let aspectRatio = shadowNode.pageWidth / shadowNode.pageHeight
    let targetWidth = height * aspectRatio
    if widthMode == .undefined || width < 1 {
        if heightMode == .undefined || height < 1 {
            // No restrictions on dimensions? Use pdf dimensions.
            return YGSize(width: shadowNode.pageWidth, height: shadowNode.pageHeight)
        }
        // No width requirements? Scale page to match yoga requested height.
        return YGSize(width: targetWidth, height: height)
    }

    if targetWidth <= width {
        // When scaled to match yoga requested height, page scaled width is
        // within yoga width bounds. Scale page to match yoga requested height.
        return YGSize(width: targetWidth, height: height)
    }
    // Scale page to match yoga requested width.
    return YGSize(width: width, height: width / aspectRatio)
}
