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
  style: ViewStyle;
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
export function Pdf(props: PdfProps) {
  const [pageIndexes, setPageIndexes] = useState<number[]>([]);
  useEffect(() => {
    const state = { live: true };
    PdfUtil.getPageCount(props.source).then((numPages) => {
      if (state.live) {
        const newIndexes: number[] = [];
        for (let i = 0; i < numPages; ++i) {
          newIndexes.push(i);
        }
        setPageIndexes(newIndexes);
      }
    });

    return () => {
      state.live = false;
    };
  }, [props.source, setPageIndexes]);

  return (
    <FlatList
      data={pageIndexes}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyExtractor={(item) => item.toString()}
      renderItem={({ item }) => (
        <PdfView page={item} source={props.source} style={styles.page} />
      )}
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
