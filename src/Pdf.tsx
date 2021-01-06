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
  RefreshControlProps,
  StyleSheet,
  View,
} from 'react-native';

import { PageDim, PdfUtil } from './PdfUtil';
import { PdfView } from './PdfView';

export type PageMeasurement = {
  /**
   * Display height of the page.
   */
  itemHeight: number;

  /**
   * Position (dp) within the FlatList.
   */
  offset: number;
};

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
   * can be controlled using the scrollEventThrottle prop.
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
   * A RefreshControl component, used to provide pull-to-refresh
   * functionality for the ScrollView.
   */
  refreshControl?: React.ReactElement<RefreshControlProps>;

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
   * Callback to receive layout details of all pages.
   */
  onMeasurePages?: (measurements: PageMeasurement[]) => void;

  /**
   * Size pages such that each page can be displayed without cutoff. Applies
   * when device is in the specified orientation.
   */
  shrinkToFit?: 'never' | 'portrait' | 'landscape' | 'always';

  /**
   * Document to display.
   */
  source: string;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string;
};

export type PdfRef = {
  /**
   * Scroll to the specified page (0-indexed).
   */
  scrollToIndex(index: number): void;

  /**
   * Scroll to the specified offset.
   */
  scrollToOffset(offset: number): void;
};

const separatorSize = 8;

/**
 * Report measurements of all pages to a callback.
 */
function useMeasurePages(
  layoutWidth: number,
  pageDims: PageDim[],
  maxPageHeight: number,
  onMeasurePages?: (measurements: PageMeasurement[]) => void
) {
  useEffect(() => {
    if (onMeasurePages == null || layoutWidth === 0) {
      return;
    }
    const measurements: PageMeasurement[] = [];
    let offset = 0;
    for (const pageSize of pageDims) {
      // Measurements include scaling to fill width,
      const itemHeight = Math.min(
        maxPageHeight,
        (layoutWidth * pageSize.height) / pageSize.width
      );
      measurements.push({ itemHeight, offset });
      // and offset for separator between pages.
      offset += itemHeight + separatorSize;
    }
    onMeasurePages(measurements);
  }, [layoutWidth, maxPageHeight, onMeasurePages, pageDims]);
}

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
      scrollToIndex: (index) =>
        listRef.current?.scrollToIndex({ animated: true, index }),
      scrollToOffset: (offset) =>
        listRef.current?.scrollToOffset({ animated: true, offset }),
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

  let maxPageHeight: number | undefined;
  if (flatListLayout.height > 0) {
    if (
      props.shrinkToFit === 'always' ||
      (flatListLayout.height > flatListLayout.width &&
        props.shrinkToFit === 'portrait') ||
      (flatListLayout.height < flatListLayout.width &&
        props.shrinkToFit === 'landscape')
    ) {
      maxPageHeight = flatListLayout.height;
    }
  }

  useMeasurePages(
    flatListLayout.width,
    pageDims,
    maxPageHeight ?? Number.MAX_VALUE,
    props.onMeasurePages
  );

  return (
    <FlatList
      data={flatListLayout.height === 0 ? [] : pageDims}
      getItemLayout={(data, index) => {
        // Default height, so layout computation will always return non-zero.
        // This case should never occur.
        let itemHeight = 100;
        let offset = (itemHeight + separatorSize) * index;
        if (data == null) {
          console.warn('Pdf list getItemLayout() not passed data.');
        } else if (flatListLayout.height === 0 || flatListLayout.width === 0) {
          console.warn(
            'Pdf list getItemLayout() could not determine screen size.'
          );
        } else {
          const bound = maxPageHeight ?? Number.MAX_VALUE;
          let pageSize = data[index];
          itemHeight = Math.min(
            bound,
            (flatListLayout.width * pageSize.height) / pageSize.width
          );
          // Add up the separators and heights of pages before the current page.
          offset = 0;
          for (let i = 0; i < index; ++i) {
            pageSize = data[i];
            offset +=
              separatorSize +
              Math.min(
                bound,
                (flatListLayout.width * pageSize.height) / pageSize.width
              );
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
        // For sizing pages to fit width, including on device rotation.
        setFlatListLayout({
          height: event.nativeEvent.layout.height,
          width: event.nativeEvent.layout.width,
        });
      }}
      ref={listRef}
      renderItem={({ index }) => (
        <View style={[styles.pageAlign, { maxHeight: maxPageHeight }]}>
          <View>
            <PdfView page={index} source={source} style={styles.page} />
          </View>
        </View>
      )}
      windowSize={5}
      initialScrollIndex={props.initialScrollIndex}
      ListEmptyComponent={props.ListEmptyComponent}
      onMomentumScrollBegin={props.onMomentumScrollBegin}
      onMomentumScrollEnd={props.onMomentumScrollEnd}
      onScroll={props.onScroll}
      onScrollBeginDrag={props.onScrollBeginDrag}
      onScrollEndDrag={props.onScrollEndDrag}
      refreshControl={props.refreshControl}
      scrollEventThrottle={props.scrollEventThrottle}
      testID="pdfFlatList"
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
  pageAlign: { alignItems: 'center' },
  separator: { height: separatorSize },
});
