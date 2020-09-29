import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

import { PageDim, PdfUtil } from './PdfUtil';
import { PdfView } from './PdfView';

/**
 * Optional props, forwarded to the underlying `FlatList` component.
 */
type BaseListProps = {
  /**
   * Instead of starting at the top with the first item, start at
   * initialScrollIndex.
   */
  initialScrollIndex?: number;

  /**
   * Rendered when the list is empty. Can be a React Component Class, a render
   * function, or a rendered element.
   */
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;

  /**
   * Called when the momentum scroll starts (scroll which occurs as the scroll
   * view starts gliding).
   */
  onMomentumScrollBegin?: (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => void;

  /**
   * Called when the momentum scroll ends (scroll which occurs as the scroll
   * view glides to a stop).
   */
  onMomentumScrollEnd?: (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => void;

  /**
   * Fires at most once per frame during scrolling. The frequency of the events
   * can be contolled using the scrollEventThrottle prop.
   */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

  /**
   * Called when the user begins to drag the scroll view.
   */
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

  /**
   * Called when the user stops dragging the scroll view and it either stops or
   * begins to glide.
   */
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

  /**
   * This controls how often the scroll event will be fired while scrolling
   * (in events per seconds). A higher number yields better accuracy for code
   * that is tracking the scroll position, but can lead to scroll performance
   * problems due to the volume of information being send over the bridge. The
   * default value is zero, which means the scroll event will be sent only once
   * each time the view is scrolled.
   * Only available on iOS.
   */
  scrollEventThrottle?: number;
};

type PdfProps = BaseListProps & {
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

export type PdfRef = {
  /**
   * Scroll to the specified page (0-indexed).
   */
  scrollTo(page: number): void;
};

const separatorSize = 8;

/**
 * Display a pdf.
 */
export const Pdf = forwardRef((props: PdfProps, ref: React.Ref<PdfRef>) => {
  const { onError, onLoadComplete, source } = props;

  const [flatListLayout, setFlatListLayout] = useState<PageDim>({
    height: 0,
    width: 0,
  });
  const [pageDims, setPageDims] = useState<PageDim[]>([]);

  const listRef = useRef<FlatList<PageDim>>(null);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo: (page) =>
        listRef.current?.scrollToIndex({ animated: true, index: page }),
    }),
    [listRef]
  );

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
      data={flatListLayout.height === 0 ? [] : pageDims}
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
      ref={listRef}
      renderItem={({ index }) => (
        <PdfView page={index} source={source} style={styles.page} />
      )}
      windowSize={5}
      initialScrollIndex={props.initialScrollIndex}
      ListEmptyComponent={props.ListEmptyComponent}
      onMomentumScrollBegin={props.onMomentumScrollBegin}
      onMomentumScrollEnd={props.onMomentumScrollEnd}
      onScroll={props.onScroll}
      onScrollBeginDrag={props.onScrollBeginDrag}
      onScrollEndDrag={props.onScrollEndDrag}
      scrollEventThrottle={props.scrollEventThrottle}
    />
  );
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  separator: { height: separatorSize },
});
