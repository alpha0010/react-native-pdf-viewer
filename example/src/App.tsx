import React, { useEffect, useState } from 'react';
import { Dirs, FileSystem } from 'react-native-file-access';
import { Pdf } from 'react-native-pdf-light';

function useAsset(asset: string) {
  const [path, setPath] = useState<string | undefined>(undefined);
  useEffect(() => {
    const dest = `${Dirs.CacheDir}/${asset}`;
    FileSystem.cpAsset(asset, dest)
      .catch(() => {}) // Ignore errors.
      .finally(() => setPath(dest));
  }, [asset, setPath]);

  return path;
}

export default function App() {
  const annotation = useAsset('annotation.json');
  const source = useAsset('sample.pdf');

  return source == null ? null : (
    <Pdf
      annotation={annotation}
      onError={console.warn}
      onLoadComplete={console.log}
      source={source}
    />
  );
}
