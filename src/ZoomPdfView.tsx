import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureType,
  ScrollView,
} from 'react-native-gesture-handler';

import type { PageDim } from './PdfUtil';
import { LoadCompleteEvent, PdfView, PdfViewProps } from './PdfView';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type AnimatedStyle = React.ComponentProps<typeof Animated.View>['style'];
type ScrollViewRef = React.RefObject<typeof ScrollView>;

export type PdfComponent = (props: PdfViewProps) => JSX.Element;

export type ZoomPdfViewProps = PdfViewProps & {
  /**
   * Callback when view starts to zoom.
   */
  onZoomIn?: () => void;

  /**
   * Callback when view returns to non-zoomed state.
   */
  onZoomReset?: () => void;

  /**
   * Maximum allowed zoom. Default 2.
   */
  maximumZoom?: number;

  /**
   * A RefreshControl component, used to provide pull-to-refresh
   * functionality for the internal ScrollView.
   */
  refreshControl?: ScrollViewProps['refreshControl'];

  /**
   * Alternate component to render pdf page. Default is PdfView.
   */
  renderComponent?: PdfComponent;
};

/**
 * Get a `Promise` that will resolve when the next frame can be rendered.
 */
function sleepToNextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Compute base dimensions at which the pdf should be displayed.
 */
function getViewDims(pdfSize: PageDim, viewSize: PageDim) {
  let viewWidth = viewSize.width;
  if (
    pdfSize.width > 0 &&
    pdfSize.height > pdfSize.width &&
    viewSize.height > viewWidth
  ) {
    // Portrait page on portrait device, shrink to fit.
    viewWidth = Math.min(
      viewWidth,
      (pdfSize.width * viewSize.height) / pdfSize.height
    );
  }

  let viewHeight = viewSize.height;
  if (pdfSize.width > 0) {
    viewHeight = (pdfSize.height * viewWidth) / pdfSize.width;
  }

  return { viewWidth, viewHeight };
}

/**
 * Bind an animated value for sync reads.
 */
function useSyncAnimatedXY() {
  const varXY = useRef({
    animated: new Animated.ValueXY({ x: 0, y: 0 }),
    static: { x: 0, y: 0 },
  }).current;
  // Enable sync read of animated variable.
  useEffect(() => {
    const { animated } = varXY;
    const handle = animated.addListener((value) => {
      varXY.static = value;
    });
    return () => {
      animated.removeListener(handle);
    };
  }, [varXY]);
  return varXY;
}

