import { LanguageCode } from '../types/ridezy';

export interface TranslationStrings {
  tagline: string;
  demoModeBanner: string;
  navHome: string;
  navMyRides: string;
  navMySavings: string;
  navProfile: string;
  heroTitle: string;
  heroSubtitle: string;
  pickupLabel: string;
  pickupPlaceholder: string;
  destinationLabel: string;
  destinationPlaceholder: string;
  useCurrentLocation: string;
  quickDestinationsTitle: string;
  quickHome: string;
  quickOffice: string;
  quickRailway: string;
  quickAirport: string;
  rideCategoriesTitle: string;
  findLowestFareCta: string;
  lowestFareBadge: string;
  savingsBannerPrefix: string;
  savingsBannerSuffix: string;
  sortByLowestPrice: string;
  sortByFastestPickup: string;
  sortByShortestJourney: string;
  sortByBestValue: string;
  filterAll: string;
  filterBike: string;
  filterAuto: string;
  filterCab: string;
  bookNow: string;
  confirmBooking: string;
  mySavingsHeadline: string;
  mySavingsFriendlyQuote: string;
  completedRides: string;
  totalSpent: string;
  estimatedSavings: string;
  avgFarePerRide: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationStrings> = {
  en: {
    tagline: 'Every Ride. The Right Price.',
    demoModeBanner: 'Demo Mode Active — Simulated quotes & bookings for evaluation',
    navHome: 'Home',
    navMyRides: 'My Rides',
    navMySavings: 'My Savings',
    navProfile: 'Profile',
    heroTitle: 'Where are you going today?',
    heroSubtitle: 'Find your ride. Compare your fare. Save more.',
    pickupLabel: 'Pickup Location',
    pickupPlaceholder: 'Enter pickup street, metro, or landmark...',
    destinationLabel: 'Destination',
    destinationPlaceholder: 'Search destination, airport, or office...',
    useCurrentLocation: 'Use Current GPS',
    quickDestinationsTitle: 'Quick Destinations',
    quickHome: 'Home',
    quickOffice: 'Office',
    quickRailway: 'Railway Station',
    quickAirport: 'Airport',
    rideCategoriesTitle: 'Ride Categories & Indicative Fares',
    findLowestFareCta: 'FIND MY LOWEST FARE',
    lowestFareBadge: 'LOWEST FARE',
    savingsBannerPrefix: 'You save',
    savingsBannerSuffix: 'compared with the highest-priced comparable offer.',
    sortByLowestPrice: 'Lowest price',
    sortByFastestPickup: 'Fastest pickup',
    sortByShortestJourney: 'Shortest journey',
    sortByBestValue: 'Best overall value',
    filterAll: 'All Rides',
    filterBike: 'Bike',
    filterAuto: 'Auto',
    filterCab: 'Cab (Mini/Sedan/SUV)',
    bookNow: 'Select & Review',
    confirmBooking: 'Confirm Demo Booking',
    mySavingsHeadline: 'My Savings',
    mySavingsFriendlyQuote: 'Small savings. Better journeys.',
    completedRides: 'Completed Rides',
    totalSpent: 'Total Spent',
    estimatedSavings: 'Verified Savings',
    avgFarePerRide: 'Average Fare / Ride',
  },
  hi: {
    tagline: 'हर राइड। सही दाम।',
    demoModeBanner: 'डेमो मोड सक्रिय — परीक्षण के लिए सिम्युलेटेड किराया और बुकिंग',
    navHome: 'होम',
    navMyRides: 'मेरी राइड्स',
    navMySavings: 'मेरी बचत',
    navProfile: 'प्रोफ़ाइल',
    heroTitle: 'आज आप कहाँ जा रहे हैं?',
    heroSubtitle: 'अपनी राइड खोजें। किराया तुलना करें। अधिक बचाएं।',
    pickupLabel: 'पिकअप स्थान',
    pickupPlaceholder: 'पिकअप गली, मेट्रो या लैंडमार्क दर्ज करें...',
    destinationLabel: 'गंतव्य (Destination)',
    destinationPlaceholder: 'गंतव्य, एयरपोर्ट या ऑफिस खोजें...',
    useCurrentLocation: 'वर्तमान GPS चुनें',
    quickDestinationsTitle: 'त्वरित गंतव्य',
    quickHome: 'घर (Home)',
    quickOffice: 'ऑफिस (Office)',
    quickRailway: 'रेलवे स्टेशन',
    quickAirport: 'एयरपोर्ट',
    rideCategoriesTitle: 'राइड श्रेणियाँ और अनुमानित किराया',
    findLowestFareCta: 'मेरा सबसे कम किराया खोजें (FIND MY LOWEST FARE)',
    lowestFareBadge: 'LOWEST FARE • सबसे कम किराया',
    savingsBannerPrefix: 'आप बचाते हैं',
    savingsBannerSuffix: 'सबसे महंगे तुलनीय ऑफर की तुलना में।',
    sortByLowestPrice: 'सबसे कम कीमत',
    sortByFastestPickup: 'सबसे तेज़ पिकअप',
    sortByShortestJourney: 'सबसे छोटी यात्रा',
    sortByBestValue: 'सर्वोत्तम मूल्य',
    filterAll: 'सभी राइड्स',
    filterBike: 'बाइक',
    filterAuto: 'ऑटो',
    filterCab: 'कैब (Mini/Sedan/SUV)',
    bookNow: 'चुनें और समीक्षा करें',
    confirmBooking: 'डेमो बुकिंग कन्फर्म करें',
    mySavingsHeadline: 'मेरी बचत (My Savings)',
    mySavingsFriendlyQuote: 'छोटी बचत। बेहतर यात्राएं। (Small savings. Better journeys.)',
    completedRides: 'पूरी की गई राइड्स',
    totalSpent: 'कुल खर्च',
    estimatedSavings: 'सत्यापित बचत',
    avgFarePerRide: 'औसत किराया / राइड',
  },
};
