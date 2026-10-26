import {
  BookingRecord,
  BookingStatusType,
  FareQuoteRecord,
  GeoPoint,
  PaymentMethodType,
  QuoteRequestParams,
  RideCategoryType,
  RideProviderAdapter,
  RideProviderRecord,
  SavedLocationRecord,
  UserProfile,
} from '../types/ridezy';
import { computeTotalMandatoryFare, isQuoteValidAndUnexpired } from '../utils/fareEngine';

export const BENGALURU_LOCATIONS: GeoPoint[] = [
  {
    id: 'loc-indiranagar',
    label: 'Indiranagar Metro Station',
    address: 'CMH Road, Indiranagar, Bengaluru 560038',
    area: 'Indiranagar',
    latitude: 12.9784,
    longitude: 77.6408,
    category: 'home',
  },
  {
    id: 'loc-rmz-ecoworld',
    label: 'RMZ Ecoworld Tech Park (Office)',
    address: 'Outer Ring Rd, Bellandur, Bengaluru 560103',
    area: 'Bellandur',
    latitude: 12.9216,
    longitude: 77.6844,
    category: 'office',
  },
  {
    id: 'loc-ksr-railway',
    label: 'KSR Bengaluru City Railway Station',
    address: 'Majestic, Sevashrama, Bengaluru 560023',
    area: 'Majestic',
    latitude: 12.9781,
    longitude: 77.5696,
    category: 'railway',
  },
  {
    id: 'loc-kia-airport',
    label: 'Kempegowda International Airport (BLR)',
    address: 'Terminal 2 Departures, Devanahalli, Bengaluru 560300',
    area: 'Devanahalli',
    latitude: 13.1986,
    longitude: 77.7066,
    category: 'airport',
  },
  {
    id: 'loc-koramangala',
    label: 'Koramangala 4th Block Sony World',
    address: '80 Feet Road, Koramangala, Bengaluru 560034',
    area: 'Koramangala',
    latitude: 12.9352,
    longitude: 77.6245,
    category: 'popular',
  },
  {
    id: 'loc-mg-road',
    label: 'MG Road Trinity Circle',
    address: 'Mahatma Gandhi Rd, Central Business District, Bengaluru 560001',
    area: 'MG Road',
    latitude: 12.9756,
    longitude: 77.6066,
    category: 'popular',
  },
  {
    id: 'loc-hsr-layout',
    label: 'HSR Layout Sector 2 Club',
    address: '27th Main Rd, Sector 2, HSR Layout, Bengaluru 560102',
    area: 'HSR Layout',
    latitude: 12.9116,
    longitude: 77.6474,
    category: 'recent',
  },
  {
    id: 'loc-whitefield',
    label: 'Whitefield ITPL Main Gate',
    address: 'ITPL Main Rd, Pattandur Agrahara, Whitefield, Bengaluru 560066',
    area: 'Whitefield',
    latitude: 12.9875,
    longitude: 77.7378,
    category: 'popular',
  },
];

export const RIDE_CATEGORY_META: Array<{
  type: RideCategoryType;
  name: string;
  subtitle: string;
  capacity: number;
  baseRate: number;
  perKmRate: number;
  etaBaselineMin: number;
}> = [
  {
    type: 'bike',
    name: 'Bike',
    subtitle: 'Beat traffic fast • Helmet provided',
    capacity: 1,
    baseRate: 22,
    perKmRate: 4.5,
    etaBaselineMin: 3,
  },
  {
    type: 'auto',
    name: 'Auto',
    subtitle: 'Open-air city commute • Doorstep pickup',
    capacity: 3,
    baseRate: 36,
    perKmRate: 8.5,
    etaBaselineMin: 5,
  },
  {
    type: 'mini',
    name: 'Mini Cab',
    subtitle: 'Compact AC hatchback • Everyday value',
    capacity: 4,
    baseRate: 62,
    perKmRate: 13.5,
    etaBaselineMin: 5,
  },
  {
    type: 'sedan',
    name: 'Sedan',
    subtitle: 'Spacious AC sedan • Extra boot space',
    capacity: 4,
    baseRate: 85,
    perKmRate: 16.5,
    etaBaselineMin: 6,
  },
  {
    type: 'suv',
    name: 'SUV',
    subtitle: '6-seater family & airport cruiser',
    capacity: 6,
    baseRate: 135,
    perKmRate: 23.0,
    etaBaselineMin: 8,
  },
];

