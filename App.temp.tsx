// Temporary file to bypass Firebase imports during config
// This is just for EAS to read the config

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Splitfin Mobile</Text>
      <StatusBar style="auto" />
    </View>
  );
}
