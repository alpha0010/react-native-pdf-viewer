import React, { useEffect, useState } from 'react';
import { Dirs, FileSystem } from 'react-native-file-access';
import { Pdf } from 'react-native-pdf-light';

export default function App() {
  const [source, setSource] = useState<string | null>(null);
  useEffect(() => {
    const asset = 'sample.pdf';
    const dest = `${Dirs.CacheDir}/${asset}`;
    FileSystem.cpAsset(asset, dest)
      .catch(() => {}) // Ignore errors.
      .finally(() => setSource(dest));
  }, [setSource]);

  return source == null ? null : (
    <Pdf onError={console.warn} onLoadComplete={console.log} source={source} />
  );
}
