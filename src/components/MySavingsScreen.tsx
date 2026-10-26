import React from 'react';
import {
  Award,
  CheckCircle2,
  PiggyBank,
  Receipt,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { BookingRecord, LanguageCode } from '../types/ridezy';
import { TRANSLATIONS } from '../i18n/translations';
import { calculateSavingsDashboard } from '../utils/fareEngine';

interface MySavingsScreenProps {
  bookings: BookingRecord[];
  language: LanguageCode;
  onStartNewComparison: () => void;
}

export const MySavingsScreen: React.FC<MySavingsScreenProps> = ({
  bookings,
  language,
  onStartNewComparison,
}) => {
  const t = TRANSLATIONS[language];
  const summary = calculateSavingsDashboard(bookings);
  const completedRides = bookings.filter((b) => b.bookingStatus === 'completed');

  const maxMonthlySaved = Math.max(
    220,
    ...summary.monthlySavings.map((m) => m.saved)
  );

  return (
    <div className="space-y-6" data-testid="my-savings-screen">
      {/* Top Friendly Header Banner */}
      <div className="rounded-3xl bg-[#181A2F] text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B8F34A]">
            <Sparkles className="w-4 h-4" />
            <span>{t.mySavingsFriendlyQuote}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.mySavingsHeadline}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Savings are calculated strictly from recorded comparable offers that were valid at the
            moment of booking—never from unverified fares or unavailable providers.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewComparison}
          className="px-5 py-3 rounded-2xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white font-display font-bold text-xs sm:text-sm transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap self-start sm:self-center"
        >
          Compare Another Ride
        </button>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.estimatedSavings}</span>
            <PiggyBank className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
            ₹{summary.totalVerifiedSavings}
          </div>
          <div className="text-[11px] text-slate-500">
            vs. highest comparable quotes
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.completedRides}</span>
            <CheckCircle2 className="w-4 h-4 text-[#6C4DFF]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#181A2F] tabular-nums">
            {summary.completedRidesCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Demo completed journeys
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.totalSpent}</span>
            <Receipt className="w-4 h-4 text-[#6C4DFF]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#181A2F] tabular-nums">
            ₹{summary.totalAmountSpent}
          </div>
          <div className="text-[11px] text-slate-500">
            All-inclusive INR total
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.avgFarePerRide}</span>
            <TrendingDown className="w-4 h-4 text-[#FF6B6B]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#181A2F] tabular-nums">
            ₹{summary.averageFarePerRide}
          </div>
          <div className="text-[11px] text-slate-500">
            Per completed trip
          </div>
        </div>
      </div>

      {/* Monthly Savings Chart & Per-Ride Audit Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Monthly Savings Bar Chart */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#181A2F]">
                Monthly Savings Trend (2026 Demo Baseline)
              </h2>
              <p className="text-xs text-slate-500">
                Cumulative savings from selecting cheaper eligible offers
              </p>
            </div>
            <Award className="w-5 h-5 text-[#6C4DFF]" />
          </div>

          <div className="pt-4 pb-2 grid grid-cols-6 gap-3 items-end h-52 border-b border-slate-100">
            {summary.monthlySavings.map((item) => {
              const barHeightPercent = Math.max(
                14,
                Math.min(100, Math.round((item.saved / maxMonthlySaved) * 100))
              );
              const isCurrentMonth = item.month === 'Oct';

              return (
                <div
                  key={item.month}
                  className="flex flex-col items-center justify-end h-full gap-1.5"
                >
                  <span className="font-mono text-[11px] font-bold text-[#181A2F] tabular-nums">
                    ₹{item.saved}
                  </span>
                  <div
                    className={`w-full max-w-[38px] rounded-t-xl transition-all ${
                      isCurrentMonth ? 'bg-[#6C4DFF]' : 'bg-[#6C4DFF]/30 hover:bg-[#6C4DFF]/50'
                    }`}
                    style={{ height: `${barHeightPercent}%` }}
                    title={`${item.month}: Saved ₹${item.saved} across ${item.rides} rides`}
                  />
                  <span className="text-xs font-semibold text-slate-600">{item.month}</span>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>October reflects your live session completed bookings.</span>
            <span className="font-mono font-semibold text-[#181A2F] tabular-nums">
              6-Mo Demo Total: ₹
              {summary.monthlySavings.reduce((acc, m) => acc + m.saved, 0)}
            </span>
          </div>
        </div>

        {/* Right: Recorded Comparable Offer Ledger */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#181A2F]">
              Verified Ride Savings Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Audit trail comparing your paid fare against the highest comparable valid quote
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {completedRides.map((ride) => (
              <div key={ride.bookingId} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-semibold text-[#181A2F] truncate">
                    {ride.pickup.area} → {ride.destination.area} ({ride.rideCategoryLabel})
                  </div>
                  <div className="text-slate-500 truncate">
                    {ride.providerName} ·{' '}
                    {new Date(ride.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums shrink-0">
                  <div className="font-bold text-emerald-700">Saved ₹{ride.savedAmount}</div>
                  <div className="text-[11px] text-slate-500">
                    Paid ₹{ride.fare} vs ₹{ride.highestComparableFare}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
