import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for demo purposes - would come from API in production
const MOCK_CHATS = [
  { 
    id: 1, 
    userId: 1,
    username: 'Alex', 
    lastMessage: 'Hey, are you coming to the event tonight?', 
    timestamp: '10:30 AM',
    unread: 2,
    isOnline: true 
  },
  { 
    id: 2, 
    userId: 2,
    username: 'Jordan', 
    lastMessage: 'That sounds great! Send me the details', 
    timestamp: 'Yesterday',
    unread: 0,
    isOnline: false 
  },
  { 
    id: 3, 
    userId: 3,
    username: 'Taylor', 
    lastMessage: 'Did you see the new restaurant that opened nearby?', 
    timestamp: 'Yesterday',
    unread: 1,
    isOnline: true 
  },
  { 
    id: 4, 
    userId: 4,
    username: 'Casey', 
    lastMessage: 'Check out this new place I found!', 
    timestamp: '3/24/25',
    unread: 0,
    isOnline: false 
  },
];

export default function ChatListScreen({ navigation }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock function to fetch chats
  const fetchChats = async () => {
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for demonstration
      setChats(MOCK_CHATS);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchChats();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const handleChatPress = (userId: number, username: string) => {
    navigation.navigate('ChatDetail', { id: userId, name: username });
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return timestamp;
  };

  // Render each chat item
  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item.userId, item.username)}
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
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text 
            style={[
              styles.lastMessage,
              item.unread > 0 && styles.unreadMessage
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.lastMessage}
          </Text>
          
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
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
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Connect with people nearby to start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChatItem}
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
          style={styles.navButton}
          onPress={() => navigation.navigate('Nearby')}
        >
          <Ionicons name="people-outline" size={24} color="#6b7280" />
          <Text style={styles.navText}>Nearby</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]}
          onPress={() => {}}
        >
          <Ionicons name="chatbubbles" size={24} color="#6366f1" />
          <Text style={styles.activeNavText}>Chats</Text>
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  list: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
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
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#6366f1',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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