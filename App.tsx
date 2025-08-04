// App.tsx
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';

export default function App() {
  useEffect(() => {
    // Force default text properties globally
    const initialDefaultProps = Text.defaultProps || {};
    Text.defaultProps = {
      ...initialDefaultProps,
      style: [
        {
          color: '#FFFFFF', // Force white color globally
          fontSize: 16, // Always set fontSize
          lineHeight: 24, // CRITICAL: Always set lineHeight
          minHeight: 24, // CRITICAL: Always set minHeight
        },
        initialDefaultProps.style,
      ],
      allowFontScaling: false, // Prevent scaling issues
    };
    
    // Cleanup
    return () => {
      Text.defaultProps = initialDefaultProps;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <StatusBar style="light" />
          <RootNavigator />
          <Toast />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
