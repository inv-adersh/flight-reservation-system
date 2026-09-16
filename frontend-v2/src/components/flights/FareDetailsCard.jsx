import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatCurrency as fmtCurr } from "@/utils/formatters";

// flightdetails
export default function FareDetailsCard({
  flight,
  selectedCabin = "ECONOMY",
  passengerCount = 1,
  mealTotal = 0,
  seatTotal = 0,
  extraBaggageTotal = 0,
  onBookingAction,
  actionButtonText,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector((state) => state?.auth) || {};
  const isAuthenticated = Boolean(auth.isAuthenticated || auth.token);

  if (!flight) return null;

  const fareObj = flight.fares?.[selectedCabin];
  const unitFare = Math.round(fareObj ? Number(fareObj.display_price || fareObj.price) : Number(flight.base_fare) || 0);
  const displayCurrency = fareObj?.display_currency || "INR";
  
  const formatCurrency = (amount) => fmtCurr(amount, displayCurrency);

  const cabinAvailableSeats = fareObj?.available_seats ?? flight.available_seats;
  const isWaitlisted = Number(cabinAvailableSeats) === 0;

  // Effective baggage allowances
  const checkedBaggageKg =
    fareObj?.effective_baggage_allowance_kg ??
    fareObj?.baggage_allowance ??
    flight.baggage_weight_allowed_per_person ??
    20;
  const handbagKg =
    fareObj?.effective_handbag_allowance_kg ??
    fareObj?.handbag_allowance ??
    flight.handbag_weight_allowed_per_person ??
    7;

  const getCabinLabel = (cabin) => {
    const norm = (cabin || "ECONOMY").toUpperCase();
    if (norm.includes("BUSINESS")) return t('fareDetails.businessFare');
    if (norm.includes("FIRST")) return t('fareDetails.firstClassFare');
    return t('fareDetails.economyFare');
  };
  const cabinLabel = getCabinLabel(selectedCabin);

  const totalBaseFare = unitFare * passengerCount;
  const subTotalWithExtras = totalBaseFare + mealTotal + seatTotal + extraBaggageTotal;
  const gstAmount = Math.round(subTotalWithExtras * 0.12);
  const grandTotal = subTotalWithExtras + gstAmount;

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
    } else if (onBookingAction) {
      onBookingAction();
    }
  };

  const buttonText = !isAuthenticated
    ? isWaitlisted
      ? t('fareDetails.loginToJoinWaitlist')
      : t('fareDetails.loginToBook')
    : actionButtonText || (isWaitlisted ? t('fareDetails.joinWaitlist') : t('fareDetails.bookTicket'));

  return (
    <div className="booking-container-card w-full shadow-xs animate-fade-in transition-all duration-300">
      <h3 className="text-xl font-bold text-slate-950 mb-4">
        {t('fareDetails.fareDetails')}
      </h3>

      {/* Breakdown Rows */}
      <div className="flex flex-col gap-2 text-xs font-medium text-slate-700">
        <div className="flex items-center justify-between">
          <span>{cabinLabel} {t('fareDetails.perPerson')}</span>
          <span className="text-slate-950 font-bold">
            {formatCurrency(unitFare)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>{t('fareDetails.passengers')}</span>
          <span className="text-slate-950">
            {passengerCount}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
          <span>{t('fareDetails.totalBaseFare')}</span>
          <span className="text-slate-950 font-semibold">
            {formatCurrency(totalBaseFare)}
          </span>
        </div>

        {mealTotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-amber-800 font-semibold">
              <span className="material-symbols-outlined text-sm">restaurant</span>
              {t('fareDetails.inFlightMeals')}
            </span>
            <span className="text-amber-900 font-bold">
              {formatCurrency(mealTotal)}
            </span>
          </div>
        )}

        {seatTotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-blue-800 font-semibold">
              <span className="material-symbols-outlined text-sm">airline_seat_recline_normal</span>
              {t('fareDetails.seatFare')}
            </span>
            <span className="text-blue-900 font-bold">
              {formatCurrency(seatTotal)}
            </span>
          </div>
        )}

        {extraBaggageTotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-indigo-800 font-semibold">
              <span className="material-symbols-outlined text-sm">luggage</span>
              {t('fareDetails.extraLuggage')}
            </span>
            <span className="text-indigo-900 font-bold">
              {formatCurrency(extraBaggageTotal)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>{t('fareDetails.gst')}</span>
          <span className="text-slate-950">
            {formatCurrency(gstAmount)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-300/80 my-5" />

      {/* Grand Total Amount */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs font-semibold text-slate-500">{t('fareDetails.grandTotal')}</span>
        <span className="text-2xl font-bold text-slate-950">
          {formatCurrency(grandTotal)}
        </span>
      </div>

      {/* Booking Action Button */}
      <button
        type="button"
        onClick={handleClick}
        className="w-full mt-6 py-3 px-4 text-sm font-bold rounded-xl cursor-pointer transition-all duration-200 active:scale-95 btn-primary flex items-center justify-center gap-2"
      >
        <span>{buttonText}</span>
        <span className="material-symbols-outlined text-base">arrow_forward</span>
      </button>
    </div>
  );
}
