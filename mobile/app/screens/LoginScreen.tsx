import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      // This would be replaced with an actual API call
      // const response = await fetch('http://your-api-url/api/auth/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ username, password }),
      // });

      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes only - in production, validate with real API:
      if (username === 'demo' && password === 'password') {
        // Success - Navigate to main app
        navigation.replace('Nearby');
      } else {
        // Auth failed
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.formContainer}>
        <Text style={styles.title}>Tralla</Text>
        <Text style={styles.subtitle}>Connect with vibes nearby</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  input: {
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  registerLink: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});