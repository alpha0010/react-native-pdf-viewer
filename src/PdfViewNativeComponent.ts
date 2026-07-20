import {
  codegenNativeComponent,
  type CodegenTypes,
  type ViewProps,
} from 'react-native';

export type ErrorEvent = { message: string };

export type LoadCompleteEvent = {
  height: CodegenTypes.Int32;
  width: CodegenTypes.Int32;
};

export type ResizeMode = 'contain' | 'fitWidth';

interface NativeProps extends ViewProps {
  annotation?: string;
  annotationStr?: string;
  onPdfError: CodegenTypes.BubblingEventHandler<ErrorEvent>;
  onPdfLoadComplete: CodegenTypes.BubblingEventHandler<LoadCompleteEvent>;
  page: CodegenTypes.Int32;
  resizeMode?: CodegenTypes.WithDefault<ResizeMode, 'contain'>;
  source: string;
}

export default codegenNativeComponent<NativeProps>('PdfView', {
  interfaceOnly: true,
});
