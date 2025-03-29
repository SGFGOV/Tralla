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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for demo purposes - would come from API in production
const MOCK_NEARBY_USERS = [
  { id: 1, username: 'Alex', distance: 12, isOnline: true },
  { id: 2, username: 'Jordan', distance: 25, isOnline: true },
  { id: 3, username: 'Taylor', distance: 45, isOnline: false },
  { id: 4, username: 'Casey', distance: 60, isOnline: true },
  { id: 5, username: 'Morgan', distance: 75, isOnline: false },
  { id: 6, username: 'Riley', distance: 90, isOnline: true },
  { id: 7, username: 'Jamie', distance: 120, isOnline: true },
];

export default function NearbyScreen({ navigation }: any) {
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock function to fetch nearby users
  const fetchNearbyUsers = async () => {
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for demonstration
      setNearbyUsers(MOCK_NEARBY_USERS);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch nearby users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchNearbyUsers();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchNearbyUsers();
  };

  const handleUserPress = (userId: number, username: string) => {
    navigation.navigate('ProfileDetail', { id: userId, name: username });
  };

  const handleChatPress = (userId: number, username: string) => {
    navigation.navigate('ChatDetail', { id: userId, name: username });
  };

  // Render each user card
  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => handleUserPress(item.id, item.username)}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: item.isOnline ? '#4ade80' : '#9ca3af' }
            ]} 
          />
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.distance}>{item.distance}m away</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => handleChatPress(item.id, item.username)}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#6366f1" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>People Nearby</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={28} color="#6366f1" />
        </TouchableOpacity>
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