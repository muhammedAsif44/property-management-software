export interface DashboardPropertyInfo {
  id: string;
  name: string;
  currency: string;
  city: string | null;
  settings: {
    checkInTime: string;
    checkOutTime: string;
  } | null;
}

export interface DashboardMetrics {
  todayRevenue: number;
  monthlyRevenue: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}

export interface RecentBookingItem {
  id: string;
  channel: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  balanceDue: number;
  createdAt: string;
  guest: {
    id: string;
    fullName: string;
    phone: string | null;
  };
  roomType: {
    id: string;
    name: string;
  };
}

export interface PendingTacAgency {
  id: string;
  name: string;
  contactPerson: string | null;
  pendingTac: number;
  totalTac: number;
  tacPaid: number;
}

export interface DashboardAnalyticsResponse {
  property: DashboardPropertyInfo | null;
  metrics: DashboardMetrics;
  recentBookings: RecentBookingItem[];
  pendingTac: {
    agencies: PendingTacAgency[];
    pendingBookingsCount: number;
  };
}
