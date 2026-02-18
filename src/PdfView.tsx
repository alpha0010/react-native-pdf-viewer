import { useCallback, useImperativeHandle, useRef } from 'react';
import type {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  ViewStyle,
} from 'react-native';

import PdfViewNative, { Commands } from './PdfViewNativeComponent';
import { asPath } from './Util';

export type ErrorEvent = { message: string };

export type LoadCompleteEvent = { height: number; width: number };

export type ResizeMode = 'contain' | 'fitWidth';

export type PdfViewRef = { setAnnotation(annotation: string): void };

export type PdfViewProps = {
  /**
   * PAS v1 annotation JSON string.
   */
  annotationStr?: string;

  /**
   * Path to annotation data.
   */
  annotation?: string;

  /**
   * Callback to handle errors.
   */
  onError?: (event: ErrorEvent) => void;

  /**
   * Callback for measuring the native view.
   *
   * Triggers on mount and layout changes.
   */
  onLayout?: (event: LayoutChangeEvent) => void;

  /**
   * Callback to handle pdf load completion.
   *
   * Passed the dimensions of the rendered page.
   */
  onLoadComplete?: (event: LoadCompleteEvent) => void;

  /**
   * Page (0-indexed) of document to display.
   */
  page: number;

  ref?: React.RefObject<PdfViewRef | null>;

  /**
   * How pdf page should be scaled to fit in view dimensions.
   *
   * `contain`
   *   - Center and scale to the largest size that does not crop content.
   * `fitWidth`
   *   - Scale pdf page so width matches view. If aspect ratio of the pdf
   *     does not match the view, content will be cropped/space buffered at
   *     the bottom.
   */
  resizeMode?: ResizeMode;

  /**
   * Document to display.
   */
  source: string;
  style?: ViewStyle;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string;
};

/**
 * Single page of a pdf.
 */
export function PdfView(props: PdfViewProps) {
  const { onError, onLayout, onLoadComplete } = props;

  const nativeRef = useRef<React.ComponentRef<typeof PdfViewNative>>(null);

  useImperativeHandle(props.ref, () => ({
    setAnnotation: (annotation: string) => {
      if (nativeRef.current != null) {
        Commands.imperativeApplyAnnotation(nativeRef.current, annotation);
      }
    },
  }));

  const onPdfError = useCallback(
    (event: NativeSyntheticEvent<ErrorEvent>) => {
      if (onError != null) {
        onError(event.nativeEvent);
      }
    },
    [onError]
  );
  const onPdfLoadComplete = useCallback(
    (event: NativeSyntheticEvent<LoadCompleteEvent>) => {
      if (onLoadComplete != null) {
        onLoadComplete(event.nativeEvent);
      }
    },
    [onLoadComplete]
  );

  return (
    <PdfViewNative
      annotation={asPath(props.annotation)}
      annotationStr={props.annotationStr}
      onLayout={onLayout}
      onPdfError={onPdfError}
      onPdfLoadComplete={onPdfLoadComplete}
      page={props.page}
      ref={nativeRef}
      resizeMode={props.resizeMode}
      source={asPath(props.source)}
      style={props.style}
    />
  );
}
