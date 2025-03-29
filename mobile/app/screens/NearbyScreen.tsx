import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import proximityManager, { NearbyUser as ProximityUser } from '../utils/proximityManager';
import CameraProximityView from '../components/CameraProximityView';

// Mock data for demo purposes - would come from API in production
const MOCK_NEARBY_USERS = [
  { id: 1, username: 'Alex', displayName: 'Alex', distance: 12, isOnline: true, detectionMethod: 'location' as const },
  { id: 2, username: 'Jordan', displayName: 'Jordan', distance: 25, isOnline: true, detectionMethod: 'location' as const },
  { id: 3, username: 'Taylor', displayName: 'Taylor', distance: 45, isOnline: false, detectionMethod: 'location' as const },
  { id: 4, username: 'Casey', displayName: 'Casey', distance: 60, isOnline: true, detectionMethod: 'nfc' as const },
  { id: 5, username: 'Morgan', displayName: 'Morgan', distance: 75, isOnline: false, detectionMethod: 'location' as const },
  { id: 6, username: 'Riley', displayName: 'Riley', distance: 90, isOnline: true, detectionMethod: 'multiple' as const },
  { id: 7, username: 'Jamie', displayName: 'Jamie', distance: 120, isOnline: true, detectionMethod: 'location' as const },
];

// Enhance mock data to match our ProximityUser interface
const ENHANCED_MOCK_USERS: ProximityUser[] = MOCK_NEARBY_USERS.map(user => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  distance: user.distance,
  detectionMethod: user.detectionMethod,
  lastSeen: new Date(),
  confidence: user.detectionMethod === 'multiple' ? 0.95 : user.detectionMethod === 'nfc' ? 0.9 : 0.7
}));

export default function NearbyScreen({ navigation }: any) {
  const [nearbyUsers, setNearbyUsers] = useState<ProximityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [proximityDetectionActive, setProximityDetectionActive] = useState(false);

  // Function to fetch nearby users
  const fetchNearbyUsers = async () => {
    try {
      setLoading(true);

      // If proximity detection is active, use that data
      if (proximityDetectionActive) {
        const users = proximityManager.getNearbyUsers();
        setNearbyUsers(users);
      } else {
        // Otherwise use mock data for demonstration
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNearbyUsers(ENHANCED_MOCK_USERS);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch nearby users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize proximity manager
  const initProximityManager = async () => {
    try {
      // In a real app, you would get the actual user ID
      const userId = 1; // Mock user ID for now
      
      const result = await proximityManager.init(userId, {
        refreshInterval: 5000, // 5 seconds
        minimumConfidence: 0.6,
      });

      if (result.success) {
        // Set up callback for when nearby users change
        proximityManager.setOnNearbyUsersChangedCallback((users) => {
          setNearbyUsers(users);
        });
        
        // Start proximity detection
        const started = await proximityManager.startDetection();
        setProximityDetectionActive(started);
      } else {
        console.error("Failed to initialize proximity manager:", result.error);
      }
    } catch (error) {
      console.error("Error initializing proximity manager:", error);
    }
  };

  // Initial data fetch and setup
  useEffect(() => {
    fetchNearbyUsers();
    
    // Initialize proximity manager
    initProximityManager();
    
    // Cleanup when component unmounts
    return () => {
      if (proximityDetectionActive) {
        proximityManager.cleanup();
      }
    };
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchNearbyUsers();
  };

  const handleUserPress = (user: ProximityUser) => {
    navigation.navigate('ProfileDetail', { id: user.id, name: user.displayName });
  };

  const handleChatPress = (user: ProximityUser) => {
    navigation.navigate('ChatDetail', { id: user.id, name: user.displayName });
  };

  const toggleCameraMode = () => {
    setCameraMode(!cameraMode);
  };

  // Handle selecting a user from camera view
  const handleCameraUserSelect = (user: ProximityUser) => {
    handleUserPress(user);
    setCameraMode(false);
  };

  // Get detection method icon
  const getDetectionMethodIcon = (method: string) => {
    switch (method) {
      case 'nfc':
        return <Ionicons name="radio" size={14} color="#fff" />;
      case 'camera':
        return <Ionicons name="videocam" size={14} color="#fff" />;
      case 'location':
        return <Ionicons name="location" size={14} color="#fff" />;
      case 'multiple':
        return <Ionicons name="checkmark-circle" size={14} color="#fff" />;
      default:
        return null;
    }
  };

  // Render each user card
  const renderUserItem = ({ item }: { item: ProximityUser }) => (
    <View style={styles.userCard}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => handleUserPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: item.confidence > 0.8 ? '#4ade80' : '#9ca3af' }
            ]}
          />
          {item.detectionMethod && (
            <View 
              style={[
                styles.methodBadge, 
                { backgroundColor: 
                  item.detectionMethod === 'nfc' ? '#3b82f6' : 
                  item.detectionMethod === 'camera' ? '#ec4899' : 
                  item.detectionMethod === 'multiple' ? '#8b5cf6' : 
                  '#f59e0b'
                }
              ]}
            >
              {getDetectionMethodIcon(item.detectionMethod)}
            </View>
          )}
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.displayName}</Text>
          <Text style={styles.distance}>{Math.round(item.distance || 0)}m away</Text>
          <View style={styles.confidenceBar}>
            <View 
              style={[
                styles.confidenceFill, 
                { width: `${Math.round(item.confidence * 100)}%` }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => handleChatPress(item)}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#6366f1" />
      </TouchableOpacity>
    </View>
  );

  // Render the camera mode
  const renderCameraMode = () => {
    if (!cameraMode) return null;

    return (
      <Modal
        visible={cameraMode}
        animationType="slide"
        onRequestClose={() => setCameraMode(false)}
      >
        <CameraProximityView 
          userId={1} // Use actual user ID in real app
          onClose={() => setCameraMode(false)}
          onUserSelect={handleCameraUserSelect}
        />
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>People Nearby</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={toggleCameraMode}
          >
            <Ionicons name="camera" size={24} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={28} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Finding people nearby...</Text>
        </View>
      ) : nearbyUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>No one nearby right now</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.cameraRefreshButton, { marginTop: 15 }]}
            onPress={toggleCameraMode}
          >
            <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.refreshButtonText}>Scan with Camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={nearbyUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
              colors={["#6366f1"]}
            />
          }
        />
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]}
          onPress={() => {}}
        >
          <Ionicons name="people" size={24} color="#6366f1" />
          <Text style={styles.activeNavText}>Nearby</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('ChatList')}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#6b7280" />
          <Text style={styles.navText}>Chats</Text>
        </TouchableOpacity>
      </View>
      
      {/* Camera Mode Modal */}
      {renderCameraMode()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraButton: {
    padding: 8,
    marginRight: 8,
  },
  cameraRefreshButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  methodBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: 4,
    backgroundColor: '#4ade80',
    borderRadius: 2,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeNavButton: {
    borderTopWidth: 2,
    borderTopColor: '#6366f1',
  },
  navText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  activeNavText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
});