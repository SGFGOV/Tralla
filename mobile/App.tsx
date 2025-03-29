import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';
import NearbyScreen from './app/screens/NearbyScreen';
import ChatListScreen from './app/screens/ChatListScreen';
import ChatDetailScreen from './app/screens/ChatDetailScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import ProfileDetailScreen from './app/screens/ProfileDetailScreen';

// Create stack navigator
const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Nearby" component={NearbyScreen} />
          <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats' }} />
          <Stack.Screen 
            name="ChatDetail" 
            component={ChatDetailScreen} 
            options={({ route }) => ({ title: route.params?.name || 'Chat' })} 
          />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
          <Stack.Screen 
            name="ProfileDetail" 
            component={ProfileDetailScreen} 
            options={({ route }) => ({ title: route.params?.name || 'Profile' })} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}