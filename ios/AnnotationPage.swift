struct PositionedText: Decodable {
    let color: String
    let fontSize: CGFloat
    let point: [CGFloat]
    let str: String
}

struct Stroke: Decodable {
    let color: String
    let width: CGFloat
    let path: [[CGFloat]]
}

struct AnnotationPage: Decodable {
    let strokes: [Stroke]
    let text: [PositionedText]
}
