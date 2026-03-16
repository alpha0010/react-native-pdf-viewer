import { useEffect, useState } from 'react';
import { Dirs, FileSystem } from 'react-native-file-access';
import { Pdf } from 'react-native-pdf-light';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

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

function SamplePdf() {
  const annotation = useAsset('annotation.json');
  const source = useAsset('sample.pdf');
  const insets = useSafeAreaInsets();

  return source == null ? null : (
    <Pdf
      annotation={annotation}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
      onError={console.warn}
      onLoadComplete={console.log}
      source={source}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SamplePdf />
    </SafeAreaProvider>
  );
}
