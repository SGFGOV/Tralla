import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Types for our data
interface Member {
  id: number;
  name: string;
  isOnline: boolean;
  role: 'admin' | 'member';
}

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  text: string;
  timestamp: string;
}

interface Activity {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  participants: number;
  going: number;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  date: string;
  paidBy: string;
  settled: boolean;
  participants: number;
  paid: number;
}

interface GroupDetails {
  id: number;
  name: string;
  description: string;
  created: string;
  members: Member[];
  messages: Message[];
  activities: Activity[];
  expenses: Expense[];
}

// Mock data for demo purposes - would come from API in production
const MOCK_GROUP_DETAILS: GroupDetails = {
  id: 1,
  name: 'Thursday Hiking Group',
  description: 'Weekly hiking adventures in the city parks and surrounding trails. All experience levels welcome!',
  created: 'March 15, 2025',
  members: [
    { id: 1, name: 'Alex', isOnline: true, role: 'admin' },
    { id: 2, name: 'Jordan', isOnline: false, role: 'member' },
    { id: 3, name: 'Taylor', isOnline: true, role: 'member' },
    { id: 4, name: 'Casey', isOnline: false, role: 'member' },
    { id: 5, name: 'Morgan', isOnline: true, role: 'member' },
    { id: 6, name: 'Riley', isOnline: false, role: 'member' },
    { id: 7, name: 'Quinn', isOnline: true, role: 'member' },
    { id: 8, name: 'Jamie', isOnline: false, role: 'member' }
  ],
  messages: [
    { 
      id: 1, 
      senderId: 1, 
      senderName: 'Alex', 
      text: 'Hi everyone! Looking forward to our hike this Thursday.',
      timestamp: '10:30 AM' 
    },
    { 
      id: 2, 
      senderId: 3, 
      senderName: 'Taylor', 
      text: 'Same here! Which trail are we doing this week?',
      timestamp: '10:45 AM' 
    },
    { 
      id: 3, 
      senderId: 1, 
      senderName: 'Alex', 
      text: 'I was thinking Evergreen Trail. It should be about 5 miles round trip. Moderate difficulty.',
      timestamp: '11:00 AM' 
    },
    { 
      id: 4, 
      senderId: 5, 
      senderName: 'Morgan', 
      text: "That sounds perfect! What time are we meeting?",
      timestamp: '11:15 AM' 
    },
    { 
      id: 5, 
      senderId: 1, 
      senderName: 'Alex', 
      text: '9 AM at the trailhead. I created an activity with all the details!',
      timestamp: '11:30 AM' 
    }
  ],
  activities: [
    {
      id: 1,
      title: 'Evergreen Trail Hike',
      date: 'March 30, 2025',
      time: '9:00 AM - 12:00 PM',
      location: 'Evergreen Park Trailhead',
      participants: 8,
      going: 5
    },
    {
      id: 2,
      title: 'Post-Hike Brunch',
      date: 'March 30, 2025',
      time: '12:30 PM - 2:00 PM',
      location: 'Sunny Side Cafe',
      participants: 8,
      going: 4
    }
  ],
  expenses: [
    {
      id: 1,
      title: 'Trail Parking Passes',
      amount: 40,
      date: 'March 23, 2025',
      paidBy: 'Alex',
      settled: false,
      participants: 8,
      paid: 3
    },
    {
      id: 2,
      title: 'Water and Snacks',
      amount: 32.50,
      date: 'March 16, 2025',
      paidBy: 'Taylor',
      settled: true,
      participants: 8,
      paid: 8
    }
  ]
};