// Concrete Modular Provider Adapter Implementation (Section 15)
class DemoParameterizedAdapter implements RideProviderAdapter {
  provider: RideProviderRecord;
  private priceMultiplier: number;
  private platformFeeFlat: number;
  private pickupDelta: number;
  private fareConfidence: 'ESTIMATED' | 'FIXED_QUOTE';

  constructor(
    provider: RideProviderRecord,
    priceMultiplier: number,
    platformFeeFlat: number,
    pickupDelta: number,
    fareConfidence: 'ESTIMATED' | 'FIXED_QUOTE'
  ) {
    this.provider = provider;
    this.priceMultiplier = priceMultiplier;
    this.platformFeeFlat = platformFeeFlat;
    this.pickupDelta = pickupDelta;
    this.fareConfidence = fareConfidence;
  }

  async checkAvailability(_pickup: GeoPoint, _destination: GeoPoint): Promise<{ available: boolean; reason?: string }> {
    if (this.provider.integrationStatus === 'UNAVAILABLE_TIMEOUT') {
      return {
        available: false,
        reason: this.provider.statusNote,
      };
    }
    return { available: true };
  }

  async requestFareQuotes(params: QuoteRequestParams): Promise<FareQuoteRecord[]> {
    const now = Date.now();
    const expiresAt = new Date(now + 4 * 60 * 1000).toISOString(); // 4 minute quote validity window
    const quoteTimestamp = new Date(now).toISOString();

    if (this.provider.integrationStatus === 'UNAVAILABLE_TIMEOUT') {
      return [
        {
          quoteId: `q-${this.provider.providerId}-unavail-${now}`,
          providerId: this.provider.providerId,
          providerName: this.provider.name,
          providerAccentColor: this.provider.accentColor,
          pickup: params.pickup,
          destination: params.destination,
          rideType: 'sedan',
          rideCategoryLabel: 'Sedan',
          passengerCapacity: 4,
          estimatedFare: 0,
          mandatoryFees: {
            baseFare: 0,
            distanceCharge: 0,
            platformFee: 0,
            gstAmount: 0,
            tollOrAirportFee: 0,
            surgeMultiplier: 1,
            surgeAmount: 0,
          },
          totalEstimatedFare: 0,
          currency: 'INR',
          estimatedPickupMinutes: 0,
          estimatedJourneyMinutes: params.durationMinutes,
          distanceKm: params.distanceKm,
          quoteTimestamp,
          expiresAt,
          quoteStatus: 'UNAVAILABLE',
          fareConfidence: 'ESTIMATED',
          fareSource: 'DEMO_SIMULATION',
          cancellationPolicy: 'N/A — Provider timed out during quote request.',
          unavailabilityReason: this.provider.statusNote,
          bookingFlowType: this.provider.bookingFlowType === 'EXTERNAL_REDIRECT' ? 'EXTERNAL_REDIRECT' : 'IN_APP_DEMO',
        },
      ];
    }

    const isAirportTrip =
      params.destination.category === 'airport' ||
      params.pickup.category === 'airport' ||
      params.destination.label.toLowerCase().includes('airport');

    const results: FareQuoteRecord[] = [];
    const scaleFactor = Math.max(0.75, params.distanceKm / 6.2);

    for (const cat of RIDE_CATEGORY_META) {
      if (!this.provider.supportedRideTypes.includes(cat.type)) continue;

      let baseFare = Math.round(cat.baseRate * this.priceMultiplier);
      let distanceCharge = Math.round(params.distanceKm * cat.perKmRate * this.priceMultiplier);
      const platformFee = this.platformFeeFlat;
      const tollOrAirportFee = isAirportTrip && cat.type !== 'bike' ? 115 : 0;
      const surgeMultiplier = this.priceMultiplier > 1.08 ? 1.1 : 1.0;
      const surgeAmount = surgeMultiplier > 1 ? Math.round((baseFare + distanceCharge) * 0.08) : 0;
      const gstAmount = Math.max(2, Math.round((baseFare + distanceCharge + platformFee) * 0.05));

      // Align canonical demo route (~6.2 km) closely with prompt's reference benchmarks (₹49 Bike A, ₹55 Bike B, ₹89 Auto C, ₹149 Mini D)
      if (Math.abs(params.distanceKm - 6.2) <= 1.5 && !isAirportTrip) {
        if (this.provider.providerId === 'prov-a' && cat.type === 'bike') {
          baseFare = 25;
          distanceCharge = 17;
        } else if (this.provider.providerId === 'prov-b' && cat.type === 'bike') {
          baseFare = 28;
          distanceCharge = 19;
        } else if (this.provider.providerId === 'prov-c' && cat.type === 'auto') {
          baseFare = 40;
          distanceCharge = 38;
        } else if (this.provider.providerId === 'prov-d' && cat.type === 'mini') {
          baseFare = 65;
          distanceCharge = 64;
        }
      } else {
        baseFare = Math.max(20, Math.round(baseFare * (0.85 + 0.15 * scaleFactor)));
      }

      const mandatoryFees = {
        baseFare,
        distanceCharge,
        platformFee,
        gstAmount,
        tollOrAirportFee,
        surgeMultiplier,
        surgeAmount,
      };

      const totalEstimatedFare = computeTotalMandatoryFare(mandatoryFees);
      const estimatedPickupMinutes = Math.max(2, cat.etaBaselineMin + this.pickupDelta);
      const estimatedJourneyMinutes = Math.max(
        5,
        Math.round(params.durationMinutes * (cat.type === 'bike' ? 0.82 : cat.type === 'auto' ? 0.96 : 1.0))
      );

      results.push({
        quoteId: `q-${this.provider.providerId}-${cat.type}-${now}`,
        providerId: this.provider.providerId,
        providerName: this.provider.name,
        providerAccentColor: this.provider.accentColor,
        pickup: params.pickup,
        destination: params.destination,
        rideType: cat.type,
        rideCategoryLabel: cat.name,
        passengerCapacity: cat.capacity,
        estimatedFare: baseFare + distanceCharge,
        mandatoryFees,
        totalEstimatedFare,
        currency: 'INR',
        estimatedPickupMinutes,
        estimatedJourneyMinutes,
        distanceKm: params.distanceKm,
        quoteTimestamp,
        expiresAt,
        quoteStatus: 'VALID',
        fareConfidence: this.fareConfidence,
        fareSource: 'DEMO_SIMULATION',
        cancellationPolicy:
          this.fareConfidence === 'FIXED_QUOTE'
            ? 'Free cancellation up to 3 mins after driver assignment; ₹25 fee thereafter.'
            : 'Free cancellation before driver dispatches; standard wait fee applies after 5 mins.',
        bookingFlowType: this.provider.bookingFlowType === 'EXTERNAL_REDIRECT' ? 'EXTERNAL_REDIRECT' : 'IN_APP_DEMO',
      });
    }

    return results;
  }

