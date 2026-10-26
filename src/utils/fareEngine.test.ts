import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRouteMetrics,
  calculateSavingsDashboard,
  compareAndRankQuotes,
  computeTotalMandatoryFare,
  validateJourneyLocations,
} from './fareEngine';
import { BookingRecord, FareQuoteRecord, GeoPoint } from '../types/ridezy';

const mockPickup: GeoPoint = {
  id: 'loc-indiranagar',
  label: 'Indiranagar Metro Station',
  address: '100 Feet Rd, Indiranagar, Bengaluru',
  area: 'Indiranagar',
  latitude: 12.9784,
  longitude: 77.6408,
};

const mockDestination: GeoPoint = {
  id: 'loc-koramangala',
  label: 'Koramangala Social Tech Park',
  address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru',
  area: 'Koramangala',
  latitude: 12.9352,
  longitude: 77.6245,
};

function createQuote(overrides: Partial<FareQuoteRecord>): FareQuoteRecord {
  const now = 1761460000000;
  return {
    quoteId: 'q-default',
    providerId: 'prov-a',
    providerName: 'Ridezy Direct (Demo)',
    providerAccentColor: '#6C4DFF',
    pickup: mockPickup,
    destination: mockDestination,
    rideType: 'bike',
    rideCategoryLabel: 'Bike',
    passengerCapacity: 1,
    estimatedFare: 42,
    mandatoryFees: {
      baseFare: 25,
      distanceCharge: 17,
      platformFee: 4,
      gstAmount: 3,
      tollOrAirportFee: 0,
      surgeMultiplier: 1,
      surgeAmount: 0,
    },
    totalEstimatedFare: 49,
    currency: 'INR',
    estimatedPickupMinutes: 4,
    estimatedJourneyMinutes: 16,
    distanceKm: 6.4,
    quoteTimestamp: new Date(now - 10000).toISOString(),
    expiresAt: new Date(now + 180000).toISOString(),
    quoteStatus: 'VALID',
    fareConfidence: 'FIXED_QUOTE',
    fareSource: 'DEMO_SIMULATION',
    cancellationPolicy: 'Free cancellation within 3 mins of driver assignment.',
    bookingFlowType: 'IN_APP_DEMO',
    ...overrides,
  };
}

test('validateJourneyLocations rejects empty, short, and identical locations', () => {
  const emptyPickup = validateJourneyLocations('', 'Koramangala');
  assert.equal(emptyPickup.valid, false);
  assert.equal(emptyPickup.errorCode, 'MISSING_PICKUP');

  const emptyDest = validateJourneyLocations('Indiranagar', '   ');
  assert.equal(emptyDest.valid, false);
  assert.equal(emptyDest.errorCode, 'MISSING_DESTINATION');

  const identicalText = validateJourneyLocations('Indiranagar Metro', 'indiranagar metro');
  assert.equal(identicalText.valid, false);
  assert.equal(identicalText.errorCode, 'IDENTICAL_LOCATIONS');

  const validCheck = validateJourneyLocations(
    mockPickup.label,
    mockDestination.label,
    mockPickup,
    mockDestination
  );
  assert.equal(validCheck.valid, true);
});

test('calculateRouteMetrics computes realistic urban distance and duration', () => {
  const metrics = calculateRouteMetrics(mockPickup, mockDestination);
  assert.ok(metrics.distanceKm >= 5.0 && metrics.distanceKm <= 10.0);
  assert.ok(metrics.durationMinutes >= 12 && metrics.durationMinutes <= 35);
});

