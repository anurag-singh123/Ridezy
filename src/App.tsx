import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Bell,
  Briefcase,
  Building2,
  Compass,
  Home as HomeIcon,
  LocateFixed,
  MapPin,
  Navigation,
  PiggyBank,
  Plane,
  Search,
  Sparkles,
  TrainFront,
  User,
  Users,
} from 'lucide-react';
import {
  BookingRecord,
  BookingStatusType,
  FareQuoteRecord,
  GeoPoint,
  PaymentMethodType,
  RideCategoryType,
  SavedLocationRecord,
  UserProfile,
} from './types/ridezy';
import { TRANSLATIONS } from './i18n/translations';
import {
  BENGALURU_LOCATIONS,
  generateQuotesFromAdapters,
  INITIAL_DEMO_BOOKINGS,
  INITIAL_SAVED_LOCATIONS,
  INITIAL_USER_PROFILE,
  RIDE_CATEGORY_META,
} from './services/providerAdapters';
import {
  calculateRouteMetrics,
  compareAndRankQuotes,
  validateJourneyLocations,
} from './utils/fareEngine';
import {
  RidezyLogo,
  SplashScreen,
  VehicleCategoryIllustration,
} from './components/BrandAssets';
import { InteractiveRouteMap } from './components/InteractiveRouteMap';
import { LowestFareFinder } from './components/LowestFareFinder';
import { BookingFlowModal } from './components/BookingFlowModal';
import { ActiveTripScreen } from './components/ActiveTripScreen';
import { MyRidesScreen } from './components/MyRidesScreen';
import { MySavingsScreen } from './components/MySavingsScreen';
import { ProfileSettingsScreen } from './components/ProfileSettingsScreen';

