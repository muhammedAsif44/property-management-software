export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
export type BookingChannel = 'WALK_IN' | 'PHONE' | 'WEBSITE' | 'OTA' | 'AGENCY';
export type MealPlan = 'EP' | 'CP' | 'MAP' | 'AP';
export type TacStatus = 'PENDING' | 'SETTLED';
export type DeletionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BookingGuest {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  nationality?: string;
  totalVisits: number;
  totalSpend: number;
}

export interface BookingRoomType {
  id: string;
  name: string;
  totalUnits: number;
  basePrice: number;
  maxOccupancy: number;
}

export interface BookingAgency {
  id: string;
  name: string;
  contactPerson?: string;
  defaultTacRate?: number;
}

export interface BookingFacility {
  amenityId: string;
  quantity: number;
  priceAtBooking: number;
  amenity: { id: string; name: string; price: number; icon?: string };
}

export interface BookingUser {
  id: string;
  email: string;
  role: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  roomTypeId: string;
  agencyId?: string;
  channel: BookingChannel;
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  mealPlan?: MealPlan;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  tacStatus?: TacStatus;
  cancellationReason?: string;
  refundAmount?: number;
  idempotencyKey?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  guest: BookingGuest;
  roomType: BookingRoomType;
  agency?: BookingAgency;
  bookingFacilities?: BookingFacility[];
  createdByUser: BookingUser;
  payments?: any[];
  deletionRequests?: DeletionRequest[];
}

export interface DeletionRequest {
  id: string;
  bookingId: string;
  reason: string;
  status: DeletionRequestStatus;
  createdAt: string;
  decidedAt?: string;
  booking: Booking;
  requestedBy: BookingUser;
  decidedBy?: BookingUser;
}

export interface BookingListResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateBookingPayload {
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  guestNationality?: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  mealPlan?: MealPlan;
  channel: BookingChannel;
  agencyId?: string;
  baseAmount: number;
  advancePaid?: number;
  facilityIds?: string[];
  notes?: string;
  propertyId?: string;
  roomUnitId?: string;
}

export interface CancelBookingPayload {
  cancellationReason: string;
  refundType: 'REFUND' | 'FORFEIT';
}

export interface BookingFilters {
  propertyId?: string;
  status?: BookingStatus;
  channel?: BookingChannel;
  fromDate?: string;
  toDate?: string;
  guestSearch?: string;
  page?: number;
  limit?: number;
}

export interface OccupancyCellBooking {
  id: string;
  guestName: string;
  guestPhone?: string | null;
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
}

export interface OccupancyCell {
  booked: number;
  total: number;
  outOfOrder: number;
  available: number;
  hasConflict: boolean;
  bookings: OccupancyCellBooking[];
}

export interface OccupancyData {
  roomTypes: BookingRoomType[];
  dates: string[];
  occupancy: Record<string, Record<string, OccupancyCell>>;
}
