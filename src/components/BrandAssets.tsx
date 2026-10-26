import React from 'react';
import { RideCategoryType } from '../types/ridezy';

export const RidezyAppIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect width="64" height="64" rx="18" fill="#6C4DFF" />
    {/* Subtle road swoop at base */}
    <path
      d="M12 52C22 43 42 43 52 52"
      stroke="#B8F34A"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    {/* Location pin body */}
    <path
      d="M32 10C22.611 10 15 17.611 15 27C15 37.8 27.6 48.8 30.85 51.45C31.52 52 32.48 52 33.15 51.45C36.4 48.8 49 37.8 49 27C49 17.611 41.389 10 32 10Z"
      fill="#FAFAFF"
    />
    {/* Coral inner circle with subtle Rupee / forward motion glyph */}
    <circle cx="32" cy="26.5" r="9.5" fill="#FF6B6B" />
    <path
      d="M28.5 22.5H35.5M28.5 25.5H34.5M29.5 22.5C32.5 22.5 33.5 27.5 29.5 27.5L34.5 31.5"
      stroke="#FAFAFF"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RidezyLogo: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className="inline-flex items-center gap-2.5 select-none">
    <RidezyAppIcon size={compact ? 32 : 36} />
    <span className="font-display text-xl font-extrabold tracking-tight text-[#181A2F] whitespace-nowrap">
      Ridezy
    </span>
  </div>
);

export const VehicleCategoryIllustration: React.FC<{
  type: RideCategoryType;
  className?: string;
}> = ({ type, className = 'w-14 h-10' }) => {
  switch (type) {
    case 'bike':
      return (
        <svg viewBox="0 0 72 48" fill="none" className={className} aria-hidden="true">
          <circle cx="18" cy="35" r="8" stroke="#181A2F" strokeWidth="3" fill="#FAFAFF" />
          <circle cx="54" cy="35" r="8" stroke="#181A2F" strokeWidth="3" fill="#FAFAFF" />
          <path
            d="M18 35L28 20H42L48 35H28L18 35Z"
            fill="#6C4DFF"
            stroke="#181A2F"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M44 14H50L54 35" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" />
          <rect x="23" y="17" width="13" height="4" rx="2" fill="#181A2F" />
          <circle cx="55" cy="19" r="3" fill="#B8F34A" stroke="#181A2F" strokeWidth="1.5" />
        </svg>
      );
    case 'auto':
      return (
        <svg viewBox="0 0 72 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M14 22C14 14 20 10 34 10H46C52 10 56 15 58 24V34H14V22Z"
            fill="#B8F34A"
            stroke="#181A2F"
            strokeWidth="2.5"
          />
          <path
            d="M14 25H58V34C58 35.6569 56.6569 37 55 37H17C15.3431 37 14 35.6569 14 34V25Z"
            fill="#16A34A"
            stroke="#181A2F"
            strokeWidth="2.5"
          />
          <rect x="22" y="14" width="14" height="9" rx="2" fill="#FAFAFF" stroke="#181A2F" strokeWidth="2" />
          <rect x="40" y="14" width="11" height="9" rx="2" fill="#FAFAFF" stroke="#181A2F" strokeWidth="2" />
          <circle cx="21" cy="37" r="6" fill="#FAFAFF" stroke="#181A2F" strokeWidth="3" />
          <circle cx="53" cy="37" r="6" fill="#FAFAFF" stroke="#181A2F" strokeWidth="3" />
        </svg>
      );
    case 'mini':
      return (
        <svg viewBox="0 0 72 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 27L20 15H46L56 25L62 27V36H10V29L12 27Z"
            fill="#6C4DFF"
            stroke="#181A2F"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M22 18H34V25H18L22 18Z" fill="#FAFAFF" stroke="#181A2F" strokeWidth="1.8" />
          <path d="M37 18H45L51 25H37V18Z" fill="#FAFAFF" stroke="#181A2F" strokeWidth="1.8" />
          <circle cx="21" cy="36" r="6.5" fill="#FAFAFF" stroke="#181A2F" strokeWidth="3" />
          <circle cx="51" cy="36" r="6.5" fill="#FAFAFF" stroke="#181A2F" strokeWidth="3" />
          <rect x="57" y="28" width="4" height="3" rx="1" fill="#B8F34A" />
        </svg>
      );
    case 'sedan':
      return (
        <svg viewBox="0 0 72 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M8 27L18 15H47L57 25L65 27V36H7V27H8Z"
            fill="#FF6B6B"
            stroke="#181A2F"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M20 18H34V25H15L20 18Z" fill="#FAFAFF" stroke="#181A2F" strokeWidth="1.8" />
          <path d="M37 18H46L53 25H37V18Z" fill="#FAFAFF" stroke="#181A2F" strokeWidth="1.8" />
          <circle cx="20" cy="36" r="6.5" fill="#FAFAFF" stroke="#181A2F" strokeWidth="3" />
          <circle cx="52" cy="36" r="6.5" fill="#FAFAFF" stroke="#181A2F" strokeWidth="3" />
          <rect x="59" y="28" width="5" height="3" rx="1" fill="#B8F34A" />
        </svg>
      );
    case 'suv':
      return (
        <svg viewBox="0 0 72 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M8 25L15 12H51L60 23L65 25V36H7V25H8Z"
            fill="#181A2F"
            stroke="#181A2F"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M17 15H31V23H13L17 15Z" fill="#FAFAFF" />
          <path d="M34 15H49L55 23H34V15Z" fill="#FAFAFF" />
          <rect x="18" y="9" width="28" height="2" rx="1" fill="#6C4DFF" />
          <circle cx="20" cy="36" r="7" fill="#FAFAFF" stroke="#6C4DFF" strokeWidth="3" />
          <circle cx="52" cy="36" r="7" fill="#FAFAFF" stroke="#6C4DFF" strokeWidth="3" />
          <rect x="59" y="26" width="5" height="4" rx="1" fill="#B8F34A" />
        </svg>
      );
  }
};

