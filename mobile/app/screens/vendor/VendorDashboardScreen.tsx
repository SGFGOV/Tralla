import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVendorAuth } from '../../hooks/use-vendor-auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../hooks/use-api';
import { Card, Divider, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';

const VendorDashboardScreen = () => {
  const { vendor, logout } = useVendorAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!vendor) {
      navigation.navigate('VendorLogin');
    }
  }, [vendor, navigation]);

  // Get business data based on vendor type
  const {
    data: businessData,
    isLoading: isBusinessLoading,
    error: businessError,
    refetch: refetchBusiness,
  } = useApi('/api/vendor/restaurants');

  // Get business stats
  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useApi('/api/vendor/restaurants/1/stats');

  // Get recent reservations
  const {
    data: reservationsData,
    isLoading: isReservationsLoading,
    error: reservationsError,
    refetch: refetchReservations,
  } = useApi('/api/vendor/restaurants/1/reservations');

  const business = businessData?.[0];
  const stats = statsData;
  const reservations = reservationsData?.slice(0, 5); // Get only 5 most recent

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('VendorLogin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchBusiness(),
      refetchStats(),
      refetchReservations(),
    ]);
    setRefreshing(false);
  };

  // Loading state
  if (
    !vendor ||
    isBusinessLoading ||
    isStatsLoading ||
    isReservationsLoading
  ) {
    return (
      <View style={styles.loadingContainer} testID="loading-indicator">
        <ActivityIndicator size="large" color="#6b46c1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Error state
  if (businessError || statsError || reservationsError) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#e53e3e" />
        <Text style={styles.errorTitle}>Error loading dashboard data</Text>
        <Text style={styles.errorMessage}>
          There was a problem fetching your data. Please try again later.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6b46c1', '#805ad5']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Vendor Dashboard</Text>
            <Text style={styles.headerSubtitle}>{vendor.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {business && (
          <Card style={styles.businessCard}>
            <LinearGradient
              colors={['#6b46c1', '#805ad5']}
              style={styles.businessHeader}
            >
              <View>
                <Text style={styles.businessName}>{business.name}</Text>
                <View style={styles.businessDetails}>
                  <Icon name="map-marker" size={16} color="#e9d8fd" />
                  <Text style={styles.businessLocation}>{business.location}</Text>
                </View>
                
                {vendor.businessType === 'restaurant' && (
                  <View style={styles.businessDetails}>
                    <Icon name="silverware-fork-knife" size={16} color="#e9d8fd" />
                    <Text style={styles.businessCuisine}>{business.cuisine}</Text>
                  </View>
                )}
                
                <View style={styles.businessMetrics}>
                  <Badge style={styles.priceBadge}>{business.priceRange}</Badge>
                  <Text style={styles.ratingText}>Rating: {business.rating}</Text>
                </View>
              </View>
            </LinearGradient>

            <Card.Content style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, styles.pendingIcon]}>
                    <Icon name="clock-outline" size={22} color="#6b46c1" />
                  </View>
                  <Text style={styles.statValue}>{stats?.pending || 0}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, styles.confirmedIcon]}>
                    <Icon name="check-circle-outline" size={22} color="#38a169" />
                  </View>
                  <Text style={styles.statValue}>{stats?.confirmed || 0}</Text>
                  <Text style={styles.statLabel}>Confirmed</Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, styles.canceledIcon]}>
                    <Icon name="close-circle-outline" size={22} color="#e53e3e" />
                  </View>
                  <Text style={styles.statValue}>{stats?.canceled || 0}</Text>
                  <Text style={styles.statLabel}>Canceled</Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, styles.totalIcon]}>
                    <Icon name="clipboard-list-outline" size={22} color="#3182ce" />
                  </View>
                  <Text style={styles.statValue}>{stats?.total || 0}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </Card.Content>

            <Card.Content style={styles.reservationInfo}>
              <View style={styles.reservationMetrics}>
                <Text style={styles.reservationMetric}>
                  Today: {stats?.todayReservations || 0} reservations
                </Text>
                <Text style={styles.reservationMetric}>
                  Upcoming: {stats?.upcomingReservations || 0} reservations
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Recent Reservations */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Reservations</Text>
          
          {reservations?.length > 0 ? (
            <FlatList
              data={reservations}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Card style={styles.reservationCard}>
                  <Card.Content>
                    <View style={styles.reservationHeader}>
                      <View style={styles.customerInfo}>
                        <View style={styles.customerAvatar}>
                          <Icon name="account" size={24} color="#6b46c1" />
                        </View>
                        <View>
                          <Text style={styles.customerName}>{item.user.displayName}</Text>
                          <Text style={styles.customerEmail}>{item.user.email}</Text>
                        </View>
                      </View>
                      <Badge 
                        style={[
                          styles.statusBadge,
                          item.status === 'confirmed' ? styles.confirmedBadge :
                          item.status === 'pending' ? styles.pendingBadge : styles.canceledBadge
                        ]}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.reservationDetails}>
                      <View style={styles.reservationDetail}>
                        <Icon name="calendar" size={16} color="#718096" />
                        <Text style={styles.detailText}>
                          {format(new Date(item.reservationDate), 'MMM d, yyyy h:mm a')}
                        </Text>
                      </View>
                      
                      <View style={styles.reservationDetail}>
                        <Icon name="account-group" size={16} color="#718096" />
                        <Text style={styles.detailText}>{item.partySize} people</Text>
                      </View>
                      
                      {item.tableNumber && (
                        <View style={styles.reservationDetail}>
                          <Icon name="table-chair" size={16} color="#718096" />
                          <Text style={styles.detailText}>Table: {item.tableNumber}</Text>
                        </View>
                      )}
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => navigation.navigate('ReservationDetail', { 
                        reservationId: item.id,
                        businessId: vendor.businessId 
                      })}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                      <Icon name="chevron-right" size={16} color="#6b46c1" />
                    </TouchableOpacity>
                  </Card.Content>
                </Card>
              )}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Icon name="calendar-blank" size={40} color="#a0aec0" />
                <Text style={styles.emptyText}>No recent reservations</Text>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ManageReservations', { businessId: vendor.businessId })}
            >
              <View style={[styles.actionIconContainer, styles.reservationsIcon]}>
                <Icon name="calendar-check" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionTitle}>Manage Reservations</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('DiscountCodes')}
            >
              <View style={[styles.actionIconContainer, styles.discountsIcon]}>
                <Icon name="tag" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionTitle}>Discount Codes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('VendorProfile')}
            >
              <View style={[styles.actionIconContainer, styles.profileIcon]}>
                <Icon name="account" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionTitle}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('VendorSettings')}
            >
              <View style={[styles.actionIconContainer, styles.settingsIcon]}>
                <Icon name="cog" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionTitle}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#4a5568',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize:
    16,
    color: '#e9d8fd',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  businessCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  businessHeader: {
    padding: 16,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  businessDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  businessLocation: {
    fontSize: 14,
    color: '#e9d8fd',
    marginLeft: 4,
  },
  businessCuisine: {
    fontSize: 14,
    color: '#e9d8fd',
    marginLeft: 4,
  },
  businessMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceBadge: {
    backgroundColor: '#ffffff',
    color: '#6b46c1',
    fontWeight: 'bold',
  },
  ratingText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '24%',
  },
  statIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingIcon: {
    backgroundColor: '#e9d8fd',
  },
  confirmedIcon: {
    backgroundColor: '#c6f6d5',
  },
  canceledIcon: {
    backgroundColor: '#fed7d7',
  },
  totalIcon: {
    backgroundColor: '#bee3f8',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
  },
  reservationInfo: {
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
  },
  reservationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reservationMetric: {
    fontSize: 13,
    color: '#4a5568',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
  },
  reservationCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9d8fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  customerEmail: {
    fontSize: 12,
    color: '#718096',
  },
  statusBadge: {
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: '#c6f6d5',
    color: '#2f855a',
  },
  pendingBadge: {
    backgroundColor: '#feebc8',
    color: '#c05621',
  },
  canceledBadge: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
  },
  divider: {
    marginVertical: 12,
  },
  reservationDetails: {
    marginBottom: 12,
  },
  reservationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#6b46c1',
    fontWeight: 'bold',
    marginRight: 4,
  },
  emptyCard: {
    borderRadius: 12,
  },
  emptyContent: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#718096',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservationsIcon: {
    backgroundColor: '#6b46c1',
  },
  discountsIcon: {
    backgroundColor: '#e53e3e',
  },
  profileIcon: {
    backgroundColor: '#38a169',
  },
  settingsIcon: {
    backgroundColor: '#3182ce',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
  },
});

export default VendorDashboardScreen;