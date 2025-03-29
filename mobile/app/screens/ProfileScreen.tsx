import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock user data - would come from API/context in production
const MOCK_USER = {
  id: 1,
  name: 'Alex Johnson',
  email: 'alex@example.com',
  bio: 'Hiking enthusiast, tech lover, and coffee addict.',
  profilePic: null,
  location: {
    lat: 37.7749,
    lng: -122.4194,
    lastUpdated: '2025-03-28T14:30:00Z'
  },
  proximitySettings: {
    discoverable: true,
    discoverableRadius: 500, // meters
    notificationsEnabled: true,
    shareRealName: true,
    autoSuggestionEnabled: true
  },
  stats: {
    friendsCount: 28,
    groupsCount: 5,
    eventsAttended: 12
  }
};

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [proximitySettings, setProximitySettings] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableBio, setEditableBio] = useState('');

  // Mock function to fetch user data
  const fetchUserData = async () => {
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Use mock data for demonstration
      setUser(MOCK_USER);
      setProximitySettings(MOCK_USER.proximitySettings);
      setEditableBio(MOCK_USER.bio);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserData();
  }, []);

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Save changes
      setUser({
        ...user,
        bio: editableBio
      });
    }
    setIsEditing(!isEditing);
  };

  // Update proximity settings
  const updateProximitySetting = (key: string, value: any) => {
    setProximitySettings({
      ...proximitySettings,
      [key]: value
    });
  };

  // Handle logout
  const handleLogout = () => {
    // In a real app, clear auth token, user context, etc.
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={toggleEditMode}>
          <Text style={styles.editButton}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profilePic}>
              <Text style={styles.profilePicText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>
          
          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            {isEditing ? (
              <TextInput
                style={styles.bioInput}
                value={editableBio}
                onChangeText={setEditableBio}
                multiline
                maxLength={200}
              />
            ) : (
              <Text style={styles.bioText}>{user.bio}</Text>
            )}
          </View>
          
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.stats.friendsCount}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.stats.groupsCount}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.stats.eventsAttended}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
          </View>
          
          {/* Proximity Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proximity Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Discoverable by others</Text>
                <Text style={styles.settingDescription}>
                  Allow nearby users to discover you
                </Text>
              </View>
              <Switch
                value={proximitySettings.discoverable}
                onValueChange={(value) => 
                  updateProximitySetting('discoverable', value)
                }
                trackColor={{ false: '#e5e7eb', true: '#818cf8' }}
                thumbColor={proximitySettings.discoverable ? '#6366f1' : '#f3f4f6'}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Discoverable radius</Text>
                <Text style={styles.settingDescription}>
                  {proximitySettings.discoverableRadius} meters
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.radiusButton}
                onPress={() => navigation.navigate('RadiusSettings')}
              >
                <Text style={styles.radiusButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Proximity notifications</Text>
                <Text style={styles.settingDescription}>
                  Get notified when friends are nearby
                </Text>
              </View>
              <Switch
                value={proximitySettings.notificationsEnabled}
                onValueChange={(value) => 
                  updateProximitySetting('notificationsEnabled', value)
                }
                trackColor={{ false: '#e5e7eb', true: '#818cf8' }}
                thumbColor={proximitySettings.notificationsEnabled ? '#6366f1' : '#f3f4f6'}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Share real name</Text>
                <Text style={styles.settingDescription}>
                  Show your real name to nearby users
                </Text>
              </View>
              <Switch
                value={proximitySettings.shareRealName}
                onValueChange={(value) => 
                  updateProximitySetting('shareRealName', value)
                }
                trackColor={{ false: '#e5e7eb', true: '#818cf8' }}
                thumbColor={proximitySettings.shareRealName ? '#6366f1' : '#f3f4f6'}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto suggestions</Text>
                <Text style={styles.settingDescription}>
                  Get gift suggestions for frequent contacts
                </Text>
              </View>
              <Switch
                value={proximitySettings.autoSuggestionEnabled}
                onValueChange={(value) => 
                  updateProximitySetting('autoSuggestionEnabled', value)
                }
                trackColor={{ false: '#e5e7eb', true: '#818cf8' }}
                thumbColor={proximitySettings.autoSuggestionEnabled ? '#6366f1' : '#f3f4f6'}
              />
            </View>
          </View>
          
          {/* Location Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Data</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Your location was last updated:
              </Text>
              <Text style={styles.locationTimestamp}>
                {new Date(user.location.lastUpdated).toLocaleString()}
              </Text>
              <TouchableOpacity 
                style={styles.updateLocationButton}
                onPress={() => {/* Update location logic */}}
              >
                <Ionicons name="locate-outline" size={16} color="white" />
                <Text style={styles.updateLocationText}>Update Location</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Account Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#6366f1" />
              <Text style={styles.actionText}>Change Password</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('PrivacySettings')}
            >
              <Ionicons name="shield-outline" size={20} color="#6366f1" />
              <Text style={styles.actionText}>Privacy Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={[styles.actionText, styles.logoutText]}>Log Out</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.version}>
            <Text style={styles.versionText}>Tralla v1.0.0</Text>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  editButton: {
    fontSize: 16,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profilePicText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  bioInput: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  radiusButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  radiusButtonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  locationInfo: {
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 4,
  },
  locationTimestamp: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 16,
  },
  updateLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  updateLocationText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  actionsSection: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  logoutText: {
    color: '#ef4444',
  },
  version: {
    padding: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});