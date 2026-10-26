# Ridezy — Smart Ride Booking & Lowest Fare Finder

> **"Every Ride. The Right Price."**

**Ridezy** is a mobile-first, full-stack ride-booking and price-comparison web application tailored for the Indian urban mobility market. It helps commuters compare valid, all-inclusive fares across **Bikes, Autos, Mini Cabs, Sedans, and SUVs**, uncover mandatory fees upfront, and book the lowest-priced eligible ride.

---

## ✨ Key Features

### 1. Lowest Fare Finder & Transparent Price Comparison
- **All-Inclusive Fare Math**: Every quote displays the final payable INR total (`Base Fare + Distance Charge + Platform Fee + 5% GST + Applicable Airport/Toll or Surge Fees`).
- **Lowest Fare Highlighting**: Automatically identifies the lowest valid, unexpired offer and calculates verified savings compared with the highest-priced comparable offer (`"You save ₹X compared with the highest-priced comparable offer"`).
- **Multi-Dimensional Sorting & Filtering**:
  - **Sort by**: Lowest price, Fastest pickup, Shortest journey, or Best overall value.
  - **Filter by**: Ride category (`All`, `Bike`, `Auto`, `Cab`), Maximum budget (`₹80`–`₹500`), Maximum pickup wait time (`≤ 4`, `≤ 6`, `≤ 8` mins), and Passenger capacity (`1`–`6` seats).
- **Quote Expiry & Provider Coverage Guardrails**:
  - Rejects expired or incomplete quotes and includes a one-tap **Test Quote Expiry** / **Refresh Fares** workflow.
  - Explicitly discloses unavailable or timed-out providers and never claims to compare every market provider unless all configured providers supply valid data.

### 2. Interactive Home & Route Map Experience
- **Smart Location Entry**: Autocomplete pickup and destination inputs with one-tap swap, browser GPS detection (with graceful fallback when permission is denied), and strict form validation.
- **Quick Destinations**: Instant route selection for **Home**, **Office**, **Railway Station**, and **Airport**.
- **Interactive Route Canvas**: Supports map zoom/pan, tap-to-set pickup/drop pins, pickup gate adjustment (`+50m` / `+120m`), and Haversine urban corridor distance/duration estimation.

### 3. Complete End-to-End Ride Booking & Safety Toolkit
- **Booking Confirmation Modal**: Itemized fee breakdown, payment method selection (`UPI`, `Card`, `Cash`, `Ridezy Wallet`), Guest mode authentication guard, and external partner handoff acknowledgment.
- **Live Active Trip Tracker**: Interactive 5-step progression (`Searching for driver` → `Driver assigned` → `Driver arriving` → `Trip started` → `Trip completed` / `Cancelled`) with a Start Ride OTP PIN.
- **Safety Center**: Includes trip sharing (copies tracking summary to clipboard), Emergency Assistance notice (`112` / `100` & emergency contact info), customer support, issue reporting, and ride cancellation.

### 4. My Rides, My Savings Dashboard & Bilingual Profile
- **My Rides**: Filter trips by status (`All`, `Active`, `Completed`, `Cancelled`), inspect itemized fare receipts, and rebook past routes in one tap.
- **My Savings Dashboard**: Displays *"Small savings. Better journeys."*, completed rides count, total spent, verified savings, average fare per ride, a 6-month savings bar chart, and a per-trip audit ledger.
- **Profile, Auth & Settings**:
  - **Bilingual Support**: Instant switching between **English** and **Hindi (`हिंदी`)**.
  - **Authentication**: Email Login, Registration, Phone OTP (Demo), Password Reset, and Guest exploration mode.
  - **Saved Locations CRUD**: Manage Home, Office, Railway, Airport, and custom bookmarked addresses.
  - **Architecture & Production Readiness Panel**: Inspect registered provider adapters, database schemas, and required production credentials.

---

## 🎨 Visual Design System

| Token | Color | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | Electric Purple | `#6C4DFF` | Primary CTAs, active navigation, route highlights |
| **Secondary** | Bright Coral | `#FF6B6B` | Destination markers, secondary accents |
| **Accent** | Lime Green | `#B8F34A` | `LOWEST FARE` badges, savings callouts, dark-surface highlights |
| **Background** | Soft White | `#FAFAFF` | Primary application canvas |
| **Main Text** | Dark Navy | `#181A2F` | High-contrast headings, body copy, dark hero surfaces |

- **Typography**: `Plus Jakarta Sans` for display headings and tabular numerals (`tabular-nums`), paired with `DM Sans` for body copy.

---

## 🏗️ Project Structure

