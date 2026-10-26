import React, { useState } from 'react';
import {
  Bell,
  Building2,
  CheckCircle2,
  Code2,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  KeyRound,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Server,
  Shield,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  LanguageCode,
  PaymentMethodType,
  RideCategoryType,
  SavedLocationRecord,
  UserProfile,
} from '../types/ridezy';
import { PROVIDER_ADAPTERS } from '../services/providerAdapters';
import { AvatarPortraitSvg } from './BrandAssets';

interface ProfileSettingsScreenProps {
  user: UserProfile;
  savedLocations: SavedLocationRecord[];
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onAddSavedLocation: (label: string, address: string, type: SavedLocationRecord['type']) => void;
  onDeleteSavedLocation: (locationId: string) => void;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  user,
  savedLocations,
  onUpdateUser,
  onAddSavedLocation,
  onDeleteSavedLocation,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'addresses' | 'architecture'>('account');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'phone' | 'reset'>('login');
  const [authEmail, setAuthEmail] = useState<string>(user.email || 'anurag.singh01018@gmail.com');
  const [authName, setAuthName] = useState<string>(user.displayName || 'Anurag Singh');
  const [authPhone, setAuthPhone] = useState<string>(user.phone || '+91 98450 72109');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  // New Saved Location Form
  const [newLocLabel, setNewLocLabel] = useState<string>('');
  const [newLocAddress, setNewLocAddress] = useState<string>('');
  const [newLocType, setNewLocType] = useState<SavedLocationRecord['type']>('custom');