function useZoomGesture(
  pdfSize: PageDim,
  viewSize: PageDim,
  maxScale: number,
  hScrollRef: ScrollViewRef,
  vScrollRef: ScrollViewRef,
  onZoomIn: (() => void) | undefined,
  onZoomReset: (() => void) | undefined
) {
  // Limits.
  const minScale = 1;
  const overshoot = 0.1;
  const hardMinScale = minScale * (1 - overshoot);
  const hardMaxScale = maxScale * (1 + overshoot);

  const [isZoomed, setIsZoomed] = useState(false);

  const gestureRef = useRef<GestureType>();

  // Resolution to render.
  const containerScale = useRef({
    animated: new Animated.Value(1),
    static: 1,
  }).current;
  const pinchScale = useRef(new Animated.Value(1)).current;

  // Current scroll position.
  const contentOffset = useSyncAnimatedXY();

  // Centering buffers.
  const bufferSize = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  useEffect(() => {
    const { viewWidth, viewHeight } = getViewDims(pdfSize, viewSize);
    const width = Math.max(
      (viewSize.width - containerScale.static * viewWidth) / 2,
      0
    );
    const height = Math.max(
      viewSize.height - containerScale.static * viewHeight,
      0
    );

    bufferSize.setValue({ x: width, y: height });
  }, [bufferSize, containerScale, pdfSize, viewSize]);

  // Origin point of pinch gesture.
  const focalPoint = useSyncAnimatedXY();
  useEffect(() => {
    focalPoint.animated.setValue({
      x: viewSize.width / 2,
      y: viewSize.height / 2,
    });
  }, [focalPoint, viewSize]);

  // Pixel interpolation scale. Input driver `pinchScale` is shaped to allow
  // some bounce past min/max thresholds.
  // TODO: Is it possible to use easing instead of clamp? Or maybe more
  // points on in/out range?
  const scale = useRef(
    Animated.divide(
      Animated.multiply(pinchScale, containerScale.animated).interpolate({
        inputRange: [minScale * 0.5, minScale, maxScale, maxScale * 1.5],
        outputRange: [hardMinScale, minScale, maxScale, hardMaxScale],
        extrapolate: 'clamp',
      }),
      containerScale.animated
    )
  ).current;

  const gestureHandler = useMemo(() => {
    return Gesture.Pinch()
      .withRef(gestureRef)
      .onStart((e) =>
        focalPoint.animated.setValue({ x: e.focalX, y: e.focalY })
      )
      .onUpdate((e) => pinchScale.setValue(e.scale))
      .onEnd((e) => {
        // Spring back to scale bounds, if gesture overshot.
        const targetScale = Math.max(
          minScale,
          Math.min(maxScale, e.scale * containerScale.static)
        );

        Animated.timing(pinchScale, {
          duration: 200,
          toValue: targetScale / containerScale.static,
          useNativeDriver: false,
        }).start(async () => {
          const { viewWidth, viewHeight } = getViewDims(pdfSize, viewSize);
          const prevScale = containerScale.static;
          const prevBufferX = Math.max(
            (viewSize.width - prevScale * viewWidth) / 2,
            0
          );

          // Apply pinch scaling (pixel interpolation) to container (actual
          // render quality).
          containerScale.animated.setValue(targetScale);
          containerScale.static = targetScale;
          pinchScale.setValue(1);
          bufferSize.setValue({
            x: Math.max((viewSize.width - targetScale * viewWidth) / 2, 0),
            y: Math.max(viewSize.height - targetScale * viewHeight, 0),
          });

          // Send zoom events.
          setIsZoomed((prevIsZoomed) => {
            if (prevIsZoomed && targetScale <= 1) {
              if (Platform.OS === 'android') {
                // Zoom complete, reset horizontal scroll. Needed for Android.
                hScrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
              }
              if (onZoomReset != null) {
                onZoomReset();
              }
            } else if (!prevIsZoomed && targetScale > 1) {
              if (onZoomIn != null) {
                onZoomIn();
              }
            }
            return targetScale > 1;
          });

          if (targetScale > 1) {
            // Adjust scroll views to apply scaling in correct location.
            const targetX =
              (targetScale / prevScale) *
                (contentOffset.static.x - prevBufferX + focalPoint.static.x) -
              focalPoint.static.x;
            const targetY =
              (targetScale / prevScale) *
                (contentOffset.static.y + focalPoint.static.y) -
              focalPoint.static.y;

            await sleepToNextFrame();
            hScrollRef.current?.scrollTo({
              x: targetX,
              animated: false,
            });
            vScrollRef.current?.scrollTo({ y: targetY, animated: false });
          }
        });
      });
  }, [
    bufferSize,
    containerScale,
    contentOffset,
    focalPoint,
    hScrollRef,
    gestureRef,
    maxScale,
    onZoomIn,
    onZoomReset,
    pdfSize,
    pinchScale,
    setIsZoomed,
    vScrollRef,
    viewSize,
  ]);

  const zoomStyle: AnimatedStyle = useMemo(() => {
    const { viewWidth, viewHeight } = getViewDims(pdfSize, viewSize);

    const pdfViewWidth = Animated.multiply(containerScale.animated, viewWidth);
    const centerRatioX = Animated.divide(
      Animated.add(
        Animated.subtract(contentOffset.animated.x, bufferSize.x),
        focalPoint.animated.x
      ),
      pdfViewWidth
    );
    const translateX = Animated.multiply(
      Animated.multiply(pdfViewWidth, Animated.subtract(scale, 1)),
      Animated.subtract(0.5, centerRatioX)
    );

    const pdfViewHeight = Animated.multiply(
      containerScale.animated,
      viewHeight
    );
    const centerRatioY = Animated.divide(
      Animated.add(contentOffset.animated.y, focalPoint.animated.y),
      pdfViewHeight
    );
    const translateY = Animated.multiply(
      Animated.multiply(pdfViewHeight, Animated.subtract(scale, 1)),
      Animated.subtract(0.5, centerRatioY)
    );

    // Allow height to be manged by native pdf component.
    return {
      transform: [{ translateX }, { translateY }, { scale }],
      width: pdfViewWidth,
    };
  }, [
    bufferSize,
    contentOffset,
    containerScale,
    focalPoint,
    pdfSize,
    scale,
    viewSize,
  ]);

  return {
    bufferSize,
    contentOffset,
    gestureHandler,
    gestureRef,
    isZoomed,
    zoomStyle,
  };
}

