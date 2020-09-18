import React, { useEffect, useState } from 'react';
import { Pdf, PdfUtil } from 'react-native-pdf-light';

export default function App() {
  const [source, setSource] = useState<string | null>(null);
  useEffect(() => {
    PdfUtil.unpackAsset('sample.pdf').then(setSource);
  }, [setSource]);

  return source == null ? null : <Pdf source={source} />;
}
