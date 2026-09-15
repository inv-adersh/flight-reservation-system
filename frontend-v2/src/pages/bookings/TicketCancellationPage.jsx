import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { handleApiError, logError } from "@/utils/errorUtils";
import { bookingAPI } from "@/services/booking-service/bookingService";
import { waitlistAPI } from "@/services/waitlist-service/waitlistService";
import FlightItineraryCard from "@/components/flights/FlightItineraryCard";
import { formatCurrency as fmtCurr } from "@/utils/formatters";
import { fetchNotifications } from "../../store/notificationsSlice";

export default function TicketCancellationPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isWaitlist = location.pathname.includes("/waitlist");

  const auth = useSelector((state) => state?.auth) || {};
  const isAuthenticated = Boolean(auth.isAuthenticated || auth.token);

  const [detailData, setDetailData] = useState(location.state?.booking || location.state?.waitlist || null);
  const [loading, setLoading] = useState(!detailData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (detailData) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchDetail() {
      try {
        let res;
        if (isWaitlist) {
          res = await waitlistAPI.retrieve(id);
        } else {
          res = await bookingAPI.retrieve(id);
        }
        if (isMounted) {
          setDetailData(res);
        }
      } catch (err) {
        logError('TicketCancellationPage/fetchDetail', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      fetchDetail();
    }
  }, [id, isWaitlist, detailData, isAuthenticated, navigate]);

  const flight = detailData?.flight_detail || detailData?.flight || location.state?.flight || {};
  const passengers = detailData?.passengers || [];
  const seatCount = detailData?.seat_count || passengers.length || 1;
  const unitFare = Number(flight.display_price || flight.base_fare) || 0;
  const totalBaseFare = Math.round(unitFare * seatCount);
  const taxesAndOther = Math.round(totalBaseFare * 0.12);
  const grandTotal = Number(detailData?.display_total_price || detailData?.total_price || detailData?.price || (totalBaseFare + taxesAndOther));
  const displayCurrency = detailData?.display_currency || "INR";

  const formatCurrency = (amount) => fmtCurr(amount, displayCurrency);

  // Cancellation fee calculation
  const cancellationFee = isWaitlist ? 0 : Math.round(grandTotal * 0.1); // 0 fee for waitlist, 10% for confirmed
  const estimatedRefund = Math.max(0, grandTotal - cancellationFee);

  const handleConfirmCancellation = async () => {
    setIsSubmitting(true);
    try {
      if (isWaitlist) {
        const res = await waitlistAPI.cancel(id);
        //console.log(res);
        toast.success(t('ticketCancellation.waitlistSuccess'));
      } else {
        const res = await bookingAPI.cancel(id);
        dispatch(fetchNotifications());
        toast.success(res?.detail || t('ticketCancellation.bookingSuccess'));

      }
      navigate("/my-bookings", { state: { showPastBookings: true } });
    } catch (err) {
      logError('TicketCancellationPage/cancel', err);
      handleApiError(err, { fallback: 'Failed to cancel ticket. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50/60 pt-20 pb-16 px-4 max-w-3xl mx-auto w-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-slate-900 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">{t('ticketCancellation.loading')}</p>
      </div>
    );
  }

  const shortId = detailData?.id ? String(detailData.id).slice(0, 8).toUpperCase() : "BK-893041";

  return (
    <div className="flex-1 min-h-screen mt-16 pt-12 pb-16 px-4 sm:px-6 max-w-3xl mx-auto w-full flex flex-col items-center">
      {/* Header bar */}
      <div className="w-full flex items-center gap-4 mb-6 px-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-950 cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to ticket details
        </button>
      </div>

      <div className="pb-8 ml-5 w-full">
        <h2 className="text-xl font-bold text-slate-950">
          {t('ticketCancellation.cancelTicketTitle', { id: shortId })}
        </h2>
        <p className="text-xs font-bold text-slate-500 mt-1.5 tracking-wide">
          {seatCount === 1 ? t('ticketCancellation.passengerCount_one', { count: seatCount }) : t('ticketCancellation.passengerCount_other', { count: seatCount })}
        </p>
      </div>

      {/* Main Container Card */}
      <div className="booking-container-card w-full space-y-6 shadow-xs text-slate-900 animate-fade-in mb-8">
        {/* Flight Itinerary Summary */}
        <FlightItineraryCard flight={flight} showBadge={false} />
      </div>


      {/* Refund Breakdown */}
      <div className="pb-5 w-full">
        <h4 className="text-xs ml-3 font-bold text-slate-500 tracking-wider mb-6">
          {t('ticketCancellation.refundSummary')}
        </h4>

        <div className="space-y-3 mx-3">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>{t('ticketCancellation.originalAmount')}</span>
            <span className="font-bold text-slate-950">{formatCurrency(grandTotal)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-rose-600 font-medium">
            <span>{t('ticketCancellation.processingFee')}</span>
            <span className="font-bold">
              {cancellationFee === 0 ? t('ticketCancellation.free') : `- ${formatCurrency(cancellationFee)}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-lg font-bold text-slate-950 pt-3 border-t border-slate-200/80">
            <span>{t('ticketCancellation.refundAmount')}</span>
            <span>{formatCurrency(estimatedRefund)}</span>
          </div>
        </div>

        <div className="mt-8 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900 font-medium">
          <span className="material-symbols-outlined text-base text-amber-700 select-none flex-shrink-0 -mt-0.5">
            info
          </span>
          <p className="text-[11px] leading-relaxed">
            {isWaitlist
              ? t('ticketCancellation.waitlistInfo')
              : t('ticketCancellation.bookingInfo')}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 px-5 pb-2 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          className="btn-danger text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-fade-in"
        >
          <span className="material-symbols-outlined text-base">cancel</span>
          {t('ticketCancellation.confirmCancellation')}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="plain-card rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-950 animate-fade-in">
                {t('ticketCancellation.confirmTitle')}
              </h3>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: t('ticketCancellation.confirmMsg', { id: `<strong>#${shortId}</strong>` }) }} />
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{t('ticketCancellation.netRefund')}</span>
              <span className="text-emerald-600">{formatCurrency(estimatedRefund)}</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="btn-secondary flex-1 text-xs py-2.5 rounded-xl"
              >
                {t('ticketCancellation.keepTicket')}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmCancellation}
                className="btn-danger flex-1 text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {t('ticketCancellation.cancelling')}
                  </>
                ) : (
                  t('ticketCancellation.yesCancel')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