test('compareAndRankQuotes identifies lowest valid fare, includes mandatory fees, and excludes expired or unavailable offers', () => {
  const nowMs = 1761460000000;
  const quotes: FareQuoteRecord[] = [
    createQuote({
      quoteId: 'q-bike-a',
      providerId: 'prov-a',
      providerName: 'Provider A (Demo)',
      rideType: 'bike',
      estimatedPickupMinutes: 4,
      mandatoryFees: {
        baseFare: 25,
        distanceCharge: 17,
        platformFee: 4,
        gstAmount: 3,
        tollOrAirportFee: 0,
        surgeMultiplier: 1,
        surgeAmount: 0,
      },
      totalEstimatedFare: 49,
    }),
    createQuote({
      quoteId: 'q-bike-b',
      providerId: 'prov-b',
      providerName: 'Provider B (Demo)',
      rideType: 'bike',
      estimatedPickupMinutes: 3,
      mandatoryFees: {
        baseFare: 28,
        distanceCharge: 19,
        platformFee: 5,
        gstAmount: 3,
        tollOrAirportFee: 0,
        surgeMultiplier: 1,
        surgeAmount: 0,
      },
      totalEstimatedFare: 55,
    }),
    createQuote({
      quoteId: 'q-auto-c',
      providerId: 'prov-c',
      providerName: 'Provider C (Demo)',
      rideType: 'auto',
      rideCategoryLabel: 'Auto',
      passengerCapacity: 3,
      estimatedPickupMinutes: 6,
      mandatoryFees: {
        baseFare: 40,
        distanceCharge: 38,
        platformFee: 6,
        gstAmount: 5,
        tollOrAirportFee: 0,
        surgeMultiplier: 1,
        surgeAmount: 0,
      },
      totalEstimatedFare: 89,
    }),
    createQuote({
      quoteId: 'q-mini-d',
      providerId: 'prov-d',
      providerName: 'Provider D (Demo)',
      rideType: 'mini',
      rideCategoryLabel: 'Mini Cab',
      passengerCapacity: 4,
      estimatedPickupMinutes: 5,
      mandatoryFees: {
        baseFare: 65,
        distanceCharge: 64,
        platformFee: 10,
        gstAmount: 10,
        tollOrAirportFee: 0,
        surgeMultiplier: 1,
        surgeAmount: 0,
      },
      totalEstimatedFare: 149,
    }),
    createQuote({
      quoteId: 'q-expired',
      providerId: 'prov-expired',
      providerName: 'Expired Provider',
      rideType: 'bike',
      expiresAt: new Date(nowMs - 5000).toISOString(),
      quoteStatus: 'EXPIRED',
      totalEstimatedFare: 35,
    }),
    createQuote({
      quoteId: 'q-unavail',
      providerId: 'prov-unavail',
      providerName: 'PrimeFleet Connect',
      rideType: 'sedan',
      quoteStatus: 'UNAVAILABLE',
      unavailabilityReason: 'Provider API timeout after 2500ms',
    }),
  ];

  const result = compareAndRankQuotes(
    quotes,
    {
      sortBy: 'lowest_price',
      categoryFilter: 'all',
      maxBudget: null,
      maxPickupMinutes: null,
      nowMs,
    },
    5
  );

  assert.equal(result.eligibleQuotes.length, 4);
  assert.equal(result.lowestFareQuote?.quoteId, 'q-bike-a');
  assert.equal(result.lowestFareQuote?.totalEstimatedFare, 49);
  assert.equal(result.highestComparableFare, 55);
  assert.equal(result.maxSavingsOnRoute, 6);
  assert.equal(result.excludedQuotes.length, 2);
  assert.equal(result.providerCoverage.isPartialComparison, true);
  assert.equal(result.providerCoverage.unavailableProviders.length, 1);

  // When sorting by fastest pickup, Provider B (3 mins) ranks first
  const fastestResult = compareAndRankQuotes(
    quotes,
    {
      sortBy: 'fastest_pickup',
      categoryFilter: 'all',
      maxBudget: null,
      maxPickupMinutes: null,
      nowMs,
    },
    5
  );
  assert.equal(fastestResult.eligibleQuotes[0].quoteId, 'q-bike-b');
});

test('computeTotalMandatoryFare sums all mandatory components accurately', () => {
  const total = computeTotalMandatoryFare({
    baseFare: 50,
    distanceCharge: 60,
    platformFee: 8,
    gstAmount: 7,
    tollOrAirportFee: 15,
    surgeMultiplier: 1.1,
    surgeAmount: 10,
  });
  assert.equal(total, 150);
});

test('calculateSavingsDashboard aggregates completed rides and verified savings', () => {
  const sampleBookings: BookingRecord[] = [
    {
      bookingId: 'bk-1',
      userId: 'u-1',
      providerId: 'prov-a',
      providerName: 'Ridezy Direct (Demo)',
      selectedQuoteId: 'q-1',
      pickup: mockPickup,
      destination: mockDestination,
      rideType: 'bike',
      rideCategoryLabel: 'Bike',
      fare: 49,
      highestComparableFare: 65,
      savedAmount: 16,
      mandatoryFees: {
        baseFare: 25,
        distanceCharge: 17,
        platformFee: 4,
        gstAmount: 3,
        tollOrAirportFee: 0,
        surgeMultiplier: 1,
        surgeAmount: 0,
      },
      distanceKm: 6.4,
      estimatedDurationMin: 16,
      paymentMethod: 'upi',
      paymentStatus: 'simulated_paid',
      bookingStatus: 'completed',
      fareSource: 'DEMO_SIMULATION',
      driver: {
        driverId: 'drv-1',
        name: 'Ramesh Kumar (Demo)',
        phoneMasked: '+91 98XXX X4210',
        vehicleModel: 'TVS iQube Electric',
        registrationNumber: 'KA 01 ER 4821',
        rating: 4.9,
        tripsCompleted: 1420,
        otpPin: '4829',
        isDemoSimulated: true,
      },
      createdAt: '2026-10-20T09:30:00.000Z',
    },
  ];

  const summary = calculateSavingsDashboard(sampleBookings);
  assert.equal(summary.completedRidesCount, 1);
  assert.equal(summary.totalAmountSpent, 49);
  assert.equal(summary.totalVerifiedSavings, 16);
  assert.equal(summary.averageFarePerRide, 49);
});