```text
├── server.ts                         # Express + Vite full-stack server (/api/quotes, /api/bookings, /api/providers)
├── index.html                        # Entry HTML with custom Ridezy SVG favicon & font imports
├── .env.example                      # Environment variable template for production integrations
└── src/
    ├── App.tsx                       # Main application shell, navigation, and Home screen
    ├── index.css                     # Tailwind CSS v4 configuration & typography rules
    ├── types/
    │   └── ridezy.ts                 # Database schemas, Provider Adapter interfaces, Driver/Admin schemas
    ├── utils/
    │   ├── fareEngine.ts             # Pure functions for route metrics, validation, quote ranking & savings
    │   └── fareEngine.test.ts        # Automated unit tests using node:test & node:assert/strict
    ├── i18n/
    │   └── translations.ts           # Maintainable English (en) & Hindi (hi) translation dictionary
    ├── services/
    │   └── providerAdapters.ts       # Modular RideProviderAdapter implementations & Bengaluru locations
    └── components/
        ├── BrandAssets.tsx           # Original Ridezy SVG logo, splash screen, & vehicle illustrations
        ├── InteractiveRouteMap.tsx   # Interactive SVG city map with zoom, pin placement & gate nudge
        ├── LowestFareFinder.tsx      # Core price-comparison engine with sorting, filtering & fee details
        ├── BookingFlowModal.tsx      # Step 7–9 booking summary, payment selector & auth gate
        ├── ActiveTripScreen.tsx      # Step 10 live booking status tracker & safety toolkit
        ├── MyRidesScreen.tsx         # Ride history, status filters, itemized receipts & rebooking
        ├── MySavingsScreen.tsx       # Verified savings KPI dashboard, monthly chart & ledger
        └── ProfileSettingsScreen.tsx # Auth, saved addresses CRUD, EN/HI toggle & architecture guide
```

---

## 🗄️ Database Schema Overview

Ridezy's data models (`src/types/ridezy.ts`) are designed for **Cloud Firestore** or relational SQL persistence with strict per-user access control:

- **`users`**: `userId`, `displayName`, `email`, `phone`, `preferredLanguage`, `preferredRideType`, `preferredPaymentMethod`, `createdAt`
- **`savedLocations`**: `locationId`, `userId`, `label`, `address`, `latitude`, `longitude`, `type`
- **`providers`**: `providerId`, `name`, `integrationStatus`, `supportedRideTypes`, `bookingFlowType`
- **`fareQuotes`**: `quoteId`, `providerId`, `pickup`, `destination`, `rideType`, `estimatedFare`, `mandatoryFees`, `totalEstimatedFare`, `currency`, `estimatedPickupMinutes`, `estimatedJourneyMinutes`, `quoteTimestamp`, `expiresAt`, `quoteStatus`
- **`bookings`**: `bookingId`, `userId`, `providerId`, `selectedQuoteId`, `pickup`, `destination`, `rideType`, `fare`, `highestComparableFare`, `savedAmount`, `paymentStatus`, `bookingStatus`, `createdAt`
- **`trips`**: `tripId`, `bookingId`, `driverId`, `startTime`, `endTime`, `actualFare`, `tripStatus`
- **`payments`**: `paymentId`, `bookingId`, `amount`, `currency`, `method`, `gatewayReference`, `paymentStatus`, `createdAt`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** `v20+`
- **npm** `v9+`

### Installation & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   *(The app runs out-of-the-box in **Demo Mode** without external API keys.)*

3. **Start the full-stack development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🧪 Running Tests & Type Checks

Run the unit test suite (`node:test`) covering location validation, route distance math, mandatory fee summation, quote expiry filtering, comparable savings calculation, and savings dashboard aggregation:

```bash
npm test
# or directly via tsx:
npx --yes tsx --test src/utils/fareEngine.test.ts
```

Run TypeScript type-checking and production bundle verification:

```bash
npm run lint
npm run build
```

---

## 🔑 Production Integration Checklist

Before switching from **Demo Simulation Mode** to live production services, configure the following in `.env`:

1. **Google Maps Platform (`VITE_GOOGLE_MAPS_API_KEY`)**:
   - Enables live vector map tiles, Google Places Autocomplete, and Directions API polylines.
2. **Firebase Authentication & Cloud Firestore (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`)**:
   - Enables real user authentication (Email/Password & Phone OTP) and persistent Firestore collections with user-scoped security rules.
3. **Payment Gateway (`PAYMENT_GATEWAY_KEY_ID`, `PAYMENT_GATEWAY_KEY_SECRET`)**:
   - Server-side Razorpay or Stripe credentials in `server.ts` for order creation and webhook signature verification.
4. **Authorized Mobility Partner / ONDC Beckn Adapters (`ONDC_BAP_ID`, `ONDC_SIGNING_PRIVATE_KEY`)**:
   - Connect authorized partner endpoints to the `RideProviderAdapter` interface (`src/services/providerAdapters.ts`).

---

## 🛡️ Demo Mode & Transparency Policy

- When live external APIs are unconfigured, Ridezy operates in a clearly labeled **Demo Mode**.
- Simulated quotes, driver profiles, vehicle registration plates, and payment outcomes are explicitly tagged as **Demo Simulation** and are never misrepresented as real-world dispatched vehicles or live financial transactions.
