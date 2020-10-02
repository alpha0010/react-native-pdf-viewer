import React, { useCallback } from 'react';
import {
  NativeSyntheticEvent,
  requireNativeComponent,
  ViewStyle,
} from 'react-native';

export type ErrorEvent = { message: string };

export type LoadCompleteEvent = { height: number; width: number };

type PdfViewNativeProps = {
  onPdfError: (event: NativeSyntheticEvent<ErrorEvent>) => void;
  onPdfLoadComplete: (event: NativeSyntheticEvent<LoadCompleteEvent>) => void;
  page: number;
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
   * Document to display.
   */
  source: string;
  style?: ViewStyle;
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
      source={props.source}
      style={props.style}
    />
  );
}
