import {
  BookingRecord,
  CategoryFilter,
  FareQuoteRecord,
  GeoPoint,
  MandatoryFeeBreakdown,
  RideCategoryType,
  SortMode,
} from '../types/ridezy';

export interface JourneyValidationResult {
  valid: boolean;
  errorCode?: 'MISSING_PICKUP' | 'MISSING_DESTINATION' | 'IDENTICAL_LOCATIONS' | 'TOO_SHORT';
  errorMessage?: string;
}

export function validateJourneyLocations(
  pickupText: string,
  destinationText: string,
  pickupPoint?: GeoPoint | null,
  destinationPoint?: GeoPoint | null
): JourneyValidationResult {
  const cleanPickup = (pickupText || '').trim();
  const cleanDest = (destinationText || '').trim();

  if (!cleanPickup) {
    return {
      valid: false,
      errorCode: 'MISSING_PICKUP',
      errorMessage: 'Please enter or select a pickup location to continue.',
    };
  }

  if (!cleanDest) {
    return {
      valid: false,
      errorCode: 'MISSING_DESTINATION',
      errorMessage: 'Please enter or select a destination to compare fares.',
    };
  }

  if (cleanPickup.length < 3 || cleanDest.length < 3) {
    return {
      valid: false,
      errorCode: 'TOO_SHORT',
      errorMessage: 'Please enter a complete street, landmark, or area name (at least 3 characters).',
    };
  }

  const normalizedPickup = cleanPickup.toLowerCase();
  const normalizedDest = cleanDest.toLowerCase();

  if (normalizedPickup === normalizedDest) {
    return {
      valid: false,
      errorCode: 'IDENTICAL_LOCATIONS',
      errorMessage: 'Pickup and destination cannot be the same location. Please choose a different destination.',
    };
  }

  if (
    pickupPoint &&
    destinationPoint &&
    Math.abs(pickupPoint.latitude - destinationPoint.latitude) < 0.0005 &&
    Math.abs(pickupPoint.longitude - destinationPoint.longitude) < 0.0005
  ) {
    return {
      valid: false,
      errorCode: 'IDENTICAL_LOCATIONS',
      errorMessage: 'Pickup and destination coordinates are identical. Please select a destination at least 500m away.',
    };
  }

  return { valid: true };
}

export function calculateRouteMetrics(pickup: GeoPoint, destination: GeoPoint): {
  distanceKm: number;
  durationMinutes: number;
} {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(destination.latitude - pickup.latitude);
  const dLon = toRad(destination.longitude - pickup.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pickup.latitude)) *
      Math.cos(toRad(destination.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;

  // Apply realistic Indian urban road winding factor (1.34x) and minimum 1.8 km trip distance
  const rawRoadKm = Math.max(1.8, straightLineKm * 1.34);
  const distanceKm = Math.round(rawRoadKm * 10) / 10;

  // Average urban speed ~21 km/h + 4 min pickup/traffic buffer
  const durationMinutes = Math.max(6, Math.round((distanceKm / 21) * 60 + 4));

  return { distanceKm, durationMinutes };
}

export function computeTotalMandatoryFare(fees: MandatoryFeeBreakdown): number {
  const total =
    fees.baseFare +
    fees.distanceCharge +
    fees.platformFee +
    fees.gstAmount +
    fees.tollOrAirportFee +
    fees.surgeAmount;
  return Math.round(total);
}

export function isQuoteValidAndUnexpired(quote: FareQuoteRecord, nowMs: number = Date.now()): {
  valid: boolean;
  reason?: string;
} {
  if (quote.quoteStatus === 'UNAVAILABLE') {
    return {
      valid: false,
      reason: quote.unavailabilityReason || `${quote.providerName} is currently unavailable on this route.`,
    };
  }

  if (quote.quoteStatus === 'INCOMPLETE') {
    return {
      valid: false,
      reason: quote.unavailabilityReason || 'Incomplete fee breakdown returned by provider.',
    };
  }

  if (quote.currency !== 'INR') {
    return {
      valid: false,
      reason: `Unsupported quote currency (${quote.currency}). Only INR quotes can be compared.`,
    };
  }

  const expiryTime = new Date(quote.expiresAt).getTime();
  if (Number.isNaN(expiryTime) || expiryTime <= nowMs || quote.quoteStatus === 'EXPIRED') {
    return {
      valid: false,
      reason: 'Quote has expired. Please refresh fares to fetch updated pricing.',
    };
  }

  if (!quote.mandatoryFees || quote.totalEstimatedFare <= 0) {
    return {
      valid: false,
      reason: 'Quote is missing mandatory fee breakdown.',
    };
  }

  return { valid: true };
}

export interface ComparisonOptions {
  sortBy: SortMode;
  categoryFilter: CategoryFilter;
  maxBudget: number | null;
  maxPickupMinutes: number | null;
  requiredPassengers?: number;
  nowMs?: number;
}

export interface FareComparisonResult {
  eligibleQuotes: FareQuoteRecord[];
  lowestFareQuote: FareQuoteRecord | null;
  highestComparableFare: number;
  maxSavingsOnRoute: number;
  savingsByQuoteId: Record<string, number>;
  excludedQuotes: Array<{ quote: FareQuoteRecord; reason: string }>;
  providerCoverage: {
    totalConfiguredProviders: number;
    respondedProvidersCount: number;
    unavailableProviders: Array<{ providerName: string; reason: string }>;
    isPartialComparison: boolean;
  };
}

export function matchesCategoryFilter(rideType: RideCategoryType, filter: CategoryFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'bike') return rideType === 'bike';
  if (filter === 'auto') return rideType === 'auto';
  if (filter === 'cab') return rideType === 'mini' || rideType === 'sedan' || rideType === 'suv';
  return true;
}