  validateQuote(quote: FareQuoteRecord, nowMs: number = Date.now()) {
    return isQuoteValidAndUnexpired(quote, nowMs);
  }

  async initiateBooking(
    quote: FareQuoteRecord,
    _userId: string,
    _paymentMethod: PaymentMethodType
  ): Promise<{ confirmed: boolean; referenceId: string; message: string }> {
    const check = this.validateQuote(quote);
    if (!check.valid) {
      return {
        confirmed: false,
        referenceId: '',
        message: check.reason || 'Quote is no longer valid.',
      };
    }
    return {
      confirmed: true,
      referenceId: `RDZ-${Math.floor(100000 + Math.random() * 900000)}`,
      message: 'Simulated booking created in Ridezy Demo Mode.',
    };
  }

  async getBookingStatus(_bookingId: string): Promise<BookingStatusType> {
    return 'searching';
  }

  async cancelBooking(_bookingId: string, _reason: string): Promise<{ cancelled: boolean; feeCharged: number }> {
    return { cancelled: true, feeCharged: 0 };
  }
}

export const PROVIDER_ADAPTERS: RideProviderAdapter[] = [
  new DemoParameterizedAdapter(
    {
      providerId: 'prov-a',
      name: 'Provider A • Ridezy ZeroComm (Demo)',
      integrationStatus: 'DEMO_SIMULATED',
      supportedRideTypes: ['bike', 'auto', 'mini', 'sedan'],
      accentColor: '#6C4DFF',
      bookingFlowType: 'IN_APP_DEMO',
      statusNote: 'Simulated direct driver-partner marketplace with zero commission markup.',
    },
    0.94,
    4,
    1,
    'FIXED_QUOTE'
  ),
  new DemoParameterizedAdapter(
    {
      providerId: 'prov-b',
      name: 'Provider B • ZipMoto Express (Demo)',
      integrationStatus: 'DEMO_SIMULATED',
      supportedRideTypes: ['bike', 'auto'],
      accentColor: '#FF6B6B',
      bookingFlowType: 'IN_APP_DEMO',
      statusNote: 'Simulated high-density 2-wheeler & auto dispatch network.',
    },
    1.04,
    5,
    0,
    'FIXED_QUOTE'
  ),
  new DemoParameterizedAdapter(
    {
      providerId: 'prov-c',
      name: 'Provider C • Namma MetroLink (Demo)',
      integrationStatus: 'DEMO_SIMULATED',
      supportedRideTypes: ['auto', 'mini', 'sedan', 'suv'],
      accentColor: '#16A34A',
      bookingFlowType: 'IN_APP_DEMO',
      statusNote: 'Simulated open-mobility meter-aligned auto & cab fleet.',
    },
    0.98,
    6,
    1,
    'FIXED_QUOTE'
  ),
  new DemoParameterizedAdapter(
    {
      providerId: 'prov-d',
      name: 'Provider D • UrbanCab Fleet (Demo)',
      integrationStatus: 'DEMO_SIMULATED',
      supportedRideTypes: ['mini', 'sedan', 'suv'],
      accentColor: '#0284C7',
      bookingFlowType: 'EXTERNAL_REDIRECT',
      statusNote: 'Simulated external partner fleet (supports authorized handoff confirmation).',
    },
    1.09,
    10,
    0,
    'ESTIMATED'
  ),
  new DemoParameterizedAdapter(
    {
      providerId: 'prov-e',
      name: 'Provider E • PrimeExec Partner',
      integrationStatus: 'UNAVAILABLE_TIMEOUT',
      supportedRideTypes: ['sedan', 'suv'],
      accentColor: '#64748B',
      bookingFlowType: 'EXTERNAL_REDIRECT',
      statusNote: 'Live API credentials not configured — excluded from lowest-fare claim.',
    },
    1.2,
    15,
    2,
    'ESTIMATED'
  ),
];

