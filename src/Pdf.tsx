import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { PageDim, PdfUtil } from './PdfUtil';
import { PdfView } from './PdfView';

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

const separatorSize = 4;

/**
 * Display a pdf.
 */
export function Pdf({ onError, onLoadComplete, source }: PdfProps) {
  const [flatListLayout, setFlatListLayout] = useState<PageDim>({
    height: 0,
    width: 0,
  });
  const [pageDims, setPageDims] = useState<PageDim[]>([]);
  useEffect(() => {
    const state = { live: true };
    PdfUtil.getPageSizes(source)
      .then((sizes) => {
        if (state.live) {
          setPageDims(sizes);
          if (onLoadComplete != null) {
            onLoadComplete(sizes.length);
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
  }, [onError, onLoadComplete, setPageDims, source]);

  return (
    <FlatList
      data={pageDims}
      getItemLayout={(data, index) => {
        let itemHeight = 100;
        let offset = (itemHeight + separatorSize) * index;
        if (data == null) {
          console.warn('Pdf list getItemLayout() not passed data.');
        } else if (flatListLayout.height === 0 || flatListLayout.width === 0) {
          console.warn(
            'Pdf list getItemLayout() could not determine screen size.'
          );
        } else {
          let pageSize = data[index];
          itemHeight =
            (flatListLayout.width * pageSize.height) / pageSize.width;
          offset = 0;
          for (let i = 0; i < index; ++i) {
            pageSize = data[i];
            offset +=
              separatorSize +
              (flatListLayout.width * pageSize.height) / pageSize.width;
          }
        }
        return {
          length: itemHeight,
          offset,
          index,
        };
      }}
      initialNumToRender={1}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyExtractor={(_item, index) => index.toString()}
      maxToRenderPerBatch={2}
      onLayout={(event) => {
        setFlatListLayout({
          height: event.nativeEvent.layout.height,
          width: event.nativeEvent.layout.width,
        });
      }}
      renderItem={({ index }) => (
        <PdfView page={index} source={source} style={styles.page} />
      )}
      windowSize={5}
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
  separator: { margin: separatorSize },
});