  // Legal / Help Info Modal
  const [activeInfoDoc, setActiveInfoDoc] = useState<'help' | 'terms' | 'privacy' | null>(null);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'reset') {
      setAuthFeedback(`Password reset instructions simulated for ${authEmail}.`);
      return;
    }
    onUpdateUser({
      displayName: authName || 'Anurag Singh',
      email: authEmail || 'anurag.singh01018@gmail.com',
      phone: authPhone || '+91 98450 72109',
      isGuest: false,
    });
    setAuthPassword('');
    setAuthFeedback('Authenticated in Ridezy Demo Session (Never stores plaintext passwords).');
    setTimeout(() => setAuthFeedback(null), 4000);
  };

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocLabel.trim() || !newLocAddress.trim()) return;
    onAddSavedLocation(newLocLabel.trim(), newLocAddress.trim(), newLocType);
    setNewLocLabel('');
    setNewLocAddress('');
  };

  return (
    <div className="space-y-6" data-testid="profile-settings-screen">
      {/* Top User Identity Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarPortraitSvg name={user.displayName} role="user" className="w-14 h-14" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#181A2F]">
                {user.isGuest ? 'Guest Explorer' : user.displayName}
              </h1>
              <span className="text-xs font-semibold text-[#6C4DFF]">
                {user.isGuest ? 'Guest Mode (Sign in to confirm bookings)' : 'Authenticated Demo Account'}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {user.isGuest
                ? 'Browse fares freely · Sign in below to save addresses & confirm rides'
                : `${user.email} · ${user.phone}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Language Switcher (English / Hindi) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => onUpdateUser({ preferredLanguage: 'en' })}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                user.preferredLanguage === 'en'
                  ? 'bg-white text-[#181A2F] shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onUpdateUser({ preferredLanguage: 'hi' })}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                user.preferredLanguage === 'hi'
                  ? 'bg-white text-[#181A2F] shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              हिंदी (Hindi)
            </button>
          </div>

          {!user.isGuest && (
            <button
              type="button"
              onClick={() => onUpdateUser({ isGuest: true })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto inline-flex">
        <button
          type="button"
          onClick={() => setActiveSubTab('account')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${
            activeSubTab === 'account'
              ? 'bg-white text-[#181A2F] shadow-xs'
              : 'text-slate-600 hover:text-[#181A2F]'
          }`}
        >
          Profile, Auth &amp; Preferences
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('addresses')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${
            activeSubTab === 'addresses'
              ? 'bg-white text-[#181A2F] shadow-xs'
              : 'text-slate-600 hover:text-[#181A2F]'
          }`}
        >
          Saved Addresses ({savedLocations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('architecture')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${
            activeSubTab === 'architecture'
              ? 'bg-white text-[#181A2F] shadow-xs'
              : 'text-slate-600 hover:text-[#181A2F]'
          }`}
        >
          Architecture &amp; Production Setup
        </button>
      </div>

      {/* SUB-TAB 1: ACCOUNT, AUTH & PREFERENCES */}
      {activeSubTab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Authentication & Personal Information */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-[#181A2F]">
                  {user.isGuest ? 'Sign In or Create Account' : 'Personal Information & Auth'}
                </h2>
                <p className="text-xs text-slate-500">
                  Firebase Auth compatible architecture · Passwords never stored in plaintext
                </p>
              </div>
              <UserCheck className="w-5 h-5 text-[#6C4DFF]" />
            </div>

            {user.isGuest && (
              <div className="flex items-center gap-1.5 text-xs">
                {(
                  [
                    { id: 'login', label: 'Email Login' },
                    { id: 'register', label: 'Register' },
                    { id: 'phone', label: 'Phone OTP' },
                    { id: 'reset', label: 'Reset Password' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAuthMode(m.id)}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      authMode === m.id
                        ? 'bg-[#6C4DFF] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {(authMode === 'register' || !user.isGuest) && (
                <div>
                  <label htmlFor="profile-name-input" className="block font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="profile-name-input"
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[#181A2F] focus:outline-none focus:border-[#6C4DFF]"
                  />
                </div>
              )}

              {authMode !== 'phone' && (
                <div>
                  <label htmlFor="profile-email-input" className="block font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="profile-email-input"
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[#181A2F] focus:outline-none focus:border-[#6C4DFF]"
                  />
                </div>
              )}

              {(authMode === 'phone' || !user.isGuest) && (
                <div>
                  <label htmlFor="profile-phone-input" className="block font-medium text-slate-700 mb-1">
                    Mobile Number (India +91)
                  </label>
                  <input
                    id="profile-phone-input"
                    type="tel"
                    required
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[#181A2F] font-mono focus:outline-none focus:border-[#6C4DFF]"
                  />
                </div>
              )}

              {user.isGuest && authMode !== 'reset' && (
                <div>
                  <label htmlFor="profile-pass-input" className="block font-medium text-slate-700 mb-1">
                    {authMode === 'phone' ? '6-Digit Demo OTP' : 'Password (Tokenized Auth)'}
                  </label>
                  <input
                    id="profile-pass-input"
                    type="password"
                    placeholder={authMode === 'phone' ? 'Enter any 6 digits for Demo OTP' : '••••••••'}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[#181A2F] focus:outline-none focus:border-[#6C4DFF]"
                  />
                </div>
              )}

              {authFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authFeedback}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white font-display font-bold text-xs cursor-pointer transition-transform active:scale-[0.98]"
              >
                {user.isGuest
                  ? authMode === 'reset'
                    ? 'Send Password Reset Link'
                    : 'Sign In to Ridezy Account'
                  : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Right: Ride Preferences, Notifications, Privacy & Legal */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 text-xs">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#181A2F]">
                Ride &amp; Payment Preferences
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pref-ride-type" className="block font-medium text-slate-600 mb-1">
                    Preferred Ride Category
                  </label>
                  <select
                    id="pref-ride-type"
                    value={user.preferredRideType}
                    onChange={(e) =>
                      onUpdateUser({ preferredRideType: e.target.value as RideCategoryType })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-[#181A2F]"
                  >
                    <option value="bike">Bike</option>
                    <option value="auto">Auto</option>
                    <option value="mini">Mini Cab</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pref-pay-method" className="block font-medium text-slate-600 mb-1">
                    Preferred Payment Method
                  </label>
                  <select
                    id="pref-pay-method"
                    value={user.preferredPaymentMethod}
                    onChange={(e) =>
                      onUpdateUser({
                        preferredPaymentMethod: e.target.value as PaymentMethodType,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-[#181A2F]"
                  >
                    <option value="upi">UPI Instant Pay</option>
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="wallet">Ridezy Pass Wallet</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="flex items-center gap-2 font-medium text-[#181A2F]">
                    <Bell className="w-4 h-4 text-[#6C4DFF]" />
                    Fare Drop &amp; Driver Arrival Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={user.notificationsEnabled}
                    onChange={(e) => onUpdateUser({ notificationsEnabled: e.target.checked })}
                    className="rounded text-[#6C4DFF]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="flex items-center gap-2 font-medium text-[#181A2F]">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Auto-Share Night Trips with Emergency Contact
                  </span>
                  <input
                    type="checkbox"
                    checked={user.shareLiveLocationWithContacts}
                    onChange={(e) =>
                      onUpdateUser({ shareLiveLocationWithContacts: e.target.checked })
                    }
                    className="rounded text-[#6C4DFF]"
                  />
                </label>
              </div>

              {/* Help, Terms, and Privacy Links */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveInfoDoc('help')}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-[#181A2F] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#6C4DFF]" />
                  Help &amp; Support
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoDoc('terms')}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-[#181A2F] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#6C4DFF]" />
                  Terms &amp; Conditions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoDoc('privacy')}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-[#181A2F] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#6C4DFF]" />
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SAVED ADDRESSES */}
      {activeSubTab === 'addresses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="font-display text-base sm:text-lg font-bold text-[#181A2F]">
              Saved Places (Home, Office &amp; Frequent Hubs)
            </h2>
            <div className="divide-y divide-slate-100">
              {savedLocations.map((loc) => (
                <div
                  key={loc.locationId}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <MapPin className="w-4 h-4 text-[#6C4DFF] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-[#181A2F]">{loc.label}</div>
                      <div className="text-slate-500 truncate">{loc.address}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete saved location ${loc.label}`}
                    onClick={() => onDeleteSavedLocation(loc.locationId)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="font-display text-base font-bold text-[#181A2F]">
              Add a Saved Location
            </h3>
            <form onSubmit={handleAddAddressSubmit} className="space-y-3 text-xs">
              <div>
                <label htmlFor="loc-label" className="block font-medium text-slate-700 mb-1">
                  Label (e.g. Gym, Parents&apos; Home)
                </label>
                <input
                  id="loc-label"
                  type="text"
                  required
                  value={newLocLabel}
                  onChange={(e) => setNewLocLabel(e.target.value)}
                  placeholder="Enter label..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label htmlFor="loc-address" className="block font-medium text-slate-700 mb-1">
                  Complete Street Address / Landmark
                </label>
                <input
                  id="loc-address"
                  type="text"
                  required
                  value={newLocAddress}
                  onChange={(e) => setNewLocAddress(e.target.value)}
                  placeholder="e.g. 12th Main, HAL 2nd Stage, Indiranagar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label htmlFor="loc-type" className="block font-medium text-slate-700 mb-1">
                  Category Tag
                </label>
                <select
                  id="loc-type"
                  value={newLocType}
                  onChange={(e) => setNewLocType(e.target.value as SavedLocationRecord['type'])}
                  className="w-full p-2 rounded-xl border border-slate-200"
                >
                  <option value="custom">Custom Bookmark</option>
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                  <option value="railway">Railway Station</option>
                  <option value="airport">Airport</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#6C4DFF] text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PROVIDER ARCHITECTURE, EXTENSIBILITY & PRODUCTION CREDENTIALS */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-5 text-xs">
          {/* Provider Adapter Registry */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 font-display text-base font-bold text-[#181A2F]">
              <Server className="w-4 h-4 text-[#6C4DFF]" />
              <span>Modular Provider Adapter Registry (Section 15)</span>
            </div>
            <p className="text-slate-600">
              Each provider implements the common <code className="font-mono">RideProviderAdapter</code>{' '}
              interface (<code className="font-mono">checkAvailability</code>,{' '}
              <code className="font-mono">requestFareQuotes</code>,{' '}
              <code className="font-mono">validateQuote</code>,{' '}
              <code className="font-mono">initiateBooking</code>,{' '}
              <code className="font-mono">getBookingStatus</code>,{' '}
              <code className="font-mono">cancelBooking</code>). Ridezy never scrapes unauthorized
              third-party APIs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {PROVIDER_ADAPTERS.map((a) => (
                <div
                  key={a.provider.providerId}
                  className="p-3.5 rounded-2xl bg-[#FAFAFF] border border-slate-200/80 space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-[#181A2F]">
                    <span>{a.provider.name}</span>
                    <span className="font-mono text-[11px] text-[#6C4DFF]">
                      {a.provider.integrationStatus}
                    </span>
                  </div>
                  <div className="text-slate-600">{a.provider.statusNote}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Supported: {a.provider.supportedRideTypes.join(', ')} · Flow:{' '}
                    {a.provider.bookingFlowType}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required External Services & Credentials for Production */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 font-display text-base font-bold text-[#181A2F]">
              <KeyRound className="w-4 h-4 text-[#FF6B6B]" />
              <span>Production Setup &amp; External Credentials Checklist</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-[#FAFAFF] space-y-1">
                <div className="font-bold text-[#181A2F]">1. Google Maps Platform</div>
                <div className="text-slate-600">
                  Set <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> for live vector map
                  tiles, Places Autocomplete, and Directions API route polylines.
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-[#FAFAFF] space-y-1">
                <div className="font-bold text-[#181A2F]">2. Firebase Auth &amp; Cloud Firestore</div>
                <div className="text-slate-600">
                  Set <code className="font-mono">VITE_FIREBASE_PROJECT_ID</code> &amp;{' '}
                  <code className="font-mono">VITE_FIREBASE_API_KEY</code> to persist collections (
                  <code className="font-mono">users, savedLocations, providers, fareQuotes, bookings, trips, payments</code>
                  ) with RBAC security rules.
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-[#FAFAFF] space-y-1">
                <div className="font-bold text-[#181A2F]">3. Payment Gateway (Razorpay / UPI)</div>
                <div className="text-slate-600">
                  Set server-side <code className="font-mono">PAYMENT_GATEWAY_KEY_ID</code> and{' '}
                  <code className="font-mono">PAYMENT_GATEWAY_KEY_SECRET</code> in{' '}
                  <code className="font-mono">server.ts</code> for webhook signature verification.
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-[#FAFAFF] space-y-1">
                <div className="font-bold text-[#181A2F]">4. ONDC / Beckn Mobility &amp; Driver App</div>
                <div className="text-slate-600">
                  Set <code className="font-mono">ONDC_BAP_ID</code> &amp;{' '}
                  <code className="font-mono">ONDC_SIGNING_PRIVATE_KEY</code> on the server, or
                  connect Ridezy&apos;s extensible Driver &amp; Admin portals.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal / Help Modal */}
      {activeInfoDoc && (
        <div
          className="fixed inset-0 z-50 bg-[#181A2F]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xl text-xs">
            <h3 className="font-display font-bold text-lg text-[#181A2F]">
              {activeInfoDoc === 'help' && 'Help & Customer Support'}
              {activeInfoDoc === 'terms' && 'Ridezy Terms & Conditions'}
              {activeInfoDoc === 'privacy' && 'Ridezy Privacy Policy'}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {activeInfoDoc === 'help' &&
                'Ridezy compares valid ride quotes across participating mobility adapters. In Demo Mode, all quotes, driver profiles, and payments are simulated for testing.'}
              {activeInfoDoc === 'terms' &&
                'Fare quotes are valid until their stated expiry timestamp. Mandatory platform fees, GST, and applicable airport/toll charges are always included in the displayed total.'}
              {activeInfoDoc === 'privacy' &&
                'Users can only read and modify their own private data. Location permissions are requested only when selecting GPS pickup, and secret API keys remain strictly on the server.'}
            </p>
            <button
              type="button"
              onClick={() => setActiveInfoDoc(null)}
              className="w-full py-2.5 rounded-xl bg-[#181A2F] text-white font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
