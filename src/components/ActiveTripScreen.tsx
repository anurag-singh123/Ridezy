import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Copy,
  Headphones,
  MapPin,
  MessageSquareWarning,
  Phone,
  Share2,
  ShieldAlert,
  Star,
  XCircle,
} from 'lucide-react';
import { BookingRecord, BookingStatusType } from '../types/ridezy';
import { AvatarPortraitSvg, VehicleCategoryIllustration } from './BrandAssets';
import { InteractiveRouteMap } from './InteractiveRouteMap';

interface ActiveTripScreenProps {
  booking: BookingRecord;
  onUpdateBookingStatus: (bookingId: string, nextStatus: BookingStatusType) => void;
  onCancelBooking: (bookingId: string, reason: string) => void;
  onBackToHome: () => void;
}

const STATUS_STEPS: Array<{
  id: BookingStatusType;
  label: string;
  description: string;
}> = [
  {
    id: 'searching',
    label: 'Searching for driver',
    description: 'Broadcasting your request to nearby partner vehicles (Simulated)...',
  },
  {
    id: 'assigned',
    label: 'Driver assigned',
    description: 'Demo driver has accepted your ride and is preparing to depart.',
  },
  {
    id: 'arriving',
    label: 'Driver arriving',
    description: 'Vehicle is approaching your pickup gate. Share OTP PIN to start trip.',
  },
  {
    id: 'started',
    label: 'Trip started',
    description: 'En route to destination along the selected urban corridor.',
  },
  {
    id: 'completed',
    label: 'Trip completed',
    description: 'You have arrived! Savings have been recorded in your dashboard.',
  },
];

