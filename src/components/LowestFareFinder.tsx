import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Filter,
  Info,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  CategoryFilter,
  FareQuoteRecord,
  LanguageCode,
  SortMode,
} from '../types/ridezy';
import { TRANSLATIONS } from '../i18n/translations';
import { compareAndRankQuotes } from '../utils/fareEngine';
import { EmptyStateIllustration, VehicleCategoryIllustration } from './BrandAssets';

interface LowestFareFinderProps {
  quotes: FareQuoteRecord[];
  language: LanguageCode;
  isLoading: boolean;
  onRefreshQuotes: () => void;
  onSimulateExpireQuotes: () => void;
  onSelectOfferToBook: (quote: FareQuoteRecord, highestComparableFare: number) => void;
}

export const LowestFareFinder: React.FC<LowestFareFinderProps> = ({
  quotes,
  language,
  isLoading,
  onRefreshQuotes,
  onSimulateExpireQuotes,
  onSelectOfferToBook,
}) => {
  const t = TRANSLATIONS[language];
  const [sortBy, setSortBy] = useState<SortMode>('lowest_price');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [maxPickupMinutes, setMaxPickupMinutes] = useState<number | null>(null);
  const [requiredPassengers, setRequiredPassengers] = useState<number>(1);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  const comparison = compareAndRankQuotes(
    quotes,
    {
      sortBy,
      categoryFilter,
      maxBudget,
      maxPickupMinutes,
      requiredPassengers,
    },
    5
  );

  const {
    eligibleQuotes,
    lowestFareQuote,
    highestComparableFare,
    maxSavingsOnRoute,
    savingsByQuoteId,
    excludedQuotes,
    providerCoverage,
  } = comparison;

  const handleResetFilters = () => {
    setCategoryFilter('all');
    setMaxBudget(null);
    setMaxPickupMinutes(null);
    setRequiredPassengers(1);
    setSortBy('lowest_price');
  };

  return (
    <section
      aria-labelledby="fare-comparison-heading"
      className="space-y-5"
      data-testid="lowest-fare-finder-section"
    >
      {/* Top Header & Refresh Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="fare-comparison-heading"
            className="font-display text-xl sm:text-2xl font-bold text-[#181A2F]"
          >
            Lowest Fare Finder &amp; Price Comparison
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Comparing {providerCoverage.respondedProvidersCount} of{' '}
            {providerCoverage.totalConfiguredProviders} configured provider adapters · Demo Simulation
            Data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSimulateExpireQuotes}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Test Quote Expiry
          </button>
          <button
            type="button"
            onClick={onRefreshQuotes}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181A2F] hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Fares
          </button>
        </div>
      </div>

      {/* Lowest Fare Highlight Banner */}
      {lowestFareQuote && !isLoading && (
        <div
          className="rounded-3xl bg-[#181A2F] text-white p-5 sm:p-6 shadow-md border border-[#6C4DFF]/30"
          data-testid="lowest-fare-highlight-banner"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#B8F34A] text-[#181A2F] font-display font-extrabold text-xs tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.lowestFareBadge}
                </span>
                <span className="text-xs text-slate-300">
                  {lowestFareQuote.providerName} · {lowestFareQuote.rideCategoryLabel} (up to{' '}
                  {lowestFareQuote.passengerCapacity} pax)
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#B8F34A] tabular-nums">
                  ₹{lowestFareQuote.totalEstimatedFare}
                </span>
                <span className="text-xs sm:text-sm text-slate-300">
                  All-inclusive (Base ₹{lowestFareQuote.estimatedFare} + ₹
                  {lowestFareQuote.totalEstimatedFare - lowestFareQuote.estimatedFare} taxes &amp;
                  fees)
                </span>
              </div>

              {maxSavingsOnRoute > 0 && (
                <p className="text-xs sm:text-sm font-medium text-emerald-300">
                  {t.savingsBannerPrefix}{' '}
                  <strong className="font-mono font-bold text-[#B8F34A] tabular-nums">
                    ₹{maxSavingsOnRoute}
                  </strong>{' '}
                  {t.savingsBannerSuffix}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="text-xs text-slate-300 sm:text-right font-mono tabular-nums">
                Pickup in {lowestFareQuote.estimatedPickupMinutes} min ·{' '}
                {lowestFareQuote.estimatedJourneyMinutes} min journey
              </div>
              <button
                type="button"
                onClick={() => onSelectOfferToBook(lowestFareQuote, highestComparableFare)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white font-display font-bold text-sm transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap shadow-md"
              >
                Book Lowest Fare (₹{lowestFareQuote.totalEstimatedFare})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sorting & Filtering Controls Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
        {/* Category & Sort Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {(
              [
                { id: 'all', label: t.filterAll },
                { id: 'bike', label: t.filterBike },
                { id: 'auto', label: t.filterAuto },
                { id: 'cab', label: t.filterCab },
              ] as Array<{ id: CategoryFilter; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  categoryFilter === tab.id
                    ? 'bg-white text-[#181A2F] shadow-xs'
                    : 'text-slate-600 hover:text-[#181A2F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Mode Selector */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort:
            </span>
            {(
              [
                { id: 'lowest_price', label: t.sortByLowestPrice },
                { id: 'fastest_pickup', label: t.sortByFastestPickup },
                { id: 'shortest_journey', label: t.sortByShortestJourney },
                { id: 'best_value', label: t.sortByBestValue },
              ] as Array<{ id: SortMode; label: string }>
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  sortBy === s.id
                    ? 'bg-[#6C4DFF] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget, Pickup Time & Passenger Capacity Row */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Max Budget Filter */}
          <div className="flex items-center justify-between gap-2 bg-[#FAFAFF] px-3 py-2 rounded-xl border border-slate-100">
            <label htmlFor="max-budget-select" className="text-slate-600 font-medium">
              Max Budget:
            </label>
            <select
              id="max-budget-select"
              value={maxBudget ?? ''}
              onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent font-mono font-semibold text-[#181A2F] focus:outline-none cursor-pointer"
            >
              <option value="">Any Budget</option>
              <option value="80">Under ₹80</option>
              <option value="150">Under ₹150</option>
              <option value="250">Under ₹250</option>
              <option value="500">Under ₹500</option>
            </select>
          </div>

          {/* Max Pickup Time Filter */}
          <div className="flex items-center justify-between gap-2 bg-[#FAFAFF] px-3 py-2 rounded-xl border border-slate-100">
            <label htmlFor="max-pickup-select" className="text-slate-600 font-medium">
              Pickup Wait:
            </label>
            <select
              id="max-pickup-select"
              value={maxPickupMinutes ?? ''}
              onChange={(e) =>
                setMaxPickupMinutes(e.target.value ? Number(e.target.value) : null)
              }
              className="bg-transparent font-mono font-semibold text-[#181A2F] focus:outline-none cursor-pointer"
            >
              <option value="">Any ETA</option>
              <option value="4">≤ 4 mins</option>
              <option value="6">≤ 6 mins</option>
              <option value="8">≤ 8 mins</option>
            </select>
          </div>

          {/* Passenger Count Filter */}
          <div className="flex items-center justify-between gap-2 bg-[#FAFAFF] px-3 py-2 rounded-xl border border-slate-100">
            <label htmlFor="passenger-count-select" className="text-slate-600 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Passengers:
            </label>
            <select
              id="passenger-count-select"
              value={requiredPassengers}
              onChange={(e) => setRequiredPassengers(Number(e.target.value))}
              className="bg-transparent font-mono font-semibold text-[#181A2F] focus:outline-none cursor-pointer"
            >
              <option value="1">1 Rider (All types)</option>
              <option value="2">2 Riders (Auto/Cab)</option>
              <option value="4">4 Riders (Cab/SUV)</option>
              <option value="6">6 Riders (SUV only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading fare quotes">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2 w-1/2">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
              <div className="h-10 w-28 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State when filters exclude all offers */}
      {!isLoading && eligibleQuotes.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <EmptyStateIllustration variant="quotes" />
          <h3 className="font-display text-lg font-bold text-[#181A2F]">
            No Valid Ride Offers Match Your Current Filters
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            {excludedQuotes.length > 0 && excludedQuotes.every((eq) => eq.quote.quoteStatus === 'EXPIRED')
              ? 'All quotes on this route have expired to protect you from stale pricing. Refresh fares to get current rates.'
              : 'Try broadening your maximum budget, passenger count, or pickup wait filters.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#181A2F] cursor-pointer"
            >
              Reset All Filters
            </button>
            <button
              type="button"
              onClick={onRefreshQuotes}
              className="px-4 py-2.5 rounded-xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white text-xs font-semibold cursor-pointer"
            >
              Refresh Fare Quotes
            </button>
          </div>
        </div>
      )}

      {/* Eligible Offer Cards List */}
      {!isLoading && eligibleQuotes.length > 0 && (
        <div className="space-y-3">
          {eligibleQuotes.map((quote) => {
            const isLowest = lowestFareQuote?.quoteId === quote.quoteId;
            const quoteSavings = savingsByQuoteId[quote.quoteId] || 0;
            const isExpanded = expandedQuoteId === quote.quoteId;

            return (
              <div
                key={quote.quoteId}
                className={`rounded-2xl bg-white transition-all border ${
                  isLowest
                    ? 'border-[#6C4DFF] ring-2 ring-[#6C4DFF]/15 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Vehicle Illustration + Provider & Metadata */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2 rounded-2xl bg-[#FAFAFF] border border-slate-100 shrink-0">
                      <VehicleCategoryIllustration type={quote.rideType} className="w-14 h-10" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-bold text-[#181A2F]">
                          {quote.rideCategoryLabel}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {quote.providerName}
                        </span>
                        {isLowest && (
                          <span className="px-2 py-0.5 rounded-md bg-[#B8F34A] text-[#181A2F] font-display font-extrabold text-[11px] tracking-wide">
                            LOWEST FARE
                          </span>
                        )}
                      </div>

                      {/* Clean unboxed metadata row */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 font-mono tabular-nums">
                        <span className="inline-flex items-center gap-1 text-[#181A2F] font-semibold">
                          <Clock className="w-3.5 h-3.5 text-[#6C4DFF]" />
                          Pickup in {quote.estimatedPickupMinutes} min
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{quote.estimatedJourneyMinutes} min trip</span>
                        <span aria-hidden="true">·</span>
                        <span>{quote.distanceKm.toFixed(1)} km</span>
                        <span aria-hidden="true">·</span>
                        <span>{quote.passengerCapacity} seats</span>
                      </div>

                      {/* Fare Confidence & Source */}
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {quote.fareConfidence === 'FIXED_QUOTE'
                            ? 'Fixed Quote (Includes taxes & fees)'
                            : 'Estimated Meter Range'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Source: {quote.fareSource === 'DEMO_SIMULATION' ? 'Demo Simulation' : 'Partner API'}</span>
                        {quoteSavings > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-700 font-semibold font-mono tabular-nums">
                              Saves ₹{quoteSavings}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Total Price & Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="sm:text-right">
                      <div className="font-mono text-2xl font-extrabold text-[#181A2F] tabular-nums">
                        ₹{quote.totalEstimatedFare}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedQuoteId(isExpanded ? null : quote.quoteId)
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6C4DFF] hover:underline cursor-pointer"
                      >
                        Fee &amp; Policy Details
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectOfferToBook(quote, highestComparableFare)}
                      className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                        isLowest
                          ? 'bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white shadow-xs'
                          : 'bg-[#181A2F] hover:bg-slate-800 text-white'
                      }`}
                    >
                      {quote.bookingFlowType === 'EXTERNAL_REDIRECT' ? (
                        <>
                          Review Partner Handoff
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        t.bookNow
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Transparent Mandatory Fee Breakdown */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-100 bg-[#FAFAFF] rounded-b-2xl text-xs space-y-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono tabular-nums">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <div className="text-slate-500 font-sans text-[11px]">Base + Distance</div>
                        <div className="font-semibold text-[#181A2F]">
                          ₹{quote.mandatoryFees.baseFare + quote.mandatoryFees.distanceCharge}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <div className="text-slate-500 font-sans text-[11px]">Platform Fee</div>
                        <div className="font-semibold text-[#181A2F]">
                          ₹{quote.mandatoryFees.platformFee}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <div className="text-slate-500 font-sans text-[11px]">GST (5%)</div>
                        <div className="font-semibold text-[#181A2F]">
                          ₹{quote.mandatoryFees.gstAmount}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <div className="text-slate-500 font-sans text-[11px]">Airport / Surge</div>
                        <div className="font-semibold text-[#181A2F]">
                          ₹{quote.mandatoryFees.tollOrAirportFee + quote.mandatoryFees.surgeAmount}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1">
                      <span>
                        <strong>Cancellation:</strong> {quote.cancellationPolicy}
                      </span>
                      <span className="font-mono tabular-nums">
                        Issued: {new Date(quote.quoteTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·
                        Expires: {new Date(quote.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Provider Coverage & Unavailable / Excluded Offers Transparency Notice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold text-[#181A2F]">
            <Info className="w-4 h-4 text-[#6C4DFF] shrink-0" />
            <span>Provider Coverage &amp; Transparency Notice</span>
          </div>
          <span className="text-slate-500 font-mono tabular-nums">
            {providerCoverage.respondedProvidersCount}/{providerCoverage.totalConfiguredProviders} adapters active
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Ridezy compares only valid, unexpired INR quotes that include mandatory platform fees and
          applicable taxes. We never claim to compare every market provider unless that provider has
          supplied an active, verified quote for your exact journey.
        </p>

        {providerCoverage.unavailableProviders.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="font-semibold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Unavailable or Unconfigured Providers Excluded from Comparison:
            </div>
            {providerCoverage.unavailableProviders.map((up) => (
              <div key={up.providerName} className="text-slate-600 pl-5">
                <strong>{up.providerName}:</strong> {up.reason}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
