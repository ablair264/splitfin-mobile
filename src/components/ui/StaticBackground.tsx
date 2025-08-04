import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface StaticBackgroundProps {
  children: React.ReactNode;
  edges?: 'none' | 'all';
}

export const StaticBackground: React.FC<StaticBackgroundProps> = ({ 
  children, 
  edges = 'none' 
}) => {
  const containerStyle = edges === 'all' ? styles.edgeToEdgeContainer : styles.container;

  return (
    <View style={containerStyle}>
      {/* Main gradient background - matching web masterlayout.css */}
      <LinearGradient
        colors={['#1a1f2a', '#2c3e50', '#34495e']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Secondary static overlay */}
      <View style={styles.gradientOverlay}>
        <LinearGradient
          colors={[
            'rgba(121, 213, 233, 0.06)',
            'transparent',
            'rgba(77, 174, 172, 0.04)',
          ]}
          start={{ x: 0.3, y: 0.4 }}
          end={{ x: 0.7, y: 0.6 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Static floating accent */}
      <View style={styles.floatingAccent}>
        <LinearGradient
          colors={[
            'rgba(121, 213, 233, 0.05)',
            'rgba(121, 213, 233, 0.025)',
            'transparent',
          ]}
          style={styles.floatingGradient}
        />
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2a', // Match web gradient start color
  },
  edgeToEdgeContainer: {
    flex: 1,
    backgroundColor: '#1a1f2a', // Match web gradient start color
    marginTop: -50, // Goes behind status bar
    paddingTop: 50,
  },
  gradientOverlay: {
    position: 'absolute',
    width: width * 1.2,
    height: height * 1.2,
    top: -height * 0.1,
    left: -width * 0.1,
  },
  floatingAccent: {
    position: 'absolute',
    top: height * 0.15,
    right: width * 0.1,
    width: Math.min(200, width * 0.25),
    height: Math.min(200, width * 0.25),
  },
  floatingGradient: {
    flex: 1,
    borderRadius: 100,
  },
});