type ActiveTab = 'home' | 'rides' | 'savings' | 'profile';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('splash') === '1' && params.get('autostart') !== '1';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [savedLocations, setSavedLocations] =
    useState<SavedLocationRecord[]>(INITIAL_SAVED_LOCATIONS);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_DEMO_BOOKINGS);

  // Selected City
  const [selectedCity, setSelectedCity] = useState<string>('Bengaluru');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Journey Inputs (Default seeded with realistic demo pickup & destination)
  const [pickupPoint, setPickupPoint] = useState<GeoPoint | null>(BENGALURU_LOCATIONS[0]);
  const [destinationPoint, setDestinationPoint] = useState<GeoPoint | null>(
    BENGALURU_LOCATIONS[4]
  );
  const [pickupInput, setPickupInput] = useState<string>(BENGALURU_LOCATIONS[0].label);
  const [destinationInput, setDestinationInput] = useState<string>(
    BENGALURU_LOCATIONS[4].label
  );

  const [showPickupSuggestions, setShowPickupSuggestions] = useState<boolean>(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState<boolean>(false);
  const [preferredCategoryHighlight, setPreferredCategoryHighlight] =
    useState<RideCategoryType>('bike');

  // Validation & GPS states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  // Fare Comparison State
  const [quotes, setQuotes] = useState<FareQuoteRecord[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState<boolean>(false);
  const [hasSearchedFares, setHasSearchedFares] = useState<boolean>(true);

  // Booking Confirmation & Active Trip State
  const [pendingBookingOffer, setPendingBookingOffer] = useState<{
    quote: FareQuoteRecord;
    highestComparableFare: number;
  } | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  const t = TRANSLATIONS[user.preferredLanguage];

  // Resolved GeoPoints for custom typed addresses
  const resolvedPickup: GeoPoint | null = useMemo(() => {
    const trimmed = pickupInput.trim();
    if (!trimmed) return null;
    if (pickupPoint && pickupPoint.label.toLowerCase() === trimmed.toLowerCase()) {
      return pickupPoint;
    }
    const matched = BENGALURU_LOCATIONS.find(
      (l) =>
        l.label.toLowerCase().includes(trimmed.toLowerCase()) ||
        l.area.toLowerCase() === trimmed.toLowerCase()
    );
    if (matched) return matched;
    return {
      id: `custom-pickup-${trimmed}`,
      label: trimmed,
      address: `${trimmed}, ${selectedCity}`,
      area: trimmed.slice(0, 18),
      latitude: 12.9716,
      longitude: 77.5946,
      category: 'custom',
    };
  }, [pickupInput, pickupPoint, selectedCity]);

  const resolvedDestination: GeoPoint | null = useMemo(() => {
    const trimmed = destinationInput.trim();
    if (!trimmed) return null;
    if (destinationPoint && destinationPoint.label.toLowerCase() === trimmed.toLowerCase()) {
      return destinationPoint;
    }
    const matched = BENGALURU_LOCATIONS.find(
      (l) =>
        l.label.toLowerCase().includes(trimmed.toLowerCase()) ||
        l.area.toLowerCase() === trimmed.toLowerCase()
    );
    if (matched) return matched;
    return {
      id: `custom-dest-${trimmed}`,
      label: trimmed,
      address: `${trimmed}, ${selectedCity}`,
      area: trimmed.slice(0, 18),
      latitude: 12.9279,
      longitude: 77.6271,
      category: 'custom',
    };
  }, [destinationInput, destinationPoint, selectedCity]);

  const routeMetrics = useMemo(() => {
    if (!resolvedPickup || !resolvedDestination) {
      return { distanceKm: 6.2, durationMinutes: 18 };
    }
    return calculateRouteMetrics(resolvedPickup, resolvedDestination);
  }, [resolvedPickup, resolvedDestination]);

  // Fetch quotes from backend (or fallback to local adapters)
  const fetchQuotesForRoute = async (p: GeoPoint, d: GeoPoint) => {
    setIsLoadingQuotes(true);
    setValidationError(null);
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup: p, destination: d }),
      });
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      } else {
        const metrics = calculateRouteMetrics(p, d);
        const fallbackQuotes = await generateQuotesFromAdapters({
          pickup: p,
          destination: d,
          distanceKm: metrics.distanceKm,
          durationMinutes: metrics.durationMinutes,
        });
        setQuotes(fallbackQuotes);
      }
    } catch {
      const metrics = calculateRouteMetrics(p, d);
      const fallbackQuotes = await generateQuotesFromAdapters({
        pickup: p,
        destination: d,
        distanceKm: metrics.distanceKm,
        durationMinutes: metrics.durationMinutes,
      });
      setQuotes(fallbackQuotes);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  // Load initial demo quotes on mount
  useEffect(() => {
    if (BENGALURU_LOCATIONS[0] && BENGALURU_LOCATIONS[4]) {
      fetchQuotesForRoute(BENGALURU_LOCATIONS[0], BENGALURU_LOCATIONS[4]);
    }
  }, []);

  // Compute lowest indicative fare per ride category for the Home screen cards
  const indicativeFaresByCategory = useMemo(() => {
    const map: Partial<Record<RideCategoryType, number>> = {};
    for (const q of quotes) {
      if (q.quoteStatus !== 'VALID') continue;
      const existing = map[q.rideType];
      if (existing === undefined || q.totalEstimatedFare < existing) {
        map[q.rideType] = q.totalEstimatedFare;
      }
    }
    return map;
  }, [quotes]);

  const handleFindLowestFareSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validation = validateJourneyLocations(
      pickupInput,
      destinationInput,
      resolvedPickup,
      resolvedDestination
    );
    if (!validation.valid || !resolvedPickup || !resolvedDestination) {
      setValidationError(
        validation.errorMessage || 'Please enter valid pickup and destination locations.'
      );
      return;
    }

    setValidationError(null);
    setHasSearchedFares(true);
    await fetchQuotesForRoute(resolvedPickup, resolvedDestination);

    const finderEl = document.getElementById('fare-comparison-heading');
    if (finderEl) {
      finderEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUseCurrentGpsLocation = () => {
    setGpsStatusMessage('Checking browser location permission...');
    if (!('geolocation' in navigator)) {
      const fallback = BENGALURU_LOCATIONS[0];
      setPickupPoint(fallback);
      setPickupInput(fallback.label);
      setGpsStatusMessage(
        'Geolocation API unavailable in this browser — selected Indiranagar Metro Station (Demo GPS).'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsPoint: GeoPoint = {
          id: 'loc-gps-live',
          label: 'Current GPS Location (Indiranagar)',
          address: `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`,
          area: 'Current GPS',
          latitude: 12.9784,
          longitude: 77.6408,
          category: 'home',
        };
        setPickupPoint(gpsPoint);
        setPickupInput(gpsPoint.label);
        setValidationError(null);
        setGpsStatusMessage('Current GPS location applied.');
        if (resolvedDestination) {
          fetchQuotesForRoute(gpsPoint, resolvedDestination);
        }
      },
      () => {
        const fallback = BENGALURU_LOCATIONS[0];
        setPickupPoint(fallback);
        setPickupInput(fallback.label);
        setValidationError(null);
        setGpsStatusMessage(
          'Location permission denied or unavailable — applied Demo Pickup (Indiranagar Metro) so you can continue.'
        );
        if (resolvedDestination) {
          fetchQuotesForRoute(fallback, resolvedDestination);
        }
      },
      { timeout: 3500 }
    );
  };

  const handleSwapLocations = () => {
    const tempText = pickupInput;
    const tempPoint = resolvedPickup;
    setPickupInput(destinationInput);
    setPickupPoint(resolvedDestination);
    setDestinationInput(tempText);
    setDestinationPoint(tempPoint);
    setValidationError(null);
    if (resolvedDestination && tempPoint) {
      fetchQuotesForRoute(resolvedDestination, tempPoint);
    }
  };

  const handleQuickDestinationSelect = (category: 'home' | 'office' | 'railway' | 'airport') => {
    const match =
      BENGALURU_LOCATIONS.find((l) => l.category === category) || BENGALURU_LOCATIONS[1];
    // If pickup is currently the same as the quick destination, shift pickup to MG Road so route is valid
    let effectivePickup = resolvedPickup || BENGALURU_LOCATIONS[0];
    if (effectivePickup.id === match.id || effectivePickup.label === match.label) {
      effectivePickup = BENGALURU_LOCATIONS[5]; // MG Road Trinity Circle
      setPickupPoint(effectivePickup);
      setPickupInput(effectivePickup.label);
    }

    setDestinationPoint(match);
    setDestinationInput(match.label);
    setValidationError(null);
    setHasSearchedFares(true);
    fetchQuotesForRoute(effectivePickup, match);
  };

  const handleSimulateExpireQuotes = () => {
    const expiredTimestamp = new Date(Date.now() - 60 * 1000).toISOString();
    setQuotes((prev) =>
      prev.map((q) =>
        q.quoteStatus === 'VALID'
          ? { ...q, expiresAt: expiredTimestamp, quoteStatus: 'EXPIRED' }
          : q
      )
    );
  };

  const handleConfirmBookingRequest = async (paymentMethod: PaymentMethodType) => {
    if (!pendingBookingOffer) return;
    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: pendingBookingOffer.quote,
          userId: user.userId,
          paymentMethod,
          highestComparableFare: pendingBookingOffer.highestComparableFare,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const createdBooking: BookingRecord = data.booking;
        setBookings((prev) => [createdBooking, ...prev]);
        setPendingBookingOffer(null);
        setActiveTripId(createdBooking.bookingId);
      } else {
        const errData = await response.json().catch(() => ({}));
        setBookingError(errData.error || 'Could not confirm booking. Quote may have expired.');
      }
    } catch {
      // Fallback client-side demo booking if server route is unreachable
      const q = pendingBookingOffer.quote;
      const saved = Math.max(0, pendingBookingOffer.highestComparableFare - q.totalEstimatedFare);
      const fallbackBooking: BookingRecord = {
        bookingId: `RDZ-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user.userId,
        providerId: q.providerId,
        providerName: q.providerName,
        selectedQuoteId: q.quoteId,
        pickup: q.pickup,
        destination: q.destination,
        rideType: q.rideType,
        rideCategoryLabel: q.rideCategoryLabel,
        fare: q.totalEstimatedFare,
        highestComparableFare: pendingBookingOffer.highestComparableFare,
        savedAmount: saved,
        mandatoryFees: q.mandatoryFees,
        distanceKm: q.distanceKm,
        estimatedDurationMin: q.estimatedJourneyMinutes,
        paymentMethod,
        paymentStatus: 'simulated_paid',
        bookingStatus: 'searching',
        fareSource: 'DEMO_SIMULATION',
        driver: {
          driverId: `drv-${Date.now()}`,
          name: 'Naveen Kumar (Demo Driver)',
          phoneMasked: '+91 98XXX X7310',
          vehicleModel: 'TVS iQube Electric S',
          registrationNumber: 'KA 01 ER 4920',
          rating: 4.9,
          tripsCompleted: 1645,
          otpPin: '4819',
          isDemoSimulated: true,
        },
        createdAt: new Date().toISOString(),
      };
      setBookings((prev) => [fallbackBooking, ...prev]);
      setPendingBookingOffer(null);
      setActiveTripId(fallbackBooking.bookingId);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleUpdateBookingStatus = (bookingId: string, nextStatus: BookingStatusType) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId
          ? {
              ...b,
              bookingStatus: nextStatus,
              completedAt: nextStatus === 'completed' ? new Date().toISOString() : b.completedAt,
            }
          : b
      )
    );
  };

  const handleCancelBooking = (bookingId: string, reason: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId
          ? {
              ...b,
              bookingStatus: 'cancelled',
              cancelledReason: reason,
            }
          : b
      )
    );
  };

  const activeBookingObj = useMemo(
    () => bookings.find((b) => b.bookingId === activeTripId) || null,
    [bookings, activeTripId]
  );

  const pickupSuggestions = useMemo(() => {
    const q = pickupInput.trim().toLowerCase();
    if (!q) return BENGALURU_LOCATIONS;
    const filtered = BENGALURU_LOCATIONS.filter(
      (l) => l.label.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)
    );
    return filtered.length > 0 ? filtered : BENGALURU_LOCATIONS.slice(0, 5);
  }, [pickupInput]);

  const destSuggestions = useMemo(() => {
    const q = destinationInput.trim().toLowerCase();
    if (!q) return BENGALURU_LOCATIONS;
    const filtered = BENGALURU_LOCATIONS.filter(
      (l) => l.label.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)
    );
    return filtered.length > 0 ? filtered : BENGALURU_LOCATIONS.slice(0, 5);
  }, [destinationInput]);

  if (showSplash) {
    return <SplashScreen onContinue={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFF] text-[#181A2F] pb-20 md:pb-10">
      {/* Top Bar Contract: 3 Zones separated by gap-8 (Brand wordmark | 4 concise nav links | 1 primary CTA) */}
      <header className="flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 bg-white border-b border-slate-200">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTripId(null);
            setActiveTab('home');
          }}
          className="font-display text-xl font-extrabold tracking-tight text-[#181A2F] whitespace-nowrap shrink-0"
        >
          Ridezy
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600"
        >
          <button
            type="button"
            onClick={() => {
              setActiveTripId(null);
              setActiveTab('home');
            }}
            className={`hover:text-[#181A2F] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              activeTab === 'home' && !activeTripId
                ? 'text-[#6C4DFF] border-b-2 border-[#6C4DFF]'
                : ''
            }`}
          >
            {t.navHome}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTripId(null);
              setActiveTab('rides');
            }}
            className={`hover:text-[#181A2F] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              activeTab === 'rides' ? 'text-[#6C4DFF] border-b-2 border-[#6C4DFF]' : ''
            }`}
          >
            {t.navMyRides}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTripId(null);
              setActiveTab('savings');
            }}
            className={`hover:text-[#181A2F] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              activeTab === 'savings' ? 'text-[#6C4DFF] border-b-2 border-[#6C4DFF]' : ''
            }`}
          >
            {t.navMySavings}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTripId(null);
              setActiveTab('profile');
            }}
            className={`hover:text-[#181A2F] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              activeTab === 'profile' ? 'text-[#6C4DFF] border-b-2 border-[#6C4DFF]' : ''
            }`}
          >
            {t.navProfile}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTripId(null);
              setActiveTab('home');
              const el = document.getElementById('fare-comparison-heading');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 text-xs font-display font-bold text-white bg-[#6C4DFF] hover:bg-[#5b3ce8] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            Compare Fares
          </button>
        </div>
      </header>

      {/* Secondary Contextual Toolbar: Logo Mark, City Selector, Demo Mode Notice, Notifications & User Profile Trigger */}
      <div className="bg-white/75 border-b border-slate-200/70 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <RidezyLogo compact />
            <span aria-hidden="true" className="text-slate-300">|</span>
            <label htmlFor="city-selector" className="sr-only">
              Select Current City
            </label>
            <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-[#6C4DFF] shrink-0" />
              <select
                id="city-selector"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent font-semibold text-[#181A2F] focus:outline-none cursor-pointer"
              >
                <option value="Bengaluru">Bengaluru, IN</option>
                <option value="Hyderabad">Hyderabad, IN</option>
                <option value="Delhi NCR">Delhi NCR, IN</option>
                <option value="Mumbai">Mumbai, IN</option>
              </select>
            </div>
            <span className="hidden lg:inline text-slate-500">
              {t.demoModeBanner}
            </span>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setShowSplash(true)}
              className="px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-[#181A2F] hover:bg-slate-100 font-medium cursor-pointer whitespace-nowrap"
            >
              Brand Splash
            </button>

            <button
              type="button"
              aria-label="Toggle notifications"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="min-h-[38px] min-w-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#181A2F] flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#6C4DFF]" />
              <span className="hidden sm:inline font-semibold">Alerts</span>
            </button>

            <button
              type="button"
              aria-label="Open user profile"
              onClick={() => {
                setActiveTripId(null);
                setActiveTab('profile');
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#181A2F] flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <User className="w-4 h-4 text-[#6C4DFF]" />
              <span className="truncate max-w-[110px]">
                {user.isGuest ? 'Guest' : user.displayName.split(' ')[0]}
              </span>
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 top-11 z-40 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-[#181A2F]">
                  <span>Fare &amp; System Notifications</span>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-[#181A2F] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAFAFF] border border-slate-100 space-y-1">
                  <div className="font-semibold text-[#6C4DFF]">Zero-Commission Bike Quotes Active</div>
                  <p className="text-slate-600">
                    Provider A (Ridezy ZeroComm Demo) is offering Bike rides starting at ₹49 on
                    6.2 km metro corridors.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAFAFF] border border-slate-100 space-y-1">
                  <div className="font-semibold text-[#181A2F]">Demo Mode Transparency</div>
                  <p className="text-slate-600">
                    All quotes and bookings are clearly labeled as Demo Simulation until live partner
                    credentials are added.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* If viewing an Active Trip Status Screen */}
        {activeBookingObj ? (
          <ActiveTripScreen
            booking={activeBookingObj}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onCancelBooking={handleCancelBooking}
            onBackToHome={() => setActiveTripId(null)}
          />
        ) : (
          <>
            {/* TAB 1: HOME SCREEN */}
            {activeTab === 'home' && (
              <div className="space-y-8" data-testid="home-screen">
                {/* Hero Split: Left Booking Form & Quick Destinations | Right Interactive Map & Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left Column (7 cols): Headline, Pickup, Destination, Quick Destinations, Primary CTA */}
                  <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#6C4DFF] tracking-wide">
                        {t.tagline} · {selectedCity}
                      </div>
                      <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#181A2F] tracking-tight">
                        {t.heroTitle}
                      </h1>
                      <p className="text-sm sm:text-base text-slate-600">
                        {t.heroSubtitle}
                      </p>
                    </div>

                    {/* Journey Search Form */}
                    <form onSubmit={handleFindLowestFareSubmit} className="space-y-4">
                      {/* Pickup Input Field */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="pickup-location-input"
                            className="text-xs font-bold text-[#181A2F] flex items-center gap-1.5"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-[#6C4DFF] inline-block" />
                            {t.pickupLabel}
                          </label>
                          <button
                            type="button"
                            onClick={handleUseCurrentGpsLocation}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6C4DFF] hover:underline cursor-pointer"
                          >
                            <LocateFixed className="w-3.5 h-3.5" />
                            {t.useCurrentLocation}
                          </button>
                        </div>

                        <div className="relative flex items-center">
                          <MapPin className="w-4 h-4 text-[#6C4DFF] absolute left-3.5 pointer-events-none" />
                          <input
                            id="pickup-location-input"
                            type="text"
                            value={pickupInput}
                            onFocus={() => setShowPickupSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 180)}
                            onChange={(e) => {
                              setPickupInput(e.target.value);
                              setValidationError(null);
                            }}
                            placeholder={t.pickupPlaceholder}
                            className="w-full pl-10 pr-20 py-3 rounded-2xl border border-slate-200 bg-[#FAFAFF] focus:bg-white text-sm font-medium text-[#181A2F] focus:outline-none focus:border-[#6C4DFF]"
                          />
                          {pickupInput && (
                            <button
                              type="button"
                              aria-label="Clear pickup location"
                              onClick={() => {
                                setPickupInput('');
                                setPickupPoint(null);
                              }}
                              className="absolute right-3 text-xs font-semibold text-slate-400 hover:text-[#181A2F] px-2 py-1 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Pickup Autocomplete Dropdown */}
                        {showPickupSuggestions && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl bg-white border border-slate-200 shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                            {pickupSuggestions.map((loc) => (
                              <button
                                key={loc.id}
                                type="button"
                                onMouseDown={() => {
                                  setPickupPoint(loc);
                                  setPickupInput(loc.label);
                                  setShowPickupSuggestions(false);
                                  setValidationError(null);
                                  if (resolvedDestination && resolvedDestination.id !== loc.id) {
                                    fetchQuotesForRoute(loc, resolvedDestination);
                                  }
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-[#FAFAFF] flex items-start gap-2.5 text-xs cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#6C4DFF] shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-[#181A2F]">{loc.label}</div>
                                  <div className="text-slate-500">{loc.address}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Swap Pickup & Destination Button + Route Distance Indicator */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs text-slate-500 font-mono tabular-nums">
                          Estimated corridor: <strong>{routeMetrics.distanceKm.toFixed(1)} km</strong> ·{' '}
                          <strong>~{routeMetrics.durationMinutes} min</strong>
                        </span>
                        <button
                          type="button"
                          onClick={handleSwapLocations}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#6C4DFF] cursor-pointer"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          Swap Pickup &amp; Drop
                        </button>
                      </div>

                      {/* Destination Input Field */}
                      <div className="relative">
                        <label
                          htmlFor="destination-location-input"
                          className="block text-xs font-bold text-[#181A2F] mb-1.5 flex items-center gap-1.5"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B] inline-block" />
                          {t.destinationLabel}
                        </label>
                        <div className="relative flex items-center">
                          <Search className="w-4 h-4 text-[#FF6B6B] absolute left-3.5 pointer-events-none" />
                          <input
                            id="destination-location-input"
                            type="text"
                            value={destinationInput}
                            onFocus={() => setShowDestSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowDestSuggestions(false), 180)}
                            onChange={(e) => {
                              setDestinationInput(e.target.value);
                              setValidationError(null);
                            }}
                            placeholder={t.destinationPlaceholder}
                            className="w-full pl-10 pr-20 py-3 rounded-2xl border border-slate-200 bg-[#FAFAFF] focus:bg-white text-sm font-medium text-[#181A2F] focus:outline-none focus:border-[#6C4DFF]"
                          />
                          {destinationInput && (
                            <button
                              type="button"
                              aria-label="Clear destination location"
                              onClick={() => {
                                setDestinationInput('');
                                setDestinationPoint(null);
                              }}
                              className="absolute right-3 text-xs font-semibold text-slate-400 hover:text-[#181A2F] px-2 py-1 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Destination Autocomplete Dropdown */}
                        {showDestSuggestions && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl bg-white border border-slate-200 shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                            {destSuggestions.map((loc) => (
                              <button
                                key={loc.id}
                                type="button"
                                onMouseDown={() => {
                                  setDestinationPoint(loc);
                                  setDestinationInput(loc.label);
                                  setShowDestSuggestions(false);
                                  setValidationError(null);
                                  if (resolvedPickup && resolvedPickup.id !== loc.id) {
                                    fetchQuotesForRoute(resolvedPickup, loc);
                                  }
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-[#FAFAFF] flex items-start gap-2.5 text-xs cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#FF6B6B] shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-[#181A2F]">{loc.label}</div>
                                  <div className="text-slate-500">{loc.address}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Validation Error or GPS Status Feedback */}
                      {validationError && (
                        <div
                          role="alert"
                          data-testid="journey-validation-error"
                          className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{validationError}</span>
                        </div>
                      )}

                      {gpsStatusMessage && !validationError && (
                        <div className="p-3 rounded-2xl bg-slate-100 text-xs text-slate-700 flex items-center justify-between gap-2">
                          <span>{gpsStatusMessage}</span>
                          <button
                            type="button"
                            onClick={() => setGpsStatusMessage(null)}
                            className="text-slate-500 hover:text-[#181A2F] font-semibold cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}

                      {/* Quick Destinations Cards (Section 4.E: Home, Office, Railway Station, Airport) */}
                      <div className="space-y-2 pt-1">
                        <div className="text-xs font-bold text-slate-600">
                          {t.quickDestinationsTitle}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleQuickDestinationSelect('home')}
                            className="p-3 rounded-2xl border border-slate-200 bg-[#FAFAFF] hover:border-[#6C4DFF] hover:bg-[#6C4DFF]/5 text-left transition-all cursor-pointer group"
                          >
                            <HomeIcon className="w-4 h-4 text-[#6C4DFF] mb-1.5" />
                            <div className="font-display font-bold text-xs text-[#181A2F]">
                              {t.quickHome}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">Indiranagar</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickDestinationSelect('office')}
                            className="p-3 rounded-2xl border border-slate-200 bg-[#FAFAFF] hover:border-[#6C4DFF] hover:bg-[#6C4DFF]/5 text-left transition-all cursor-pointer group"
                          >
                            <Briefcase className="w-4 h-4 text-[#FF6B6B] mb-1.5" />
                            <div className="font-display font-bold text-xs text-[#181A2F]">
                              {t.quickOffice}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">RMZ Ecoworld</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickDestinationSelect('railway')}
                            className="p-3 rounded-2xl border border-slate-200 bg-[#FAFAFF] hover:border-[#6C4DFF] hover:bg-[#6C4DFF]/5 text-left transition-all cursor-pointer group"
                          >
                            <TrainFront className="w-4 h-4 text-emerald-600 mb-1.5" />
                            <div className="font-display font-bold text-xs text-[#181A2F]">
                              {t.quickRailway}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">KSR Majestic</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickDestinationSelect('airport')}
                            className="p-3 rounded-2xl border border-slate-200 bg-[#FAFAFF] hover:border-[#6C4DFF] hover:bg-[#6C4DFF]/5 text-left transition-all cursor-pointer group"
                          >
                            <Plane className="w-4 h-4 text-sky-600 mb-1.5" />
                            <div className="font-display font-bold text-xs text-[#181A2F]">
                              {t.quickAirport}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">KIA Terminal 2</div>
                          </button>
                        </div>
                      </div>

                      {/* Primary CTA Button (Section 4.G: "FIND MY LOWEST FARE") */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          data-testid="find-lowest-fare-cta"
                          className="w-full py-4 px-6 rounded-2xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white font-display font-extrabold text-sm sm:text-base tracking-wide transition-transform active:scale-[0.99] cursor-pointer shadow-lg shadow-[#6C4DFF]/25 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-5 h-5 text-[#B8F34A]" />
                          <span>{t.findLowestFareCta}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Column (5 cols): Interactive Route Map */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <InteractiveRouteMap
                      pickup={resolvedPickup}
                      destination={resolvedDestination}
                      distanceKm={routeMetrics.distanceKm}
                      durationMinutes={routeMetrics.durationMinutes}
                      onSelectPickupFromMap={(loc) => {
                        setPickupPoint(loc);
                        setPickupInput(loc.label);
                        setValidationError(null);
                        if (resolvedDestination && resolvedDestination.id !== loc.id) {
                          fetchQuotesForRoute(loc, resolvedDestination);
                        }
                      }}
                      onSelectDestinationFromMap={(loc) => {
                        setDestinationPoint(loc);
                        setDestinationInput(loc.label);
                        setValidationError(null);
                        if (resolvedPickup && resolvedPickup.id !== loc.id) {
                          fetchQuotesForRoute(resolvedPickup, loc);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Full-Width Row Below Hero Split: Ride Categories (Section 4.F: Bike, Auto, Mini Cab, Sedan, SUV) */}
                <section aria-labelledby="ride-categories-heading" className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2
                      id="ride-categories-heading"
                      className="font-display text-lg sm:text-xl font-bold text-[#181A2F]"
                    >
                      {t.rideCategoriesTitle}
                    </h2>
                    <span className="text-xs text-slate-500">
                      Indicative Demo Fares for {routeMetrics.distanceKm.toFixed(1)} km journey
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {RIDE_CATEGORY_META.map((cat) => {
                      const indicativeFare = indicativeFaresByCategory[cat.type];
                      const isSelected = preferredCategoryHighlight === cat.type;

                      return (
                        <button
                          key={cat.type}
                          type="button"
                          onClick={() => {
                            setPreferredCategoryHighlight(cat.type);
                            const el = document.getElementById('fare-comparison-heading');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-[#6C4DFF] bg-white ring-2 ring-[#6C4DFF]/15 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <VehicleCategoryIllustration type={cat.type} className="w-14 h-10" />
                            <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 tabular-nums">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {cat.capacity}
                            </span>
                          </div>

                          <div>
                            <div className="font-display font-bold text-base text-[#181A2F]">
                              {cat.name}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              {cat.subtitle}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                            <span className="text-[11px] text-slate-500">From</span>
                            <span className="font-mono font-extrabold text-base text-[#6C4DFF] tabular-nums">
                              {indicativeFare ? `₹${indicativeFare}` : '—'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Core Differentiator: Lowest Fare Finder Screen / Section (Section 5) */}
                {hasSearchedFares && (
                  <LowestFareFinder
                    quotes={quotes}
                    language={user.preferredLanguage}
                    isLoading={isLoadingQuotes}
                    onRefreshQuotes={() => {
                      if (resolvedPickup && resolvedDestination) {
                        fetchQuotesForRoute(resolvedPickup, resolvedDestination);
                      }
                    }}
                    onSimulateExpireQuotes={handleSimulateExpireQuotes}
                    onSelectOfferToBook={(quote, highestComparableFare) => {
                      setBookingError(null);
                      setPendingBookingOffer({ quote, highestComparableFare });
                    }}
                  />
                )}
              </div>
            )}

            {/* TAB 2: MY RIDES SCREEN */}
            {activeTab === 'rides' && (
              <MyRidesScreen
                bookings={bookings}
                onOpenActiveBooking={(b) => setActiveTripId(b.bookingId)}
                onRebookRoute={(p, d) => {
                  setPickupPoint(p);
                  setPickupInput(p.label);
                  setDestinationPoint(d);
                  setDestinationInput(d.label);
                  setActiveTab('home');
                  fetchQuotesForRoute(p, d);
                }}
              />
            )}

            {/* TAB 3: MY SAVINGS SCREEN */}
            {activeTab === 'savings' && (
              <MySavingsScreen
                bookings={bookings}
                language={user.preferredLanguage}
                onStartNewComparison={() => setActiveTab('home')}
              />
            )}

            {/* TAB 4: PROFILE & SETTINGS SCREEN */}
            {activeTab === 'profile' && (
              <ProfileSettingsScreen
                user={user}
                savedLocations={savedLocations}
                onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
                onAddSavedLocation={(label, address, type) => {
                  const newLoc: SavedLocationRecord = {
                    locationId: `sav-${Date.now()}`,
                    userId: user.userId,
                    label,
                    address,
                    latitude: 12.9716,
                    longitude: 77.5946,
                    type,
                  };
                  setSavedLocations((prev) => [...prev, newLoc]);
                }}
                onDeleteSavedLocation={(locationId) => {
                  setSavedLocations((prev) =>
                    prev.filter((l) => l.locationId !== locationId)
                  );
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="hidden md:block border-t border-slate-200 bg-white py-5 px-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <strong>Ridezy</strong> — Every Ride. The Right Price. · Built with transparent fare
            comparison &amp; modular provider adapters.
          </div>
          <div>
            Demo Mode Active: Prices, driver profiles, and payments are simulated for evaluation.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Section 13: Home, My Rides, My Savings, Profile) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center h-14"
      >
        <button
          type="button"
          onClick={() => {
            setActiveTripId(null);
            setActiveTab('home');
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            activeTab === 'home' && !activeTripId ? 'text-[#6C4DFF]' : 'text-slate-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{t.navHome}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTripId(null);
            setActiveTab('rides');
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            activeTab === 'rides' ? 'text-[#6C4DFF]' : 'text-slate-500'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{t.navMyRides}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTripId(null);
            setActiveTab('savings');
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            activeTab === 'savings' ? 'text-[#6C4DFF]' : 'text-slate-500'
          }`}
        >
          <PiggyBank className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{t.navMySavings}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTripId(null);
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            activeTab === 'profile' ? 'text-[#6C4DFF]' : 'text-slate-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{t.navProfile}</span>
        </button>
      </nav>

      {/* Booking Confirmation Modal (Steps 7-9) */}
      {pendingBookingOffer && (
        <BookingFlowModal
          quote={pendingBookingOffer.quote}
          highestComparableFare={pendingBookingOffer.highestComparableFare}
          user={user}
          isSubmitting={isSubmittingBooking}
          errorMessage={bookingError}
          onClose={() => setPendingBookingOffer(null)}
          onQuickAuthenticateGuest={() =>
            setUser((prev) => ({
              ...prev,
              isGuest: false,
              displayName: prev.displayName || 'Anurag Singh',
            }))
          }
          onConfirmBooking={handleConfirmBookingRequest}
        />
      )}
    </div>
  );
}
