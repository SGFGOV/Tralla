import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVendorAuth } from '../../hooks/use-vendor-auth';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '@react-navigation/native';

// Form validation schema
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

const VendorLoginScreen = () => {
  const { login, isLoading } = useVendorAuth();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const navigation = useNavigation();
  const theme = useTheme();

  const handleLogin = async (values) => {
    try {
      await login(values.email, values.password);
      navigation.navigate('VendorDashboard');
    } catch (error) {
      // Error is already handled in the context with Toast
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#6b46c1', '#805ad5', '#9f7aea']}
        style={styles.gradientContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/tralla-logo-white.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Vendor Portal</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.title}>Vendor Login</Text>
            <Text style={styles.subtitle}>Sign in to manage your business</Text>

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={loginSchema}
              onSubmit={handleLogin}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.form}>
                  <TextInput
                    label="Email"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    disabled={isLoading}
                    error={touched.email && !!errors.email}
                    placeholderTextColor="#6b7280"
                    theme={{ colors: { primary: '#6b46c1' } }}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}

                  <TextInput
                    label="Password"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    style={[styles.input, styles.passwordInput]}
                    secureTextEntry={secureTextEntry}
                    disabled={isLoading}
                    error={touched.password && !!errors.password}
                    right={
                      <TextInput.Icon
                        name={secureTextEntry ? 'eye-off' : 'eye'}
                        onPress={() => setSecureTextEntry(!secureTextEntry)}
                        color="#6b46c1"
                      />
                    }
                    placeholderTextColor="#6b7280"
                    theme={{ colors: { primary: '#6b46c1' } }}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#6b46c1', '#805ad5']}
                      style={styles.buttonGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('VendorRegister')}
                disabled={isLoading}
              >
                <Text style={styles.footerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features list */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Vendor Features</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Text style={styles.featureIcon}>📅</Text>
                </View>
                <Text style={styles.featureText}>Manage Reservations</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Text style={styles.featureIcon}>🏷️</Text>
                </View>
                <Text style={styles.featureText}>Create Discount Codes</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Text style={styles.featureIcon}>📊</Text>
                </View>
                <Text style={styles.featureText}>View Analytics</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Text style={styles.featureIcon}>📝</Text>
                </View>
                <Text style={styles.featureText}>Update Business Info</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1a202c',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#f7fafc',
  },
  passwordInput: {
    marginBottom: 20,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#718096',
  },
  footerLink: {
    color: '#6b46c1',
    fontWeight: 'bold',
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default VendorLoginScreen;