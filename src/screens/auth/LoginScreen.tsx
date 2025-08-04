// src/screens/auth/LoginScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Alert,
  TextInput as RNTextInput,
} from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { Text } from '../../components/ui/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

// Animated Background Component
const AnimatedBackground = () => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: 30,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: -20,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.05,
              duration: 8000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -20,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 20,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.95,
              duration: 10000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: 0,
              duration: 7000,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: 7000,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 7000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const animation = createAnimation();
    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Main gradient background */}
      <LinearGradient
        colors={['#0f1419', '#1a1f2a', '#2c3e50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Secondary animated overlay */}
      <Animated.View
        style={[
          styles.gradientOverlay,
          {
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(121, 213, 233, 0.12)',
            'transparent',
            'rgba(77, 174, 172, 0.08)',
          ]}
          start={{ x: 0.3, y: 0.4 }}
          end={{ x: 0.7, y: 0.6 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Floating accent */}
      <Animated.View
        style={[
          styles.floatingAccent,
          {
            transform: [
              { translateX: translateX },
              { translateY: translateY },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(121, 213, 233, 0.1)',
            'rgba(121, 213, 233, 0.05)',
            'transparent',
          ]}
          style={styles.floatingGradient}
        />
      </Animated.View>
    </View>
  );
};

// Main Login Component
export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Invalid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert(
        'Login Failed',
        err.message || 'An error occurred during login'
      );
    }
  };

  const navigateToCustomerPortal = () => {
    // Navigate to customer portal - adjust route name as needed
    navigation.navigate('CustomerLogin');
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Login Card with Blur Effect */}
          <BlurView intensity={20} tint="dark" style={styles.loginCard}>
            <View style={styles.cardContent}>
              {/* Header Section */}
              <View style={styles.loginHeader}>
                <View style={styles.logoContainer}>
                  <Image
                    source={{ uri: '/logos/splitfinrow.png' }} // Replace with your actual logo
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.loginSubtitle}>Access your dashboard</Text>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorMessage}>
                  <Ionicons name="warning" size={20} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Form Section */}
              <View style={styles.form}>
                {/* Email Input */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      ref={emailRef}
                      mode="flat"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (validationErrors.email) {
                          setValidationErrors({ ...validationErrors, email: undefined });
                        }
                      }}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      editable={!isLoading}
                      style={[
                        styles.textInput,
                        validationErrors.email && styles.textInputError,
                      ]}
                      theme={{
                        colors: {
                          primary: '#79d5e9',
                          placeholder: '#9ca3af',
                          text: '#ffffff',
                          background: 'rgba(31, 41, 55, 0.8)',
                        },
                      }}
                    />
                  </View>
                  {validationErrors.email && (
                    <HelperText type="error" visible={true} style={styles.helperText}>
                      {validationErrors.email}
                    </HelperText>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      ref={passwordRef}
                      mode="flat"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (validationErrors.password) {
                          setValidationErrors({ ...validationErrors, password: undefined });
                        }
                      }}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      editable={!isLoading}
                      style={[
                        styles.textInput,
                        validationErrors.password && styles.textInputError,
                      ]}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                          iconColor="#9ca3af"
                        />
                      }
                      theme={{
                        colors: {
                          primary: '#79d5e9',
                          placeholder: '#9ca3af',
                          text: '#ffffff',
                          background: 'rgba(31, 41, 55, 0.8)',
                        },
                      }}
                    />
                  </View>
                  {validationErrors.password && (
                    <HelperText type="error" visible={true} style={styles.helperText}>
                      {validationErrors.password}
                    </HelperText>
                  )}
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#79d5e9', '#6bc7db']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.loginButtonGradient}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#0f1419" />
                        <Text style={styles.loginButtonText}>Signing In...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#0f1419" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Footer Section */}
              <View style={styles.loginFooter}>
                <Text style={styles.helpText}>
                  Need help? Contact your administrator for assistance.
                </Text>
                
                {/* Customer Portal Section */}
                <View style={styles.customerPortalSection}>
                  <Text style={styles.dividerText}>Are you a customer?</Text>
                  <TouchableOpacity
                    style={styles.customerPortalLink}
                    onPress={navigateToCustomerPortal}
                    activeOpacity={0.8}
                  >
                    <BlurView intensity={10} tint="dark" style={styles.customerPortalBlur}>
                      <Text style={styles.customerPortalText}>
                        Go to Customer Portal →
                      </Text>
                    </BlurView>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: height,
  },
  gradientOverlay: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    top: -height * 0.25,
    left: -width * 0.25,
  },
  floatingAccent: {
    position: 'absolute',
    top: height * 0.2,
    right: width * 0.15,
    width: Math.min(300, width * 0.3),
    height: Math.min(300, width * 0.3),
  },
  floatingGradient: {
    flex: 1,
    borderRadius: 150,
  },
  loginCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(121, 213, 233, 0.2)',
  },
  cardContent: {
    padding: 32,
    backgroundColor: 'rgba(26, 31, 42, 0.95)',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoImage: {
    width: 120,
    height: 48,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    fontWeight: '500',
    opacity: 0.9,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  form: {
    gap: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 56,
  },
  textInputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  helperText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    borderRadius: 14,
    marginTop: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: 'rgba(121, 213, 233, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  loginButtonDisabled: {
    opacity: 0.8,
    elevation: 4,
    shadowOpacity: 0.6,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f1419',
  },
  loginFooter: {
    marginTop: 32,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  customerPortalSection: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(121, 213, 233, 0.2)',
    width: '100%',
  },
  dividerText: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 16,
  },
  customerPortalLink: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(121, 213, 233, 0.3)',
  },
  customerPortalBlur: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(121, 213, 233, 0.1)',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerPortalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#79d5e9',
  },
});