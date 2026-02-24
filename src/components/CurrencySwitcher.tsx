import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CURRENCY_SYMBOLS } from '@/lib/currencyUtils';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export function CurrencySwitcher() {
    const {
        currency,
        setCurrency,
        availableCurrencies,
        isLocked,
        rateLabel,
        isLoading
    } = useCurrency();
    const { t } = useLanguage();

    // If locked (user advanced past step 1), hide the switcher entirely
    if (isLocked) return null;

    // If loading rates, show a minimal skeleton
    if (isLoading) {
        return (
            <div className="flex flex-col items-center gap-2 w-full animate-pulse" dir="ltr">
                <div className="flex justify-center gap-2">
                    <div className="w-16 h-10 bg-slate-200 rounded-full" />
                    <div className="w-16 h-10 bg-slate-200 rounded-full" />
                </div>
            </div>
        );
    }

    // If rates failed to load and we only have ILS, hide the switcher
    if (availableCurrencies.length <= 1) {
        return (
            <div className="flex flex-col items-center gap-1 w-full" dir="ltr">
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Exchange rates currently unavailable</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2 w-full" dir="ltr">
            <div className="flex gap-1.5 p-1 bg-slate-100/80 backdrop-blur-sm rounded-full border border-slate-200 shadow-inner">
                {availableCurrencies.map((code) => {
                    const isSelected = currency === code;
                    return (
                        <button
                            key={code}
                            onClick={() => setCurrency(code)}
                            className={cn(
                                "relative flex items-center justify-center gap-1.5 cursor-pointer",
                                "h-8 px-4 rounded-full text-sm font-semibold transition-all duration-300",
                                isSelected
                                    ? "bg-white text-primary shadow-sm ring-1 ring-slate-200 scale-105"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                            )}
                        >
                            <span className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shadow-sm",
                                isSelected ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"
                            )}>
                                {CURRENCY_SYMBOLS[code]}
                            </span>
                            <span>{code}</span>
                        </button>
                    );
                })}
            </div>

            {/* Rate Badge - Only visible when a foreign currency is selected */}
            {rateLabel && (
                <div className="text-[10px] font-medium text-slate-500 bg-white/60 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-slate-200/50 shadow-sm animate-in fade-in zoom-in duration-300">
                    {rateLabel}
                </div>
            )}
        </div>
    );
}
