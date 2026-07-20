import React, { useCallback } from 'react';
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  requireNativeComponent,
  ViewStyle,
} from 'react-native';
import { asPath } from './Util';

export type ErrorEvent = { message: string };

export type LoadCompleteEvent = { height: number; width: number };

export type ResizeMode = 'contain' | 'fitWidth';

type PdfViewNativeProps = {
  annotation?: string;
  annotationStr?: string;
  onLayout?: (event: LayoutChangeEvent) => void;
  onPdfError: (event: NativeSyntheticEvent<ErrorEvent>) => void;
  onPdfLoadComplete: (event: NativeSyntheticEvent<LoadCompleteEvent>) => void;
  page: number;
  resizeMode?: ResizeMode;
  source: string;
  style?: ViewStyle;
};

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

const PdfViewNative = requireNativeComponent<PdfViewNativeProps>('RNPdfView');

/**
 * Single page of a pdf.
 */
export function PdfView(props: PdfViewProps) {
  const { onError, onLayout, onLoadComplete } = props;

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
      resizeMode={props.resizeMode}
      source={asPath(props.source)}
      style={props.style}
    />
  );
}