export const EmptyStateIllustration: React.FC<{
  variant?: 'rides' | 'quotes' | 'savings';
}> = ({ variant = 'rides' }) => (
  <svg
    viewBox="0 0 180 120"
    fill="none"
    className="w-36 h-24 mx-auto"
    aria-hidden="true"
  >
    <rect x="15" y="20" width="150" height="84" rx="20" fill="#F2EFFF" />
    <path
      d="M35 82C60 58 120 58 145 82"
      stroke="#6C4DFF"
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="6 6"
    />
    <circle cx="52" cy="70" r="9" fill="#FF6B6B" />
    <circle cx="128" cy="70" r="9" fill="#B8F34A" stroke="#181A2F" strokeWidth="2.5" />
    {variant === 'quotes' ? (
      <g>
        <rect x="68" y="34" width="44" height="28" rx="8" fill="#181A2F" />
        <text x="90" y="53" textAnchor="middle" fill="#B8F34A" fontSize="13" fontWeight="bold">
          ₹?
        </text>
      </g>
    ) : (
      <g>
        <circle cx="90" cy="48" r="16" fill="#6C4DFF" />
        <path
          d="M84 48L88 52L97 43"
          stroke="#FAFAFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    )}
  </svg>
);

export const AvatarPortraitSvg: React.FC<{
  name: string;
  role?: 'driver' | 'user';
  className?: string;
}> = ({ name, role = 'user', className = 'w-11 h-11' }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={`relative rounded-2xl flex items-center justify-center font-display font-bold select-none shrink-0 overflow-hidden ${
        role === 'driver'
          ? 'bg-[#181A2F] text-[#B8F34A] border border-[#6C4DFF]/30'
          : 'bg-[#6C4DFF]/12 text-[#6C4DFF] border border-[#6C4DFF]/25'
      } ${className}`}
      aria-hidden="true"
    >
      <span className="text-sm tracking-tight">{initials || 'RZ'}</span>
    </div>
  );
};

export const SplashScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => (
  <div className="fixed inset-0 z-50 bg-[#181A2F] text-[#FAFAFF] flex flex-col items-center justify-between p-8">
    <div className="w-full max-w-md flex items-center justify-between text-xs text-slate-400">
      <span>Ridezy Mobility • India</span>
      <span>Demo Mode Ready</span>
    </div>

    <div className="flex flex-col items-center text-center max-w-md my-auto">
      <div className="relative mb-6">
        <RidezyAppIcon size={84} className="shadow-2xl shadow-[#6C4DFF]/40 rounded-3xl" />
      </div>
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
        Ridezy
      </h1>
      <p className="text-lg font-medium text-[#B8F34A] mb-2">
        Every Ride. The Right Price.
      </p>
      <p className="text-sm text-slate-300 max-w-xs leading-relaxed mb-8">
        Compare Bike, Auto, and Cab fares across participating networks in seconds and book the lowest valid fare.
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="w-full sm:w-auto min-w-[240px] px-7 py-3.5 rounded-2xl bg-[#6C4DFF] hover:bg-[#5b3ce8] text-white font-display font-bold text-sm transition-transform active:scale-[0.98] cursor-pointer shadow-lg shadow-[#6C4DFF]/30"
      >
        Explore Ridezy Now
      </button>
    </div>

    <div className="w-full max-w-md text-center text-xs text-slate-400">
      Transparent mandatory fee calculation · Zero hidden surge surprises
    </div>
  </div>
);
