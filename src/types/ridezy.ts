export type LanguageCode = 'en' | 'hi';

export type RideCategoryType = 'bike' | 'auto' | 'mini' | 'sedan' | 'suv';

export type PaymentMethodType = 'upi' | 'card' | 'cash' | 'wallet';

export type QuoteStatusType = 'VALID' | 'EXPIRED' | 'UNAVAILABLE' | 'INCOMPLETE';

export type BookingStatusType =
  | 'searching'
  | 'assigned'
  | 'arriving'
  | 'started'
  | 'completed'
  | 'cancelled';

export type PaymentStatusType = 'pending' | 'simulated_paid' | 'verified_paid' | 'failed' | 'refunded';

export type SortMode = 'lowest_price' | 'fastest_pickup' | 'shortest_journey' | 'best_value';

export type CategoryFilter = 'all' | 'bike' | 'auto' | 'cab';

export interface GeoPoint {
  id: string;
  label: string;
  address: string;
  area: string;
  latitude: number;
  longitude: number;
  category?: 'home' | 'office' | 'railway' | 'airport' | 'popular' | 'recent' | 'custom';
}

// Section 14 Database Schemas
export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  preferredLanguage: LanguageCode;
  preferredRideType: RideCategoryType;
  preferredPaymentMethod: PaymentMethodType;
  notificationsEnabled: boolean;
  shareLiveLocationWithContacts: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  isGuest: boolean;
  createdAt: string;
}

export interface SavedLocationRecord {
  locationId: string;
  userId: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'home' | 'office' | 'railway' | 'airport' | 'custom';
}

export interface RideProviderRecord {
  providerId: string;
  name: string;
  integrationStatus: 'DEMO_SIMULATED' | 'CONNECTED_SANDBOX' | 'UNAVAILABLE_TIMEOUT' | 'UNCONFIGURED';
  supportedRideTypes: RideCategoryType[];
  logoUrl?: string;
  accentColor: string;
  bookingFlowType: 'IN_APP_DEMO' | 'EXTERNAL_REDIRECT' | 'PARTNER_API';
  statusNote: string;
}

export interface MandatoryFeeBreakdown {
  baseFare: number;
  distanceCharge: number;
  platformFee: number;
  gstAmount: number;
  tollOrAirportFee: number;
  surgeMultiplier: number;
  surgeAmount: number;
}

export interface FareQuoteRecord {
  quoteId: string;
  providerId: string;
  providerName: string;
  providerAccentColor: string;
  pickup: GeoPoint;
  destination: GeoPoint;
  rideType: RideCategoryType;
  rideCategoryLabel: string;
  passengerCapacity: number;
  estimatedFare: number; // Base + distance before taxes/fees
  mandatoryFees: MandatoryFeeBreakdown;
  totalEstimatedFare: number; // Final payable inclusive of all mandatory charges
  currency: 'INR';
  estimatedPickupMinutes: number;
  estimatedJourneyMinutes: number;
  distanceKm: number;
  quoteTimestamp: string;
  expiresAt: string;
  quoteStatus: QuoteStatusType;
  fareConfidence: 'ESTIMATED' | 'FIXED_QUOTE';
  fareSource: 'DEMO_SIMULATION' | 'PARTNER_API';
  cancellationPolicy: string;
  unavailabilityReason?: string;
  bookingFlowType: 'IN_APP_DEMO' | 'EXTERNAL_REDIRECT';
}

export interface DemoDriverDetails {
  driverId: string;
  name: string;
  phoneMasked: string;
  vehicleModel: string;
  registrationNumber: string;
  rating: number;
  tripsCompleted: number;
  otpPin: string;
  isDemoSimulated: true;
}

export interface BookingRecord {
  bookingId: string;
  userId: string;
  providerId: string;
  providerName: string;
  selectedQuoteId: string;
  pickup: GeoPoint;
  destination: GeoPoint;
  rideType: RideCategoryType;
  rideCategoryLabel: string;
  fare: number;
  highestComparableFare: number;
  savedAmount: number;
  mandatoryFees: MandatoryFeeBreakdown;
  distanceKm: number;
  estimatedDurationMin: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  bookingStatus: BookingStatusType;
  fareSource: 'DEMO_SIMULATION' | 'PARTNER_API';
  driver: DemoDriverDetails;
  createdAt: string;
  completedAt?: string;
  cancelledReason?: string;
}

export interface TripRecord {
  tripId: string;
  bookingId: string;
  driverId: string;
  startTime: string;
  endTime?: string;
  actualFare: number;
  tripStatus: BookingStatusType;
}

export interface PaymentRecord {
  paymentId: string;
  bookingId: string;
  amount: number;
  currency: 'INR';
  method: PaymentMethodType;
  gatewayReference: string;
  paymentStatus: PaymentStatusType;
  isSimulated: boolean;
  createdAt: string;
}

// Section 15 Provider Integration Adapter Interface
export interface QuoteRequestParams {
  pickup: GeoPoint;
  destination: GeoPoint;
  distanceKm: number;
  durationMinutes: number;
  requestedCategories?: RideCategoryType[];
}

export interface RideProviderAdapter {
  provider: RideProviderRecord;
  checkAvailability(pickup: GeoPoint, destination: GeoPoint): Promise<{ available: boolean; reason?: string }>;
  requestFareQuotes(params: QuoteRequestParams): Promise<FareQuoteRecord[]>;
  validateQuote(quote: FareQuoteRecord, nowMs?: number): { valid: boolean; reason?: string };
  initiateBooking(quote: FareQuoteRecord, userId: string, paymentMethod: PaymentMethodType): Promise<{ confirmed: boolean; referenceId: string; message: string }>;
  getBookingStatus(bookingId: string): Promise<BookingStatusType>;
  cancelBooking(bookingId: string, reason: string): Promise<{ cancelled: boolean; feeCharged: number }>;
}

// Section 16 Extensibility Schemas for Future Driver & Admin Portals
export interface FutureDriverApplicationSchema {
  driverId: string;
  fullName: string;
  licenseNumber: string;
  rcDocumentStatus: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  vehicleCategory: RideCategoryType;
  registrationPlate: string;
  isOnline: boolean;
}

export interface FutureAdminServiceZoneSchema {
  zoneId: string;
  cityName: string;
  baseFarePerCategory: Record<RideCategoryType, number>;
  perKmRate: Record<RideCategoryType, number>;
  activeProvidersCount: number;
}