export async function generateQuotesFromAdapters(params: QuoteRequestParams): Promise<FareQuoteRecord[]> {
  const quoteArrays = await Promise.all(
    PROVIDER_ADAPTERS.map((adapter) => adapter.requestFareQuotes(params))
  );
  return quoteArrays.flat();
}

export const INITIAL_USER_PROFILE: UserProfile = {
  userId: 'usr-anurag-demo',
  displayName: 'Anurag Singh',
  email: 'anurag.singh01018@gmail.com',
  phone: '+91 98450 72109',
  preferredLanguage: 'en',
  preferredRideType: 'auto',
  preferredPaymentMethod: 'upi',
  notificationsEnabled: true,
  shareLiveLocationWithContacts: true,
  emergencyContactName: 'Priya Singh',
  emergencyContactPhone: '+91 98450 11223',
  isGuest: false,
  createdAt: '2026-06-15T10:00:00.000Z',
};

export const INITIAL_SAVED_LOCATIONS: SavedLocationRecord[] = [
  {
    locationId: 'sav-home',
    userId: 'usr-anurag-demo',
    label: 'Home',
    address: 'Indiranagar Metro Station, CMH Road, Bengaluru',
    latitude: 12.9784,
    longitude: 77.6408,
    type: 'home',
  },
  {
    locationId: 'sav-office',
    userId: 'usr-anurag-demo',
    label: 'Office',
    address: 'RMZ Ecoworld Tech Park, Bellandur, Bengaluru',
    latitude: 12.9216,
    longitude: 77.6844,
    type: 'office',
  },
  {
    locationId: 'sav-railway',
    userId: 'usr-anurag-demo',
    label: 'Railway Station',
    address: 'KSR Bengaluru City Railway Station, Majestic',
    latitude: 12.9781,
    longitude: 77.5696,
    type: 'railway',
  },
  {
    locationId: 'sav-airport',
    userId: 'usr-anurag-demo',
    label: 'Airport',
    address: 'Kempegowda International Airport (BLR), Terminal 2',
    latitude: 13.1986,
    longitude: 77.7066,
    type: 'airport',
  },
];

