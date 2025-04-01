import { useEffect } from 'react';
import { useVendorAuth } from '@/hooks/use-vendor-auth';
import { useQuery } from '@tanstack/react-query';
import { Link, navigate } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DollarSign,
  Calendar,
  MapPin,
  User,
  Clock,
  Settings,
  Tag,
  BarChart3,
  LogOut,
  Utensils,
  Film,
  AlertTriangle,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function VendorDashboard() {
  const { vendor, logout } = useVendorAuth();
  const { toast } = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!vendor) {
      navigate('/vendor/login');
    }
  }, [vendor]);

  // Get business data based on vendor type
  const businessQuery = useQuery({
    queryKey: ['/api/vendor/restaurants'],
    queryFn: getQueryFn(),
    enabled: !!vendor && vendor.businessType === 'restaurant',
  });

  // Get business stats
  const businessStatsQuery = useQuery({
    queryKey: ['/api/vendor/restaurants/1/stats'],
    queryFn: getQueryFn(),
    enabled: !!vendor && vendor.businessType === 'restaurant' && !!vendor.businessId,
  });

  // Get recent reservations
  const reservationsQuery = useQuery({
    queryKey: ['/api/vendor/restaurants/1/reservations'], 
    queryFn: getQueryFn(),
    enabled: !!vendor && vendor.businessType === 'restaurant' && !!vendor.businessId,
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/vendor/login');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (!vendor || reservationsQuery.isLoading || businessQuery.isLoading || businessStatsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Error state
  if (businessQuery.error || reservationsQuery.error || businessStatsQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error loading dashboard data</h1>
        <p className="text-gray-600 mb-4">There was a problem fetching your data. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Destructure data
  const business = businessQuery.data?.[0];
  const stats = businessStatsQuery.data;
  const reservations = reservationsQuery.data?.slice(0, 5); // Get only 5 most recent

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-white border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Tralla Vendor
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-4 space-y-2">
            <Link href="/vendor/dashboard">
              <a className="flex items-center px-4 py-3 text-sm bg-purple-50 text-purple-700 rounded-md font-medium">
                <BarChart3 className="mr-3 h-5 w-5" />
                Dashboard
              </a>
            </Link>
            
            {vendor.businessType === 'restaurant' && (
              <Link href={`/vendor/restaurant/${vendor.businessId}`}>
                <a className="flex items-center px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-md">
                  <Utensils className="mr-3 h-5 w-5" />
                  Manage Restaurant
                </a>
              </Link>
            )}
            
            {vendor.businessType === 'movie_theater' && (
              <Link href={`/vendor/theater/${vendor.businessId}`}>
                <a className="flex items-center px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-md">
                  <Film className="mr-3 h-5 w-5" />
                  Manage Theater
                </a>
              </Link>
            )}
            
            <Link href="/vendor/discounts">
              <a className="flex items-center px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-md">
                <Tag className="mr-3 h-5 w-5" />
                Discount Codes
              </a>
            </Link>
            
            <Link href="/vendor/profile">
              <a className="flex items-center px-4 py-3 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-md">
                <Settings className="mr-3 h-5 w-5" />
                Profile Settings
              </a>
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top navbar for mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Tralla Vendor
          </h1>
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Vendor Dashboard</h1>
          
          {/* Business info card */}
          {business && (
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-6">
                    <h2 className="text-xl font-bold mb-2">{business.name}</h2>
                    <div className="flex items-center text-purple-100 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{business.location}</span>
                    </div>
                    {vendor.businessType === 'restaurant' && (
                      <div className="flex items-center text-purple-100">
                        <Utensils className="h-4 w-4 mr-1" />
                        <span>{business.cuisine}</span>
                      </div>
                    )}
                    <div className="mt-4 flex items-center">
                      <Badge className="bg-white text-purple-700">{business.priceRange}</Badge>
                      <span className="ml-2 text-white">{business.rating} ★</span>
                    </div>
                  </div>
                  
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-lg font-semibold mb-4">Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="flex justify-center mb-2">
                          <User className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="text-xl font-bold">{stats?.pending || 0}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="flex justify-center mb-2">
                          <Calendar className="h-6 w-6 text-green-500" />
                        </div>
                        <div className="text-xl font-bold">{stats?.confirmed || 0}</div>
                        <div className="text-xs text-gray-500">Confirmed</div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="flex justify-center mb-2">
                          <AlertTriangle className="h-6 w-6 text-amber-500" />
                        </div>
                        <div className="text-xl font-bold">{stats?.canceled || 0}</div>
                        <div className="text-xs text-gray-500">Canceled</div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="flex justify-center mb-2">
                          <Ticket className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="text-xl font-bold">{stats?.total || 0}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 py-3">
                <div className="w-full flex flex-col sm:flex-row sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <span className="text-sm text-gray-500">Today: {stats?.todayReservations || 0} reservations</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Upcoming: {stats?.upcomingReservations || 0} reservations</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          )}
          
          {/* Recent reservations/orders */}
          <h2 className="text-xl font-semibold mb-4">Recent Reservations</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations?.length ? (
                    reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{reservation.user.displayName}</div>
                              <div className="text-xs text-gray-500">{reservation.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <span>{format(new Date(reservation.reservationDate), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reservation.partySize} people
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            reservation.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : reservation.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reservation.tableNumber ? (
                            <span className="text-sm">Table {reservation.tableNumber}</span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            href={`/vendor/restaurant/${vendor.businessId}/reservations/${reservation.id}`}
                          >
                            <a className="text-purple-600 hover:text-purple-900">View</a>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No recent reservations
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Quick actions */}
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Manage Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">View and manage upcoming reservations and orders.</p>
                <Button 
                  asChild
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Link href={`/vendor/${vendor.businessType === 'restaurant' ? 'restaurant' : 'theater'}/${vendor.businessId}`}>
                    View All
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Discount Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">Create and manage discount codes for your customers.</p>
                <Button 
                  asChild
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Link href="/vendor/discounts">
                    Manage Discounts
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Business Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">Update your business profile, hours, and settings.</p>
                <Button 
                  asChild
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Link href="/vendor/profile">
                    Edit Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}