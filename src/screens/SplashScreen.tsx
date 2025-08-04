// src/screens/SplashScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressLoader } from '../components/ui';
import { theme } from '../theme';

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <ProgressLoader
        progress={progress}
        message="Loading Splitfin..."
        messages={[
          "Loading Splitfin...",
          "Connecting to services...",
          "Preparing your dashboard...",
          "Almost ready..."
        ]}
        size={120}
        fullscreen={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});
