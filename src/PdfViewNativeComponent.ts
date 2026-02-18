import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeCommands, codegenNativeComponent } from 'react-native';

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

interface NativeCommands {
  imperativeApplyAnnotation(
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    annotation: string
  ): void;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['imperativeApplyAnnotation'],
});

export default codegenNativeComponent<NativeProps>('PdfView', {
  interfaceOnly: true,
});
