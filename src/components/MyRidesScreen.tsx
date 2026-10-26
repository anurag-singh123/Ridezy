import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { BookingRecord, GeoPoint } from '../types/ridezy';
import { EmptyStateIllustration, VehicleCategoryIllustration } from './BrandAssets';

interface MyRidesScreenProps {
  bookings: BookingRecord[];
  onOpenActiveBooking: (booking: BookingRecord) => void;
  onRebookRoute: (pickup: GeoPoint, destination: GeoPoint) => void;
}

export const MyRidesScreen: React.FC<MyRidesScreenProps> = ({
  bookings,
  onOpenActiveBooking,
  onRebookRoute,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<BookingRecord | null>(null);

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') {
      return b.bookingStatus !== 'completed' && b.bookingStatus !== 'cancelled';
    }
    return b.bookingStatus === statusFilter;
  });

  return (
    <div className="space-y-5" data-testid="my-rides-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#181A2F]">
            My Rides &amp; Booking Activity
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Track active simulated trips, inspect itemized receipts, or rebook frequent routes.
          </p>
        </div>

        {/* Status Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
          {(
            [
              { id: 'all', label: 'All Rides' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-[#181A2F] shadow-xs'
                  : 'text-slate-600 hover:text-[#181A2F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <EmptyStateIllustration variant="rides" />
          <h2 className="font-display text-lg font-bold text-[#181A2F]">
            No Rides in This Category Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Compare fares on the Home screen and book a ride to see your trip timeline and itemized
            receipts here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const isActive =
              booking.bookingStatus !== 'completed' && booking.bookingStatus !== 'cancelled';

            return (
              <div
                key={booking.bookingId}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-2xl bg-[#FAFAFF] border border-slate-100 shrink-0">
                      <VehicleCategoryIllustration type={booking.rideType} className="w-12 h-9" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold text-base text-[#181A2F]">
                          {booking.rideCategoryLabel} · {booking.providerName}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-mono text-xs text-slate-500">{booking.bookingId}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        <span className="inline-flex items-center gap-1 font-sans">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{booking.distanceKm.toFixed(1)} km</span>
                        <span aria-hidden="true">·</span>
                        <span>{booking.paymentMethod.toUpperCase()} (Demo)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="font-mono text-xl font-extrabold text-[#181A2F] tabular-nums">
                      ₹{booking.fare}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      {booking.bookingStatus === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed · Saved ₹{booking.savedAmount}
                        </span>
                      )}
                      {booking.bookingStatus === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelled
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[#6C4DFF] font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          Active: {booking.bookingStatus.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pickup & Destination Route Line */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-[#FAFAFF] text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#6C4DFF] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-slate-500">Pickup</div>
                      <div className="font-semibold text-[#181A2F] truncate">
                        {booking.pickup.label}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6B6B] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-slate-500">Destination</div>
                      <div className="font-semibold text-[#181A2F] truncate">
                        {booking.destination.label}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-xs text-slate-500">
                    Driver: <strong className="text-[#181A2F]">{booking.driver.name}</strong> ·{' '}
                    <span className="font-mono">{booking.driver.registrationNumber}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#181A2F] cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#6C4DFF]" />
                      Fare Receipt
                    </button>

                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => onOpenActiveBooking(booking)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white text-xs font-semibold cursor-pointer"
                      >
                        Track Live Status
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRebookRoute(booking.pickup, booking.destination)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181A2F] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Compare Route Again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Itemized Fare Receipt Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 bg-[#181A2F]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-[#181A2F]">
                  Demo Fare Receipt ({selectedReceipt.bookingId})
                </h3>
                <p className="text-xs text-slate-500">{selectedReceipt.providerName}</p>
              </div>
              <span className="font-mono font-extrabold text-xl text-[#181A2F] tabular-nums">
                ₹{selectedReceipt.fare}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Base Fare</span>
                <span>₹{selectedReceipt.mandatoryFees.baseFare}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Distance ({selectedReceipt.distanceKm.toFixed(1)} km)</span>
                <span>₹{selectedReceipt.mandatoryFees.distanceCharge}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Platform Fee</span>
                <span>₹{selectedReceipt.mandatoryFees.platformFee}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">GST (5%)</span>
                <span>₹{selectedReceipt.mandatoryFees.gstAmount}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-[#181A2F]">
                <span className="font-sans">Total Paid ({selectedReceipt.paymentMethod.toUpperCase()} Demo)</span>
                <span>₹{selectedReceipt.fare}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="font-sans">Highest Comparable Quote on Route</span>
                <span>₹{selectedReceipt.highestComparableFare}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span className="font-sans">Verified Savings Recorded</span>
                <span>₹{selectedReceipt.savedAmount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-[#181A2F] text-white text-xs font-semibold cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
