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
