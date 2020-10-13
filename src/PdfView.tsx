import React, { useCallback } from 'react';
import {
  NativeSyntheticEvent,
  requireNativeComponent,
  ViewStyle,
} from 'react-native';

export type ErrorEvent = { message: string };

export type LoadCompleteEvent = { height: number; width: number };

export type ResizeMode = 'contain' | 'fitWidth';

type PdfViewNativeProps = {
  onPdfError: (event: NativeSyntheticEvent<ErrorEvent>) => void;
  onPdfLoadComplete: (event: NativeSyntheticEvent<LoadCompleteEvent>) => void;
  page: number;
  resizeMode?: ResizeMode;
  source: string;
  style?: ViewStyle;
};

type PdfViewProps = {
  /**
   * Callback to handle errors.
   */
  onError?: (event: ErrorEvent) => void;

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
  const { onError, onLoadComplete } = props;

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
      onPdfError={onPdfError}
      onPdfLoadComplete={onPdfLoadComplete}
      page={props.page}
      resizeMode={props.resizeMode}
      source={props.source}
      style={props.style}
    />
  );
}
