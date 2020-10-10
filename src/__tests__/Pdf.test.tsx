import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Pdf } from '../Pdf';
import { PdfUtil } from '../PdfUtil';

jest.mock('../PdfUtil');
const MockPdfUtil = PdfUtil as jest.Mocked<typeof PdfUtil>;

function promisify(cb: jest.Mock) {
  return new Promise((resolve) => cb.mockImplementationOnce(resolve));
}

test('renders pdf viewer', async () => {
  MockPdfUtil.getPageSizes.mockImplementationOnce(() =>
    Promise.resolve([
      { height: 1, width: 1 },
      { height: 1, width: 1 },
    ])
  );
  const onLoadComplete = jest.fn();
  const loadCompletePromise = promisify(onLoadComplete);

  const { toJSON } = render(
    <Pdf onLoadComplete={onLoadComplete} source="test.pdf" />
  );

  expect(toJSON()).toMatchSnapshot();

  await act(async () => await loadCompletePromise);
  expect(onLoadComplete).toHaveBeenCalledWith(2);
});

test('pdf viewer load error', async () => {
  MockPdfUtil.getPageSizes.mockImplementationOnce(() => Promise.reject());
  const onError = jest.fn();
  const errorPromise = promisify(onError);
  const onLoadComplete = jest.fn();
  const loadCompletePromise = promisify(onLoadComplete);

  render(
    <Pdf onError={onError} onLoadComplete={onLoadComplete} source="test.pdf" />
  );

  await act(
    async () => await Promise.race([errorPromise, loadCompletePromise])
  );
  expect(onError).toHaveBeenCalled();
  expect(onLoadComplete).not.toHaveBeenCalled();
});

async function getRenderedViewer() {
  MockPdfUtil.getPageSizes.mockImplementationOnce(() =>
    Promise.resolve([
      { height: 400, width: 300 },
      { height: 400, width: 300 },
    ])
  );
  const onLoadComplete = jest.fn();
  const loadCompletePromise = promisify(onLoadComplete);
  const result = render(
    <Pdf onLoadComplete={onLoadComplete} source="test.pdf" />
  );
  await act(async () => await loadCompletePromise);
  return result;
}

test('viewer renders pages', async () => {
  const { getByTestId } = await getRenderedViewer();
  const flatList = getByTestId('pdfFlatList');

  const { toJSON } = render(flatList.props.renderItem({ index: 0 }));

  expect(toJSON()).toMatchSnapshot();
});

test('viewer computes layout', async () => {
  const { getByTestId } = await getRenderedViewer();
  const flatList = getByTestId('pdfFlatList');
  const pageDimsData = [
    { height: 400, width: 300 },
    { height: 400, width: 300 },
  ];

  expect(flatList.props.data).toEqual([]);

  act(() =>
    flatList.props.onLayout({
      nativeEvent: { layout: { height: 1000, width: 600 } },
    })
  );

  expect(flatList.props.data).toEqual(pageDimsData);
  expect(flatList.props.getItemLayout(pageDimsData, 1)).toEqual({
    index: 1,
    length: 800,
    offset: 808,
  });
});

test('viewer measures pages', async () => {
  MockPdfUtil.getPageSizes.mockImplementationOnce(() =>
    Promise.resolve([
      { height: 400, width: 300 },
      { height: 400, width: 300 },
      { height: 300, width: 150 },
    ])
  );
  const onMeasurePages = jest.fn();
  const measurePagesPromise = promisify(onMeasurePages);

  const { getByTestId } = render(
    <Pdf onMeasurePages={onMeasurePages} source="test.pdf" />
  );
  const flatList = getByTestId('pdfFlatList');

  act(() =>
    flatList.props.onLayout({
      nativeEvent: { layout: { height: 1000, width: 600 } },
    })
  );

  await act(async () => await measurePagesPromise);
  expect(onMeasurePages).toHaveBeenCalledWith([
    { itemHeight: 800, offset: 0 },
    { itemHeight: 800, offset: 808 },
    { itemHeight: 1200, offset: 1616 },
  ]);
});
