import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image,
  ActivityIndicator, 
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Group type definition
interface Group {
  id: number;
  name: string;
  description: string;
  members: number;
  lastActivity: string;
  unread: number;
  hasActivity: boolean;
  hasExpense: boolean;
}

// Mock data for demo purposes - would come from API in production
const MOCK_GROUPS: Group[] = [
  {
    id: 1,
    name: 'Thursday Hiking Group',
    description: 'Weekly hiking adventures in the city',
    members: 8,
    lastActivity: '10:30 AM',
    unread: 3,
    hasActivity: true,
    hasExpense: true
  },
  {
    id: 2,
    name: 'Tech Meetup',
    description: 'Local tech enthusiasts and developers',
    members: 15,
    lastActivity: 'Yesterday',
    unread: 0,
    hasActivity: false,
    hasExpense: true
  },
  {
    id: 3,
    name: 'Book Club',
    description: 'Monthly book discussions',
    members: 6,
    lastActivity: 'Yesterday',
    unread: 1,
    hasActivity: true,
    hasExpense: false
  },
  {
    id: 4,
    name: 'Neighborhood Watch',
    description: 'Local community alerts and events',
    members: 24,
    lastActivity: '3/24/25',
    unread: 0,
    hasActivity: false,
    hasExpense: false
  },
];

export default function GroupsScreen({ navigation }: any) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock function to fetch groups
  const fetchGroups = async () => {
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for demonstration
      setGroups(MOCK_GROUPS);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchGroups();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  // Filter groups based on search query
  const filteredGroups = searchQuery
    ? groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups;

  // Handle creating a new group
  const handleCreateGroup = () => {
    // Navigate to create group screen
    navigation.navigate('CreateGroup');
  };

  // Handle group press
  const handleGroupPress = (groupId: number, groupName: string) => {
    navigation.navigate('GroupDetail', { id: groupId, name: groupName });
  };

  // Render group item
  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => handleGroupPress(item.id, item.name)}
    >
      <View style={styles.groupAvatar}>
        <Text style={styles.groupAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.lastActivity}>{item.lastActivity}</Text>
        </View>
        
        <Text 
          style={styles.groupDescription}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.description}
        </Text>
        
        <View style={styles.groupMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color="#6b7280" />
            <Text style={styles.metaText}>{item.members}</Text>
          </View>
          
          {item.hasActivity && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>Activity</Text>
            </View>
          )}
          
          {item.hasExpense && (
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>Expenses</Text>
            </View>
          )}
          
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
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={28} color="#6366f1" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateGroup}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {searchQuery ? "No groups match your search" : "No groups yet"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery 
              ? "Try a different search term"
              : "Create a group to connect with people nearby"
            }
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleCreateGroup}
            >
              <Text style={styles.emptyButtonText}>Create a Group</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGroupItem}
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
          style={styles.navButton}
          onPress={() => navigation.navigate('Chats')}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#6b7280" />
          <Text style={styles.navText}>Chats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]}
          onPress={() => {}}
        >
          <Ionicons name="people" size={24} color="#6366f1" />
          <Text style={styles.activeNavText}>Groups</Text>
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  groupItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupAvatarText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  lastActivity: {
    fontSize: 12,
    color: '#6b7280',
  },
  groupDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  unreadBadge: {
    backgroundColor: '#6366f1',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
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