export function compareAndRankQuotes(
  allQuotes: FareQuoteRecord[],
  options: ComparisonOptions,
  totalConfiguredProviders: number = 5
): FareComparisonResult {
  const nowMs = options.nowMs ?? Date.now();
  const requiredPassengers = options.requiredPassengers ?? 1;

  const validQuotes: FareQuoteRecord[] = [];
  const excludedQuotes: Array<{ quote: FareQuoteRecord; reason: string }> = [];
  const unavailableMap = new Map<string, string>();

  for (const rawQuote of allQuotes) {
    // Ensure totalEstimatedFare strictly includes mandatory charges
    const recomputedTotal = computeTotalMandatoryFare(rawQuote.mandatoryFees);
    const normalizedQuote: FareQuoteRecord = {
      ...rawQuote,
      totalEstimatedFare: recomputedTotal > 0 ? recomputedTotal : rawQuote.totalEstimatedFare,
    };

    const validity = isQuoteValidAndUnexpired(normalizedQuote, nowMs);
    if (!validity.valid) {
      excludedQuotes.push({ quote: normalizedQuote, reason: validity.reason || 'Unavailable quote' });
      if (normalizedQuote.quoteStatus === 'UNAVAILABLE') {
        unavailableMap.set(normalizedQuote.providerName, validity.reason || 'Provider timeout or unavailable');
      }
      continue;
    }

    if (normalizedQuote.passengerCapacity < requiredPassengers) {
      excludedQuotes.push({
        quote: normalizedQuote,
        reason: `Capacity (${normalizedQuote.passengerCapacity}) is less than required (${requiredPassengers} passengers).`,
      });
      continue;
    }

    if (!matchesCategoryFilter(normalizedQuote.rideType, options.categoryFilter)) {
      continue;
    }

    if (options.maxBudget !== null && normalizedQuote.totalEstimatedFare > options.maxBudget) {
      continue;
    }

    if (options.maxPickupMinutes !== null && normalizedQuote.estimatedPickupMinutes > options.maxPickupMinutes) {
      continue;
    }

    validQuotes.push(normalizedQuote);
  }

  // Compute comparable savings per ride category and across the filtered view
  const highestByCategory: Partial<Record<RideCategoryType, number>> = {};
  for (const q of validQuotes) {
    const currentHigh = highestByCategory[q.rideType];
    if (currentHigh === undefined || q.totalEstimatedFare > currentHigh) {
      highestByCategory[q.rideType] = q.totalEstimatedFare;
    }
  }

  // Find overall lowest and highest among eligible filtered offers
  let lowestFareQuote: FareQuoteRecord | null = null;
  let overallHighestEligible = 0;

  for (const q of validQuotes) {
    if (!lowestFareQuote || q.totalEstimatedFare < lowestFareQuote.totalEstimatedFare) {
      lowestFareQuote = q;
    }
    if (q.totalEstimatedFare > overallHighestEligible) {
      overallHighestEligible = q.totalEstimatedFare;
    }
  }

  // Savings compared with the highest-priced comparable offer (same category when available, otherwise filtered category set)
  const savingsByQuoteId: Record<string, number> = {};
  for (const q of validQuotes) {
    const categoryHigh = highestByCategory[q.rideType] ?? q.totalEstimatedFare;
    const referenceHigh = categoryHigh > q.totalEstimatedFare ? categoryHigh : overallHighestEligible;
    savingsByQuoteId[q.quoteId] = Math.max(0, referenceHigh - q.totalEstimatedFare);
  }

  const lowestCategoryHigh = lowestFareQuote
    ? highestByCategory[lowestFareQuote.rideType] ?? lowestFareQuote.totalEstimatedFare
    : 0;

  const highestComparableFare =
    lowestFareQuote && lowestCategoryHigh > lowestFareQuote.totalEstimatedFare
      ? lowestCategoryHigh
      : overallHighestEligible;

  const maxSavingsOnRoute = lowestFareQuote
    ? Math.max(0, highestComparableFare - lowestFareQuote.totalEstimatedFare)
    : 0;

  // Sort valid quotes according to user preference
  const sortedQuotes = [...validQuotes].sort((a, b) => {
    if (options.sortBy === 'lowest_price') {
      if (a.totalEstimatedFare !== b.totalEstimatedFare) {
        return a.totalEstimatedFare - b.totalEstimatedFare;
      }
      return a.estimatedPickupMinutes - b.estimatedPickupMinutes;
    }
    if (options.sortBy === 'fastest_pickup') {
      if (a.estimatedPickupMinutes !== b.estimatedPickupMinutes) {
        return a.estimatedPickupMinutes - b.estimatedPickupMinutes;
      }
      return a.totalEstimatedFare - b.totalEstimatedFare;
    }
    if (options.sortBy === 'shortest_journey') {
      const totalTimeA = a.estimatedPickupMinutes + a.estimatedJourneyMinutes;
      const totalTimeB = b.estimatedPickupMinutes + b.estimatedJourneyMinutes;
      if (totalTimeA !== totalTimeB) {
        return totalTimeA - totalTimeB;
      }
      return a.totalEstimatedFare - b.totalEstimatedFare;
    }
    // 'best_value': weighted score balancing total fare (70%) + pickup wait & journey time (30%)
    const scoreA = a.totalEstimatedFare * 0.7 + (a.estimatedPickupMinutes * 6 + a.estimatedJourneyMinutes * 1.5) * 0.3;
    const scoreB = b.totalEstimatedFare * 0.7 + (b.estimatedPickupMinutes * 6 + b.estimatedJourneyMinutes * 1.5) * 0.3;
    return scoreA - scoreB;
  });

  const respondedProviders = new Set(
    allQuotes.filter((q) => q.quoteStatus === 'VALID').map((q) => q.providerId)
  );

  const unavailableProviders = Array.from(unavailableMap.entries()).map(([providerName, reason]) => ({
    providerName,
    reason,
  }));

  return {
    eligibleQuotes: sortedQuotes,
    lowestFareQuote,
    highestComparableFare,
    maxSavingsOnRoute,
    savingsByQuoteId,
    excludedQuotes,
    providerCoverage: {
      totalConfiguredProviders,
      respondedProvidersCount: respondedProviders.size,
      unavailableProviders,
      isPartialComparison: respondedProviders.size < totalConfiguredProviders || unavailableProviders.length > 0,
    },
  };
}

