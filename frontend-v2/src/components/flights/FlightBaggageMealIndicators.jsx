import React from "react";
import { useTranslation } from "react-i18next";

export default function FlightBaggageMealIndicators({
  checkedBaggageKg = 20,
  handbagKg = 7,
  isMealIncluded = false,
  className = "",
  compact = false,
  vertical = false,
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex ${
        vertical ? "flex-col items-start gap-1 text-[11px]" : "items-center gap-2.5"
      } text-slate-500 font-semibold ${
        compact ? "text-[10px]" : ""
      } ${className}`}
    >
      {/* Checked Baggage */}
      <span className="flex items-center gap-1.5" title={t('baggage.checkedBaggage')}>
        <span className="material-symbols-outlined text-xs text-emerald-600 select-none">
          work
        </span>
        <span>{checkedBaggageKg} kg{vertical ? ` ${t('baggage.checkedLabel')}` : ""}</span>
      </span>

      {/* Cabin Handbag */}
      <span className="flex items-center gap-1.5" title={t('baggage.cabinHandbag')}>
        <span className="material-symbols-outlined text-xs text-sky-600 select-none">
          backpack
        </span>
        <span>{handbagKg} kg{vertical ? ` ${t('baggage.cabinLabel')}` : ""}</span>
      </span>

      {/* Meal */}
      <span
        className="flex items-center gap-1.5"
        title={isMealIncluded ? t('baggage.complimentary') : t('baggage.inFlightSelection')}
      >
        <span
          className={`material-symbols-outlined text-xs select-none ${
            isMealIncluded ? "text-amber-600" : "text-slate-400"
          }`}
        >
          {isMealIncluded ? "restaurant" : "no_meals"}
        </span>
        <span>{isMealIncluded ? t('baggage.mealIncluded') : t('baggage.noMeal')}</span>
      </span>
    </div>
  );
}
