import React, { useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import {
  FareQuoteRecord,
  PaymentMethodType,
  UserProfile,
} from '../types/ridezy';
import { VehicleCategoryIllustration } from './BrandAssets';

interface BookingFlowModalProps {
  quote: FareQuoteRecord;
  highestComparableFare: number;
  user: UserProfile;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onQuickAuthenticateGuest: () => void;
  onConfirmBooking: (paymentMethod: PaymentMethodType) => void;
}

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
  quote,
  highestComparableFare,
  user,
  isSubmitting,
  errorMessage,
  onClose,
  onQuickAuthenticateGuest,
  onConfirmBooking,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodType>(
    user.preferredPaymentMethod || 'upi'
  );
  const [upiId, setUpiId] = useState<string>('anurag@okaxis');
  const [externalHandoffAcknowledged, setExternalHandoffAcknowledged] = useState<boolean>(false);

  const savings = Math.max(0, highestComparableFare - quote.totalEstimatedFare);
  const isExternalRedirect = quote.bookingFlowType === 'EXTERNAL_REDIRECT';

  const paymentOptions: Array<{
    id: PaymentMethodType;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'upi',
      label: 'UPI Instant Pay (Demo)',
      subtitle: 'GPay, PhonePe, Paytm • Zero gateway fee',
      icon: <Smartphone className="w-4 h-4 text-[#6C4DFF]" />,
    },
    {
      id: 'card',
      label: 'Credit / Debit Card (Demo)',
      subtitle: 'Tokenized Visa / RuPay / Mastercard',
      icon: <CreditCard className="w-4 h-4 text-[#6C4DFF]" />,
    },
    {
      id: 'cash',
      label: 'Cash / Pay Driver Directly',
      subtitle: 'Pay via QR or cash at trip completion',
      icon: <Banknote className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'wallet',
      label: 'Ridezy Demo Pass Wallet',
      subtitle: 'Simulated balance: ₹850.00',
      icon: <Wallet className="w-4 h-4 text-[#FF6B6B]" />,
    },
  ];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.isGuest) return;
    if (isExternalRedirect && !externalHandoffAcknowledged) return;
    onConfirmBooking(selectedPayment);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#181A2F]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-[#FAFAFF]">
          <div>
            <h2 id="booking-modal-title" className="font-display text-lg font-bold text-[#181A2F]">
              Confirm Your Ride Summary
            </h2>
            <p className="text-xs text-slate-500">
              Demo Mode Simulation · No real monetary charge will be made
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking confirmation modal"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#181A2F] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4 overflow-y-auto">
          {/* Selected Vehicle & Provider Card */}
          <div className="p-4 rounded-2xl bg-[#FAFAFF] border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white border border-slate-100">
                <VehicleCategoryIllustration type={quote.rideType} className="w-12 h-9" />
              </div>
              <div>
                <div className="font-display font-bold text-[#181A2F] text-sm sm:text-base">
                  {quote.rideCategoryLabel} · {quote.providerName}
                </div>
                <div className="text-xs text-slate-600 font-mono tabular-nums">
                  Pickup in {quote.estimatedPickupMinutes} min · {quote.distanceKm.toFixed(1)} km ·{' '}
                  {quote.estimatedJourneyMinutes} min
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-2xl font-extrabold text-[#181A2F] tabular-nums">
                ₹{quote.totalEstimatedFare}
              </div>
              {savings > 0 && (
                <div className="text-[11px] font-semibold text-emerald-700 font-mono tabular-nums">
                  Saves ₹{savings}
                </div>
              )}
            </div>
          </div>

          {/* Pickup & Destination Route Summary */}
          <div className="p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#6C4DFF] shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-500 font-medium">Pickup Location</div>
                <div className="font-semibold text-[#181A2F]">{quote.pickup.label}</div>
                <div className="text-slate-500">{quote.pickup.address}</div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-2.5 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#FF6B6B] shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-500 font-medium">Destination</div>
                <div className="font-semibold text-[#181A2F]">{quote.destination.label}</div>
                <div className="text-slate-500">{quote.destination.address}</div>
              </div>
            </div>
          </div>

          {/* Transparent Fare & Mandatory Charges Breakdown */}
          <div className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="font-display font-bold text-[#181A2F] text-sm mb-1">
              Complete Fare Breakdown
            </div>
            <div className="flex justify-between text-slate-600 font-mono tabular-nums">
              <span className="font-sans">Base Fare</span>
              <span>₹{quote.mandatoryFees.baseFare}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-mono tabular-nums">
              <span className="font-sans">Distance Charge ({quote.distanceKm.toFixed(1)} km)</span>
              <span>₹{quote.mandatoryFees.distanceCharge}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-mono tabular-nums">
              <span className="font-sans">Platform &amp; Dispatch Fee</span>
              <span>₹{quote.mandatoryFees.platformFee}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-mono tabular-nums">
              <span className="font-sans">GST (5% Mandatory Tax)</span>
              <span>₹{quote.mandatoryFees.gstAmount}</span>
            </div>
            {quote.mandatoryFees.tollOrAirportFee > 0 && (
              <div className="flex justify-between text-slate-600 font-mono tabular-nums">
                <span className="font-sans">Airport / Toll Fee</span>
                <span>₹{quote.mandatoryFees.tollOrAirportFee}</span>
              </div>
            )}
            {quote.mandatoryFees.surgeAmount > 0 && (
              <div className="flex justify-between text-amber-700 font-mono tabular-nums">
                <span className="font-sans">Peak Demand Adjustment</span>
                <span>₹{quote.mandatoryFees.surgeAmount}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-[#181A2F] font-mono tabular-nums">
              <span className="font-display">Total Payable ({quote.fareConfidence === 'FIXED_QUOTE' ? 'Fixed' : 'Estimated'})</span>
              <span>₹{quote.totalEstimatedFare}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="block font-display font-bold text-sm text-[#181A2F]">
              Select Payment Method (Simulated Demo)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {paymentOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPayment(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    selectedPayment === opt.id
                      ? 'border-[#6C4DFF] bg-[#6C4DFF]/5 ring-1 ring-[#6C4DFF]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{opt.icon}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#181A2F] truncate">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">{opt.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>

            {selectedPayment === 'upi' && (
              <div className="pt-1">
                <label htmlFor="upi-vpa-input" className="block text-[11px] text-slate-600 mb-1">
                  Demo UPI ID (Verified on backend simulation):
                </label>
                <input
                  id="upi-vpa-input"
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-[#181A2F] focus:outline-none focus:border-[#6C4DFF]"
                />
              </div>
            )}
          </div>

          {/* External Provider Handoff Notice when applicable */}
          {isExternalRedirect && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-semibold flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-amber-700 shrink-0" />
                External Partner Fleet Handoff
              </div>
              <p className="leading-relaxed">
                {quote.providerName} uses an external partner booking flow. Ridezy never claims an
                external ride is booked until the partner confirms dispatch.
              </p>
              <label className="flex items-center gap-2 cursor-pointer font-medium pt-1">
                <input
                  type="checkbox"
                  checked={externalHandoffAcknowledged}
                  onChange={(e) => setExternalHandoffAcknowledged(e.target.checked)}
                  className="rounded border-amber-400 text-[#6C4DFF]"
                />
                <span>Simulate partner confirmation in Ridezy Demo Mode</span>
              </label>
            </div>
          )}

          {/* Guest Authentication Requirement Gate (Section 8) */}
          {user.isGuest && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-[#B8F34A]">
                <Lock className="w-4 h-4 shrink-0" />
                Authentication Required Before Confirming Bookings
              </div>
              <p className="text-slate-300 leading-relaxed">
                You are currently exploring Ridezy as a Guest. Sign in to your account to confirm
                this ride and save your fare comparison history.
              </p>
              <button
                type="button"
                onClick={onQuickAuthenticateGuest}
                className="px-4 py-2 rounded-xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white font-semibold cursor-pointer"
              >
                Sign In as Anurag Singh (Demo Account)
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Confirm CTA */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                user.isGuest ||
                (isExternalRedirect && !externalHandoffAcknowledged)
              }
              className="flex-1 py-3.5 px-5 rounded-2xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white font-display font-bold text-sm transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-[#6C4DFF]/25"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting
                ? 'Requesting Demo Booking...'
                : `Confirm Demo Booking • ₹${quote.totalEstimatedFare}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
