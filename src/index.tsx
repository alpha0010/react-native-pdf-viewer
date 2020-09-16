import { NativeModules, requireNativeComponent } from 'react-native';

type PdfViewerType = {
  multiply(a: number, b: number): Promise<number>;
};

type PdfViewProps = {
  src: string;
};

const { PdfViewer } = NativeModules;

export default PdfViewer as PdfViewerType;

export const PdfView = requireNativeComponent<PdfViewProps>('RNPdfView');