export const INITIAL_DEMO_BOOKINGS: BookingRecord[] = [
  {
    bookingId: 'RDZ-892410',
    userId: 'usr-anurag-demo',
    providerId: 'prov-a',
    providerName: 'Provider A • Ridezy ZeroComm (Demo)',
    selectedQuoteId: 'q-hist-1',
    pickup: BENGALURU_LOCATIONS[0],
    destination: BENGALURU_LOCATIONS[4],
    rideType: 'bike',
    rideCategoryLabel: 'Bike',
    fare: 49,
    highestComparableFare: 64,
    savedAmount: 15,
    mandatoryFees: {
      baseFare: 25,
      distanceCharge: 17,
      platformFee: 4,
      gstAmount: 3,
      tollOrAirportFee: 0,
      surgeMultiplier: 1,
      surgeAmount: 0,
    },
    distanceKm: 6.2,
    estimatedDurationMin: 16,
    paymentMethod: 'upi',
    paymentStatus: 'simulated_paid',
    bookingStatus: 'completed',
    fareSource: 'DEMO_SIMULATION',
    driver: {
      driverId: 'drv-101',
      name: 'Karthik Gowda (Demo Driver)',
      phoneMasked: '+91 98XXX X4102',
      vehicleModel: 'Ather 450X Electric',
      registrationNumber: 'KA 03 JM 7812',
      rating: 4.9,
      tripsCompleted: 1840,
      otpPin: '5291',
      isDemoSimulated: true,
    },
    createdAt: '2026-10-24T09:15:00.000Z',
    completedAt: '2026-10-24T09:32:00.000Z',
  },
  {
    bookingId: 'RDZ-884102',
    userId: 'usr-anurag-demo',
    providerId: 'prov-c',
    providerName: 'Provider C • Namma MetroLink (Demo)',
    selectedQuoteId: 'q-hist-2',
    pickup: BENGALURU_LOCATIONS[0],
    destination: BENGALURU_LOCATIONS[1],
    rideType: 'auto',
    rideCategoryLabel: 'Auto',
    fare: 124,
    highestComparableFare: 158,
    savedAmount: 34,
    mandatoryFees: {
      baseFare: 36,
      distanceCharge: 76,
      platformFee: 6,
      gstAmount: 6,
      tollOrAirportFee: 0,
      surgeMultiplier: 1,
      surgeAmount: 0,
    },
    distanceKm: 10.6,
    estimatedDurationMin: 28,
    paymentMethod: 'upi',
    paymentStatus: 'simulated_paid',
    bookingStatus: 'completed',
    fareSource: 'DEMO_SIMULATION',
    driver: {
      driverId: 'drv-102',
      name: 'Syed Irfan (Demo Driver)',
      phoneMasked: '+91 99XXX X8821',
      vehicleModel: 'Bajaj Maxima C Auto',
      registrationNumber: 'KA 01 AF 3391',
      rating: 4.8,
      tripsCompleted: 3120,
      otpPin: '7104',
      isDemoSimulated: true,
    },
    createdAt: '2026-10-21T18:40:00.000Z',
    completedAt: '2026-10-21T19:10:00.000Z',
  },
  {
    bookingId: 'RDZ-871055',
    userId: 'usr-anurag-demo',
    providerId: 'prov-a',
    providerName: 'Provider A • Ridezy ZeroComm (Demo)',
    selectedQuoteId: 'q-hist-3',
    pickup: BENGALURU_LOCATIONS[5],
    destination: BENGALURU_LOCATIONS[2],
    rideType: 'mini',
    rideCategoryLabel: 'Mini Cab',
    fare: 149,
    highestComparableFare: 189,
    savedAmount: 40,
    mandatoryFees: {
      baseFare: 62,
      distanceCharge: 69,
      platformFee: 8,
      gstAmount: 10,
      tollOrAirportFee: 0,
      surgeMultiplier: 1,
      surgeAmount: 0,
    },
    distanceKm: 5.8,
    estimatedDurationMin: 19,
    paymentMethod: 'card',
    paymentStatus: 'simulated_paid',
    bookingStatus: 'completed',
    fareSource: 'DEMO_SIMULATION',
    driver: {
      driverId: 'drv-103',
      name: 'Manjunath R (Demo Driver)',
      phoneMasked: '+91 97XXX X1904',
      vehicleModel: 'Maruti WagonR CNG',
      registrationNumber: 'KA 05 MG 9120',
      rating: 4.85,
      tripsCompleted: 2490,
      otpPin: '3948',
      isDemoSimulated: true,
    },
    createdAt: '2026-10-17T14:20:00.000Z',
    completedAt: '2026-10-17T14:42:00.000Z',
  },
];
