import React, { useEffect, useState } from 'react';
import {
  FlatList,
  NativeModules,
  requireNativeComponent,
  View,
  ViewStyle,
  StyleSheet,
} from 'react-native';

type PdfProps = {
  /**
   * Callback to handle errors.
   */
  onError?: (error: Error) => void;

  /**
   * Callback to handle pdf load completion.
   *
   * Passed the page count of the loaded pdf.
   */
  onLoadComplete?: (numberOfPages: number) => void;

  /**
   * Document to display.
   */
  source: string;
};

type PdfUtilType = {
  /**
   * Get the number of pages of a pdf.
   */
  getPageCount(source: string): Promise<number>;

  /**
   * Extract a bundled asset and return its absolute path.
   */
  unpackAsset(source: string): Promise<string>;
};

type PdfViewProps = {
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

/**
 * Utility pdf actions.
 */
export const PdfUtil: PdfUtilType = NativeModules.RNPdfUtil;

/**
 * Single page of a pdf.
 */
export const PdfView = requireNativeComponent<PdfViewProps>('RNPdfView');

/**
 * Display a pdf.
 */
export function Pdf({ onError, onLoadComplete, source }: PdfProps) {
  const [pageIndexes, setPageIndexes] = useState<number[]>([]);
  useEffect(() => {
    const state = { live: true };
    PdfUtil.getPageCount(source)
      .then((numPages) => {
        if (state.live) {
          const newIndexes: number[] = [];
          for (let i = 0; i < numPages; ++i) {
            newIndexes.push(i);
          }
          setPageIndexes(newIndexes);
          if (onLoadComplete != null) {
            onLoadComplete(numPages);
          }
        }
      })
      .catch((error) => {
        if (state.live && onError != null) {
          onError(error);
        }
      });

    return () => {
      state.live = false;
    };
  }, [onError, onLoadComplete, setPageIndexes, source]);

  return (
    <FlatList
      data={pageIndexes}
      initialNumToRender={1}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyExtractor={(item) => item.toString()}
      maxToRenderPerBatch={3}
      renderItem={({ item }) => (
        <PdfView page={item} source={source} style={styles.page} />
      )}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  separator: { margin: 4 },
});