export default function GroupDetailScreen({ route, navigation }: any) {
  const { id, name } = route.params;
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(true);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);

  // Mock function to fetch group details
  const fetchGroupDetails = async () => {
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for demonstration
      setGroupDetails(MOCK_GROUP_DETAILS);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const renderMembers = () => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({groupDetails?.members.length || 0})</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={groupDetails?.members.slice(0, 5)}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{item.name.charAt(0)}</Text>
                <View 
                  style={[
                    styles.onlineIndicator,
                    { backgroundColor: item.isOnline ? '#4ade80' : '#9ca3af' }
                  ]}
                />
              </View>
              <Text style={styles.memberName}>{item.name}</Text>
              {item.role === 'admin' && (
                <Text style={styles.adminBadge}>Admin</Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.membersList}
        />
      </View>
    );
  };

  const renderMessages = () => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Messages</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={groupDetails?.messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.messageItem}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageSender}>{item.senderName}</Text>
                <Text style={styles.messageTime}>{item.timestamp}</Text>
              </View>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={styles.messagesList}
        />
      </View>
    );
  };

  const renderActivities = () => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Activities</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateActivity', { groupId: id })}
          >
            <Ionicons name="add" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        {groupDetails?.activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No upcoming activities</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateActivity', { groupId: id })}
            >
              <Text style={styles.createButtonText}>Create Activity</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={groupDetails?.activities}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.activityCard}
                onPress={() => navigation.navigate('ActivityDetail', { id: item.id })}
              >
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                </View>
                <View style={styles.activityDetail}>
                  <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                  <Text style={styles.activityDetailText}>{item.date}</Text>
                </View>
                <View style={styles.activityDetail}>
                  <Ionicons name="time-outline" size={16} color="#6366f1" />
                  <Text style={styles.activityDetailText}>{item.time}</Text>
                </View>
                <View style={styles.activityDetail}>
                  <Ionicons name="location-outline" size={16} color="#6366f1" />
                  <Text style={styles.activityDetailText}>{item.location}</Text>
                </View>
                <View style={styles.activityFooter}>
                  <Text style={styles.activityParticipants}>
                    {item.going}/{item.participants} going
                  </Text>
                  <TouchableOpacity style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Join</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.activitiesList}
          />
        )}
      </View>
    );
  };

  const renderExpenses = () => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateExpense', { groupId: id })}
          >
            <Ionicons name="add" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        {groupDetails?.expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No expenses yet</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateExpense', { groupId: id })}
            >
              <Text style={styles.createButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={groupDetails?.expenses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.expenseItem}
                onPress={() => navigation.navigate('ExpenseDetail', { id: item.id })}
              >
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{item.title}</Text>
                  <Text style={styles.expenseDate}>{item.date}</Text>
                  <View style={styles.expenseDetail}>
                    <Text style={styles.expensePaidBy}>Paid by {item.paidBy}</Text>
                    <Text style={styles.expenseSettlement}>
                      {item.paid}/{item.participants} paid
                    </Text>
                  </View>
                </View>
                <View style={styles.expenseAmount}>
                  <Text style={styles.expenseAmountText}>${item.amount.toFixed(2)}</Text>
                  <View 
                    style={[
                      styles.expenseStatus,
                      { backgroundColor: item.settled ? '#4ade80' : '#f59e0b' }
                    ]}
                  >
                    <Text style={styles.expenseStatusText}>
                      {item.settled ? 'Settled' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.expensesList}
          />
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <>
            {renderMembers()}
            {renderMessages()}
          </>
        );
      case 'activities':
        return renderActivities();
      case 'expenses':
        return renderExpenses();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#6366f1" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{groupDetails?.name || name}</Text>
          <Text style={styles.headerSubtitle}>
            {groupDetails?.members.length || 0} members
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('GroupSettings', { id })}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Ionicons 
            name={activeTab === 'chat' ? "chatbubbles" : "chatbubbles-outline"} 
            size={20} 
            color={activeTab === 'chat' ? "#6366f1" : "#6b7280"} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'chat' && styles.activeTabText
            ]}
          >
            Chat
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
          onPress={() => setActiveTab('activities')}
        >
          <Ionicons 
            name={activeTab === 'activities' ? "calendar" : "calendar-outline"} 
            size={20} 
            color={activeTab === 'activities' ? "#6366f1" : "#6b7280"} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'activities' && styles.activeTabText
            ]}
          >
            Activities
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Ionicons 
            name={activeTab === 'expenses' ? "cash" : "cash-outline"} 
            size={20} 
            color={activeTab === 'expenses' ? "#6366f1" : "#6b7280"} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'expenses' && styles.activeTabText
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {groupDetails && renderTabContent()}
        </ScrollView>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '500',
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
  content: {
    flex: 1,
  },
  sectionContainer: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllButton: {
    padding: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  memberItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  memberAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'white',
  },
  memberName: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
  },
  adminBadge: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: '500',
  },
  messagesList: {
    padding: 16,
  },
  messageItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageText: {
    fontSize: 14,
    color: '#4b5563',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  activitiesList: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 8,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: 280,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activityHeader: {
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  activityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4b5563',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  activityParticipants: {
    fontSize: 14,
    color: '#6b7280',
  },
  joinButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  expensesList: {
    padding: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  expenseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expensePaidBy: {
    fontSize: 14,
    color: '#4b5563',
  },
  expenseSettlement: {
    fontSize: 14,
    color: '#6b7280',
  },
  expenseAmount: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: 16,
  },
  expenseAmountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  expenseStatus: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  expenseStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
});