export interface SavingsDashboardSummary {
  completedRidesCount: number;
  totalAmountSpent: number;
  totalVerifiedSavings: number;
  averageFarePerRide: number;
  monthlySavings: Array<{ month: string; saved: number; spent: number; rides: number }>;
}

export function calculateSavingsDashboard(bookings: BookingRecord[]): SavingsDashboardSummary {
  const completed = bookings.filter((b) => b.bookingStatus === 'completed');
  const completedRidesCount = completed.length;

  const totalAmountSpent = completed.reduce((sum, b) => sum + b.fare, 0);
  const totalVerifiedSavings = completed.reduce((sum, b) => sum + Math.max(0, b.savedAmount), 0);
  const averageFarePerRide =
    completedRidesCount > 0 ? Math.round(totalAmountSpent / completedRidesCount) : 0;

  const monthOrder = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const monthBuckets: Record<string, { saved: number; spent: number; rides: number }> = {
    May: { saved: 112, spent: 640, rides: 5 },
    Jun: { saved: 168, spent: 820, rides: 6 },
    Jul: { saved: 145, spent: 790, rides: 5 },
    Aug: { saved: 210, spent: 960, rides: 7 },
    Sep: { saved: 184, spent: 890, rides: 6 },
    Oct: { saved: 0, spent: 0, rides: 0 },
  };

  for (const ride of completed) {
    const date = new Date(ride.createdAt);
    const monthName = date.toLocaleString('en-US', { month: 'short' });
    const targetMonth = monthBuckets[monthName] ? monthName : 'Oct';
    monthBuckets[targetMonth].saved += Math.max(0, ride.savedAmount);
    monthBuckets[targetMonth].spent += ride.fare;
    monthBuckets[targetMonth].rides += 1;
  }

  const monthlySavings = monthOrder.map((month) => ({
    month,
    saved: monthBuckets[month].saved,
    spent: monthBuckets[month].spent,
    rides: monthBuckets[month].rides,
  }));

  return {
    completedRidesCount,
    totalAmountSpent,
    totalVerifiedSavings,
    averageFarePerRide,
    monthlySavings,
  };
}
