import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PdfViewer, { PdfView } from 'react-native-pdf-viewer';

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();

  React.useEffect(() => {
    PdfViewer.multiply(3, 7).then(setResult);
  }, []);

  return (
    <View style={styles.container}>
      <PdfView src="/data/user/0/com.example.reactnativepdfviewer/cache/sample.pdf" />
      <Text>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
