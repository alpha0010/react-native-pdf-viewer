class AnnotationView: UIView {
    private var annotationData = [AnnotationPage]()
    private var page = 0

    public override func draw(_ rect: CGRect) {
        if let context = UIGraphicsGetCurrentContext() {
            context.saveGState()
            context.clip(to: rect)
            self.renderAnnotation(context, scaleX: frame.width, scaleY: frame.height)
            context.restoreGState()
        }
    }

    public func setAnnotationData(_ data: [AnnotationPage]){
        if data.isEmpty {
            if !annotationData.isEmpty {
                annotationData.removeAll()
                DispatchQueue.main.async { self.setNeedsDisplay() }
            }
        } else {
            annotationData = data
            DispatchQueue.main.async { self.setNeedsDisplay() }
        }
    }

    public func setPage(_ pg: Int) {
        if page != pg {
            page = pg
            DispatchQueue.main.async { self.setNeedsDisplay() }
        }
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
        guard page < annotationData.count else {
            // No annotation data for current page.
            return
        }
        let annotationPage = annotationData[page]

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
}