/**
 * PdfView with pinch zoom support.
 */
export function ZoomPdfView(props: ZoomPdfViewProps) {
  const {
    maximumZoom,
    onLoadComplete,
    onZoomIn,
    onZoomReset,
    refreshControl,
    renderComponent,
    ...pdfViewProps
  } = props;

  const [pdfSize, setPdfSize] = useState({ width: -1, height: -1 });
  const [viewSize, setViewSize] = useState({ width: 1, height: 1 });

  const hScrollRef = useRef<typeof ScrollView>(null);
  const vScrollRef = useRef<typeof ScrollView>(null);

  const RenderComponent = renderComponent ?? PdfView;

  const {
    bufferSize,
    contentOffset,
    gestureHandler,
    gestureRef,
    isZoomed,
    zoomStyle,
  } = useZoomGesture(
    pdfSize,
    viewSize,
    maximumZoom ?? 2,
    hScrollRef,
    vScrollRef,
    onZoomIn,
    onZoomReset
  );

  // Combine `onLoadComplete` callback from props with logic required
  // by `ZoomPdfView`.
  const localOnLoadComplete = useCallback(
    (e: LoadCompleteEvent) => {
      onLoadComplete?.(e);
      const next = { width: e.width, height: e.height };
      setPdfSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next
      );
    },
    [onLoadComplete, setPdfSize]
  );

  // Determine device orientation and (useable) screen ratio.
  const onViewLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      const next = {
        width: nativeEvent.layout.width,
        height: nativeEvent.layout.height,
      };
      setViewSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next
      );
    },
    [setViewSize]
  );

  // `waitFor` required on Android, otherwise ScrollView overrides
  // pinch detection.
  // Horizontal `scrollEnabled` only when zoomed prevents conflict with
  // swipe between pages.
  return (
    <GestureDetector gesture={gestureHandler}>
      <View style={Styles.container} onLayout={onViewLayout}>
        <AnimatedScrollView
          horizontal={true}
          onScroll={Animated.event(
            [
              {
                nativeEvent: { contentOffset: { x: contentOffset.animated.x } },
              },
            ],
            { useNativeDriver: false }
          )}
          ref={hScrollRef}
          scrollEnabled={isZoomed}
          scrollEventThrottle={50}
          waitFor={Platform.select({ android: gestureRef })}
        >
          <AnimatedScrollView
            onScroll={Animated.event(
              [
                {
                  nativeEvent: {
                    contentOffset: { y: contentOffset.animated.y },
                  },
                },
              ],
              { useNativeDriver: false }
            )}
            ref={vScrollRef}
            refreshControl={refreshControl}
            scrollEventThrottle={50}
            waitFor={Platform.select({ android: gestureRef })}
          >
            <View style={Styles.row}>
              <Animated.View style={{ width: bufferSize.x }} />
              <Animated.View style={zoomStyle}>
                <RenderComponent
                  {...pdfViewProps}
                  onLoadComplete={localOnLoadComplete}
                />
              </Animated.View>
              <Animated.View style={{ width: bufferSize.x }} />
            </View>
            <Animated.View style={{ height: bufferSize.y }} />
          </AnimatedScrollView>
        </AnimatedScrollView>
      </View>
    </GestureDetector>
  );
}

const Styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row' },
});
