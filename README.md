# react-native-pdf-light

[![npm version](https://badge.fury.io/js/react-native-pdf-light.svg)](https://www.npmjs.com/package/react-native-pdf-light)

PDF viewer for React Native. Implemented with platform native render functions
for smallest deploy size impact, and restricted feature set to simplify
integration with larger systems.

Includes prefabricated full document viewer based on `FlatList` and a single
page render component to use as a building block for your own fully custom
viewer.

Uses `android.graphics.pdf.PdfRenderer` on Android and `CGPDFDocument` on iOS.
Unlike many native components in the wild, `react-native-pdf-light` provides
full implementation of React Native shadow nodes. This simplifies UI
development, since the component actually knows its own dimensions.

## Installation

```sh
npm install react-native-pdf-light
```

## Usage

```js
import { Pdf, PdfUtil } from 'react-native-pdf-light';

PdfUtil.getPageCount(source).then(console.log);

<Pdf source={source} />
```

#### `<Pdf ... />` Display a pdf.

Props:
- `onError: (error: Error) => void`
  - Optional: Callback to handle errors.
- `onLoadComplete: (numberOfPages: number) => void`
  - Optional: Callback to handle pdf load completion.
  - Passed the page count of the loaded pdf.
- `onMeasurePages: (measurements: { itemHeight: number, offset: number }[]) => void`
  - Optional: Callback to receive layout details of all pages.
- `source: string`
  - Document to display.

The following props are forwarded to the underlying
[`FlatList`](https://reactnative.dev/docs/flatlist) component:
- `initialScrollIndex`
- `ListEmptyComponent`
- `onMomentumScrollBegin`
- `onMomentumScrollEnd`
- `onScroll`
- `onScrollBeginDrag`
- `onScrollEndDrag`
- `scrollEventThrottle`

Methods:
- `scrollToIndex(index: number): void`
  - Scroll to the specified page (0-indexed).
- `scrollToOffset(offset: number): void`
  - Scroll to the specified offset.

#### `<PdfView ... />` Single page of a pdf.

Props:
- `page: number`
  - Page (0-indexed) of document to display.
- `source: string`
  - Document to display.
- `style: ViewStyle`
  - Optional: View stylesheet.

#### `PdfUtil` Utility functions.

`PdfUtil.getPageCount(source: string): Promise<number>`
- Get the number of pages of a pdf.

`PdfUtil.getPageSizes(source: string): Promise<{ height: number; width: number }[]>`
- Get the dimensions of every page.

`PdfUtil.unpackAsset(source: string): Promise<string>`
- Extract a bundled asset and return its absolute path.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
