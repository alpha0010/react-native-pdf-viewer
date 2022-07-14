// Partial type definitions import from react-native-gesture-handler@2.x
// Avoids creating a package dependency on the library.

declare module 'react-native-gesture-handler' {
  import type {
    ScrollView as RNScrollView,
    ScrollViewProps as RNScrollViewProps,
  } from 'react-native';

  type CommonGestureConfig = {
    enabled?: boolean;
    shouldCancelWhenOutside?: boolean;
    hitSlop?: HitSlop;
  };

  type BaseGestureHandlerProps<
    ExtraEventPayloadT extends Record<string, unknown> = Record<string, unknown>
  > = CommonGestureConfig & {
    id?: string;
    waitFor?: React.Ref<unknown> | React.Ref<unknown>[];
    simultaneousHandlers?: React.Ref<unknown> | React.Ref<unknown>[];
    testID?: string;
    cancelsTouchesInView?: boolean;
    onBegan?: (event: HandlerStateChangeEvent) => void;
    onFailed?: (event: HandlerStateChangeEvent) => void;
    onCancelled?: (event: HandlerStateChangeEvent) => void;
    onActivated?: (event: HandlerStateChangeEvent) => void;
    onEnded?: (event: HandlerStateChangeEvent) => void;
    onGestureEvent?: (event: GestureEvent<ExtraEventPayloadT>) => void;
    onHandlerStateChange?: (
      event: HandlerStateChangeEvent<ExtraEventPayloadT>
    ) => void;
    children?: React.ReactNode;
  };

  type NativeViewGestureHandlerPayload = {
    /**
     * True if gesture was performed inside of containing view, false otherwise.
     */
    pointerInside: boolean;
  };

  interface NativeViewGestureConfig {
    /**
     * Android only.
     *
     * Determines whether the handler should check for an existing touch event on
     * instantiation.
     */
    shouldActivateOnStart?: boolean;
    /**
     * When `true`, cancels all other gesture handlers when this
     * `NativeViewGestureHandler` receives an `ACTIVE` state event.
     */
    disallowInterruption?: boolean;
  }

  interface NativeViewGestureHandlerProps
    extends BaseGestureHandlerProps<NativeViewGestureHandlerPayload>,
      NativeViewGestureConfig {}

  export declare const ScrollView: React.ForwardRefExoticComponent<
    RNScrollViewProps &
      NativeViewGestureHandlerProps &
      React.RefAttributes<React.ComponentType<any>>
  > &
    RNScrollView;

  declare const State: {
    readonly UNDETERMINED: 0;
    readonly FAILED: 1;
    readonly BEGAN: 2;
    readonly CANCELLED: 3;
    readonly ACTIVE: 4;
    readonly END: 5;
  };

  interface GestureEventPayload {
    handlerTag: number;
    numberOfPointers: number;
    state: ValueOf<typeof State>;
  }

  type GestureUpdateEvent<GestureEventPayloadT = Record<string, unknown>> =
    GestureEventPayload & GestureEventPayloadT;

  declare abstract class BaseGesture<
    EventPayloadT extends Record<string, unknown>
  > extends Gesture {
    private gestureId;
    handlerTag: number;
    handlerName: string;
    config: BaseGestureConfig;
    handlers: HandlerCallbacks<EventPayloadT>;
    constructor();
    private addDependency;
    withRef(ref: React.MutableRefObject<GestureType | undefined>): this;
    protected isWorklet(callback: Function): boolean;
    onBegin(
      callback: (event: GestureStateChangeEvent<EventPayloadT>) => void
    ): this;
    onStart(
      callback: (event: GestureStateChangeEvent<EventPayloadT>) => void
    ): this;
    onEnd(
      callback: (
        event: GestureStateChangeEvent<EventPayloadT>,
        success: boolean
      ) => void
    ): this;
    onFinalize(
      callback: (
        event: GestureStateChangeEvent<EventPayloadT>,
        success: boolean
      ) => void
    ): this;
    onTouchesDown(callback: TouchEventHandlerType): this;
    onTouchesMove(callback: TouchEventHandlerType): this;
    onTouchesUp(callback: TouchEventHandlerType): this;
    onTouchesCancelled(callback: TouchEventHandlerType): this;
    enabled(enabled: boolean): this;
    shouldCancelWhenOutside(value: boolean): this;
    hitSlop(hitSlop: HitSlop): this;
    runOnJS(runOnJS: boolean): this;
    simultaneousWithExternalGesture(
      ...gestures: Exclude<GestureRef, number>[]
    ): this;
    requireExternalGestureToFail(
      ...gestures: Exclude<GestureRef, number>[]
    ): this;
    withTestId(id: string): this;
    cancelsTouchesInView(value: boolean): this;
    initialize(): void;
    toGestureArray(): GestureType[];
    prepare(): void;
    get shouldUseReanimated(): boolean;
  }

  declare abstract class ContinousBaseGesture<
    EventPayloadT extends Record<string, unknown>,
    EventChangePayloadT extends Record<string, unknown>
  > extends BaseGesture<EventPayloadT> {
    onUpdate(
      callback: (event: GestureUpdateEvent<EventPayloadT>) => void
    ): this;
    onChange(
      callback: (
        event: GestureUpdateEvent<EventPayloadT & EventChangePayloadT>
      ) => void
    ): this;
    manualActivation(manualActivation: boolean): this;
  }

  type PinchGestureHandlerEventPayload = {
    /**
     * The scale factor relative to the points of the two touches in screen
     * coordinates.
     */
    scale: number;
    /**
     * Position expressed in points along X axis of center anchor point of
     * gesture.
     */
    focalX: number;
    /**
     * Position expressed in points along Y axis of center anchor point of
     * gesture.
     */
    focalY: number;
    /**
     *
     * Velocity of the pan gesture the current moment. The value is expressed in
     * point units per second.
     */
    velocity: number;
  };

  type PinchGestureChangeEventPayload = {
    scaleChange: number;
  };

  declare class PinchGesture extends ContinousBaseGesture<
    PinchGestureHandlerEventPayload,
    PinchGestureChangeEventPayload
  > {
    constructor();
    onChange(
      callback: (
        event: GestureUpdateEvent<
          PinchGestureHandlerEventPayload & PinchGestureChangeEventPayload
        >
      ) => void
    ): this;
  }

  export declare const Gesture: {
    Pinch: () => PinchGesture;
  };

  interface GestureDetectorProps {
    gesture?: ComposedGesture | GestureType;
    children?: React.ReactNode;
  }

  export declare const GestureDetector: (
    props: GestureDetectorProps
  ) => JSX.Element;

  export type GestureType =
    | BaseGesture<Record<string, unknown>>
    | BaseGesture<Record<string, never>>
    | BaseGesture<TapGestureHandlerEventPayload>
    | BaseGesture<PanGestureHandlerEventPayload>
    | BaseGesture<LongPressGestureHandlerEventPayload>
    | BaseGesture<RotationGestureHandlerEventPayload>
    | BaseGesture<PinchGestureHandlerEventPayload>
    | BaseGesture<FlingGestureHandlerEventPayload>
    | BaseGesture<ForceTouchGestureHandlerEventPayload>
    | BaseGesture<NativeViewGestureHandlerPayload>;
}