export const ActiveTripScreen: React.FC<ActiveTripScreenProps> = ({
  booking,
  onUpdateBookingStatus,
  onCancelBooking,
  onBackToHome,
}) => {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [activeSafetyModal, setActiveSafetyModal] = useState<'sos' | 'issue' | 'support' | 'cancel' | null>(null);
  const [issueText, setIssueText] = useState<string>('');
  const [issueSubmitted, setIssueSubmitted] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Driver taking too long');

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.id === booking.bookingStatus);
  const isFinished =
    booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled';

  const handleAdvanceNextStep = () => {
    if (currentStepIndex >= 0 && currentStepIndex < STATUS_STEPS.length - 1) {
      const nextStep = STATUS_STEPS[currentStepIndex + 1].id;
      onUpdateBookingStatus(booking.bookingId, nextStep);
    }
  };

  const handleShareTripStatus = () => {
    const shareSummary = `Ridezy Demo Trip (${booking.bookingId}): ${booking.driver.name} in ${booking.driver.vehicleModel} (${booking.driver.registrationNumber}) from ${booking.pickup.label} to ${booking.destination.label}. Status: ${booking.bookingStatus.toUpperCase()}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareSummary).catch(() => {});
    }
    setShareFeedback('Simulated live tracking link & driver details copied to clipboard!');
    setTimeout(() => setShareFeedback(null), 4000);
  };

  const handleReportIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) return;
    setIssueSubmitted(true);
    setTimeout(() => {
      setIssueSubmitted(false);
      setIssueText('');
      setActiveSafetyModal(null);
    }, 1500);
  };

  return (
    <div className="space-y-5" data-testid="active-trip-screen">
      {/* Top Simulation Banner */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
        <div>
          <strong>Simulated Demo Booking ({booking.bookingId}):</strong> Driver details, vehicle
          plates, and trip progression below are simulated for evaluation and do not represent a
          real-world dispatched vehicle.
        </div>
        <button
          type="button"
          onClick={onBackToHome}
          className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-semibold text-[#181A2F] hover:bg-amber-100/50 cursor-pointer whitespace-nowrap"
        >
          Book Another Ride
        </button>
      </div>

      {/* Main Two-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Booking Status Progression & Driver Card */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status Header Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#6C4DFF]">
                  {booking.providerName} · {booking.rideCategoryLabel}
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#181A2F] mt-0.5">
                  {booking.bookingStatus === 'cancelled'
                    ? 'Ride Cancelled'
                    : STATUS_STEPS[Math.max(0, currentStepIndex)]?.label}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {booking.bookingStatus === 'cancelled'
                    ? `Cancelled reason: ${booking.cancelledReason || 'User requested cancellation'}`
                    : STATUS_STEPS[Math.max(0, currentStepIndex)]?.description}
                </p>
              </div>

              {/* Start Ride OTP PIN Box */}
              {booking.bookingStatus !== 'cancelled' && (
                <div className="px-3.5 py-2 rounded-2xl bg-[#181A2F] text-white text-right shrink-0">
                  <div className="text-[10px] text-slate-300">Start Ride PIN (Demo)</div>
                  <div className="font-mono text-lg font-extrabold text-[#B8F34A] tracking-widest tabular-nums">
                    {booking.driver.otpPin}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Step Progression Bar */}
            {booking.bookingStatus !== 'cancelled' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-5 gap-1.5">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx <= currentStepIndex;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => onUpdateBookingStatus(booking.bookingId, step.id)}
                        className="text-left group cursor-pointer focus:outline-none"
                      >
                        <div
                          className={`h-2 rounded-full transition-colors ${
                            isDone ? 'bg-[#6C4DFF]' : 'bg-slate-200 group-hover:bg-slate-300'
                          }`}
                        />
                        <div
                          className={`mt-1.5 text-[11px] font-medium truncate ${
                            idx === currentStepIndex
                              ? 'text-[#6C4DFF] font-bold'
                              : isDone
                              ? 'text-[#181A2F]'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Demo Progression Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Demo Controller: Click any step above or advance status
                  </span>
                  {!isFinished ? (
                    <button
                      type="button"
                      onClick={handleAdvanceNextStep}
                      className="px-4 py-2 rounded-xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white text-xs font-display font-bold cursor-pointer transition-transform active:scale-[0.98]"
                    >
                      Simulate Next Step →
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Trip Completed — ₹{booking.savedAmount} Saved!
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Demo Driver & Vehicle Profile Card (Section 10) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <AvatarPortraitSvg name={booking.driver.name} role="driver" className="w-12 h-12" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-bold text-[#181A2F] text-base">
                      {booking.driver.name}
                    </h3>
                    <span className="text-xs text-amber-700 font-semibold">
                      [Simulated Demo Profile]
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-mono tabular-nums mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[#181A2F] font-semibold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {booking.driver.rating.toFixed(1)} (Demo Rating)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{booking.driver.tripsCompleted} simulated trips</span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block p-2 rounded-2xl bg-[#FAFAFF] border border-slate-100">
                <VehicleCategoryIllustration type={booking.rideType} className="w-14 h-10" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAFAFF]">
                <div className="text-slate-500">Vehicle Model</div>
                <div className="font-semibold text-[#181A2F] mt-0.5">{booking.driver.vehicleModel}</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAFAFF]">
                <div className="text-slate-500">Registration Plate</div>
                <div className="font-mono font-bold text-[#181A2F] mt-0.5">
                  {booking.driver.registrationNumber}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAFAFF] col-span-2 sm:col-span-1">
                <div className="text-slate-500">Total Fare &amp; Payment</div>
                <div className="font-mono font-bold text-[#181A2F] mt-0.5 tabular-nums">
                  ₹{booking.fare} · {booking.paymentMethod.toUpperCase()} (Demo)
                </div>
              </div>
            </div>

            {/* Safety & Trip Actions Bar (Section 10) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-500">
                Safety &amp; Trip Assistance Toolkit
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleShareTripStatus}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#181A2F] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#6C4DFF]" />
                  Share Trip
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSafetyModal('sos')}
                  className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-50 text-xs font-semibold text-red-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  Emergency Info
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSafetyModal('support')}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#181A2F] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-[#6C4DFF]" />
                  Support
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSafetyModal('issue')}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#181A2F] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600" />
                  Report Issue
                </button>
              </div>

              {shareFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>{shareFeedback}</span>
                </div>
              )}

              {!isFinished && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveSafetyModal('cancel')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel This Demo Ride
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Route Map & Journey Summary */}
        <div className="lg:col-span-5 space-y-4">
          <InteractiveRouteMap
            pickup={booking.pickup}
            destination={booking.destination}
            distanceKm={booking.distanceKm}
            durationMinutes={booking.estimatedDurationMin}
            onSelectPickupFromMap={() => {}}
            onSelectDestinationFromMap={() => {}}
            activeStatusLabel={booking.bookingStatus.toUpperCase()}
          />
        </div>
      </div>

      {/* Safety / Support / Cancellation Modals */}
      {activeSafetyModal && (
        <div
          className="fixed inset-0 z-50 bg-[#181A2F]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xl">
            {activeSafetyModal === 'sos' && (
              <>
                <div className="flex items-center gap-2 text-red-700 font-display font-bold text-lg">
                  <AlertOctagon className="w-5 h-5" />
                  Emergency Assistance (Demo Notice)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Important Safety Transparency:</strong> This emergency assistance panel is
                  a non-operational UI demonstration. It is not connected to live dispatch or
                  emergency responders in Demo Mode.
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div>
                    <strong>National Emergency Number (India):</strong>{' '}
                    <span className="font-mono font-bold">112</span>
                  </div>
                  <div>
                    <strong>Police Control Room:</strong>{' '}
                    <span className="font-mono font-bold">100</span>
                  </div>
                  <div>
                    <strong>Saved Emergency Contact:</strong> Priya Singh (+91 98450 11223)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSafetyModal(null)}
                  className="w-full py-2.5 rounded-xl bg-[#181A2F] text-white text-xs font-semibold cursor-pointer"
                >
                  Close Notice
                </button>
              </>
            )}

            {activeSafetyModal === 'support' && (
              <>
                <h3 className="font-display font-bold text-lg text-[#181A2F]">
                  Ridezy Customer Support
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Need help with Booking <strong>{booking.bookingId}</strong>? Our support channels
                  are simulated in Demo Mode:
                </p>
                <div className="p-3.5 rounded-2xl bg-[#FAFAFF] border border-slate-200 text-xs space-y-1.5">
                  <div>
                    <strong>Support Email:</strong> support-demo@ridezy.in
                  </div>
                  <div>
                    <strong>Helpline (Demo):</strong> +91 80 4090 0000
                  </div>
                  <div>
                    <strong>Driver Masked Contact:</strong> {booking.driver.phoneMasked}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSafetyModal(null)}
                  className="w-full py-2.5 rounded-xl bg-[#6C4DFF] text-white text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </>
            )}

            {activeSafetyModal === 'issue' && (
              <form onSubmit={handleReportIssueSubmit} className="space-y-3">
                <h3 className="font-display font-bold text-lg text-[#181A2F]">
                  Report a Trip Issue
                </h3>
                <p className="text-xs text-slate-600">
                  Log feedback about fare accuracy, pickup location, or vehicle condition for{' '}
                  {booking.bookingId}.
                </p>
                <textarea
                  rows={3}
                  required
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#6C4DFF]"
                />
                {issueSubmitted && (
                  <div className="text-xs font-semibold text-emerald-700">
                    Ticket logged in Demo Mode!
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSafetyModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#6C4DFF] text-white text-xs font-semibold cursor-pointer"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}

            {activeSafetyModal === 'cancel' && (
              <div className="space-y-3">
                <h3 className="font-display font-bold text-lg text-[#181A2F]">
                  Cancel This Demo Ride?
                </h3>
                <p className="text-xs text-slate-600">
                  Select a reason for cancelling booking <strong>{booking.bookingId}</strong> (₹0
                  cancellation fee in Demo Mode):
                </p>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-[#181A2F]"
                >
                  <option value="Driver taking too long">Driver taking too long</option>
                  <option value="Changed my travel plans">Changed my travel plans</option>
                  <option value="Entered wrong pickup or drop address">
                    Entered wrong pickup or drop address
                  </option>
                  <option value="Found a cheaper alternative">Found a cheaper alternative</option>
                </select>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveSafetyModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Keep Ride
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCancelBooking(booking.bookingId, cancelReason);
                      setActiveSafetyModal(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
