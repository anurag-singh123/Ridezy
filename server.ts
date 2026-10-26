import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  generateQuotesFromAdapters,
  INITIAL_DEMO_BOOKINGS,
  PROVIDER_ADAPTERS,
} from './src/services/providerAdapters';
import {
  calculateRouteMetrics,
  isQuoteValidAndUnexpired,
  validateJourneyLocations,
} from './src/utils/fareEngine';
import { BookingRecord, FareQuoteRecord, GeoPoint, PaymentMethodType } from './src/types/ridezy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side in-memory store for bookings & quotes
  const serverBookings: BookingRecord[] = [...INITIAL_DEMO_BOOKINGS];
  const issuedQuotes = new Map<string, FareQuoteRecord>();

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mode: 'DEMO_SIMULATION',
      providersConfigured: PROVIDER_ADAPTERS.length,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/providers', (_req, res) => {
    res.json({
      providers: PROVIDER_ADAPTERS.map((a) => a.provider),
    });
  });

  app.post('/api/quotes', async (req, res) => {
    try {
      const { pickup, destination } = req.body as {
        pickup?: GeoPoint;
        destination?: GeoPoint;
      };

      const validation = validateJourneyLocations(
        pickup?.label || pickup?.address || '',
        destination?.label || destination?.address || '',
        pickup,
        destination
      );

      if (!validation.valid || !pickup || !destination) {
        return res.status(400).json({
          error: validation.errorMessage || 'Invalid pickup or destination coordinates.',
          errorCode: validation.errorCode || 'INVALID_INPUT',
        });
      }

      const { distanceKm, durationMinutes } = calculateRouteMetrics(pickup, destination);
      const quotes = await generateQuotesFromAdapters({
        pickup,
        destination,
        distanceKm,
        durationMinutes,
      });

      for (const q of quotes) {
        issuedQuotes.set(q.quoteId, q);
      }

      return res.json({
        distanceKm,
        durationMinutes,
        quotes,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to generate fare quotes.',
      });
    }
  });

  app.post('/api/bookings', (req, res) => {
    const {
      quote,
      userId,
      paymentMethod,
      highestComparableFare,
    } = req.body as {
      quote?: FareQuoteRecord;
      userId?: string;
      paymentMethod?: PaymentMethodType;
      highestComparableFare?: number;
    };

    if (!quote || !userId) {
      return res.status(400).json({
        error: 'Missing quote or authenticated user ID for booking creation.',
      });
    }

    const validity = isQuoteValidAndUnexpired(quote);
    if (!validity.valid) {
      return res.status(400).json({
        error: validity.reason || 'Selected fare quote has expired or is invalid.',
      });
    }

    const demoVehicles: Record<string, { model: string; reg: string; driver: string }> = {
      bike: { model: 'TVS iQube Electric S', reg: 'KA 01 ER 4920', driver: 'Naveen Kumar (Demo Driver)' },
      auto: { model: 'Bajaj RE Compact CNG', reg: 'KA 03 AF 6614', driver: 'Ramesh Babu (Demo Driver)' },
      mini: { model: 'Tata Tiago EV Hatchback', reg: 'KA 05 MJ 2208', driver: 'Suresh Nair (Demo Driver)' },
      sedan: { model: 'Honda City ZX Sedan', reg: 'KA 04 MN 8841', driver: 'Prakash Shetty (Demo Driver)' },
      suv: { model: 'Toyota Innova Hycross', reg: 'KA 01 MK 9012', driver: 'Arjun Reddy (Demo Driver)' },
    };

    const assignedInfo = demoVehicles[quote.rideType] || demoVehicles.mini;
    const comparableHigh = Math.max(quote.totalEstimatedFare, highestComparableFare || quote.totalEstimatedFare);
    const savedAmount = Math.max(0, comparableHigh - quote.totalEstimatedFare);

    const newBooking: BookingRecord = {
      bookingId: `RDZ-${Math.floor(100000 + Math.random() * 900000)}`,
      userId,
      providerId: quote.providerId,
      providerName: quote.providerName,
      selectedQuoteId: quote.quoteId,
      pickup: quote.pickup,
      destination: quote.destination,
      rideType: quote.rideType,
      rideCategoryLabel: quote.rideCategoryLabel,
      fare: quote.totalEstimatedFare,
      highestComparableFare: comparableHigh,
      savedAmount,
      mandatoryFees: quote.mandatoryFees,
      distanceKm: quote.distanceKm,
      estimatedDurationMin: quote.estimatedJourneyMinutes,
      paymentMethod: paymentMethod || 'upi',
      paymentStatus: 'simulated_paid',
      bookingStatus: 'searching',
      fareSource: 'DEMO_SIMULATION',
      driver: {
        driverId: `drv-${Date.now()}`,
        name: assignedInfo.driver,
        phoneMasked: '+91 98XXX X7310',
        vehicleModel: assignedInfo.model,
        registrationNumber: assignedInfo.reg,
        rating: 4.88,
        tripsCompleted: 1645,
        otpPin: String(Math.floor(1000 + Math.random() * 9000)),
        isDemoSimulated: true,
      },
      createdAt: new Date().toISOString(),
    };

    serverBookings.unshift(newBooking);
    return res.status(201).json({
      booking: newBooking,
      isSimulatedDemo: true,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ridezy server running on http://localhost:${PORT}`);
  });
}

startServer();
