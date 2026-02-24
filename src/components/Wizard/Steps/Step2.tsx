import { Controller, useWatch } from 'react-hook-form';
import { Coins, TrendingUp } from 'lucide-react';
import { FormInput } from '@/components/FormInput';
import { StepProps } from '../types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fmt } from '@/lib/currencyUtils';

export function Step2({ control, errors, t }: StepProps) {
    const { symbol, currency, parseInput } = useCurrency();

    const equityInput = useWatch({ control, name: 'equity' });
    const rawEquity = parseFloat(equityInput?.toString().replace(/,/g, '') || '0');
    const ilsEquity = rawEquity > 0 && currency !== 'ILS' ? parseInput(rawEquity) : null;

    const netIncomeInput = useWatch({ control, name: 'netIncome' });
    const rawIncome = parseFloat(netIncomeInput?.toString().replace(/,/g, '') || '0');
    const ilsIncome = rawIncome > 0 && currency !== 'ILS' ? parseInput(rawIncome) : null;

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="space-y-4">
                <Controller
                    name="equity"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label={`${t.equity} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
                            required={true}
                            currencySymbol={symbol}
                            icon={<Coins className="w-4 h-4" />}
                            {...field}
                            formatNumber={true}
                            hasError={!!errors.equity}
                            className="bg-white/50"
                            helperText={ilsEquity ? `≈ ${fmt(ilsEquity, 'ILS')}` : undefined}
                        />
                    )}
                />

                <Controller
                    name="netIncome"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label={`${t.netIncome} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
                            required={true}
                            currencySymbol={symbol}
                            icon={<TrendingUp className="w-4 h-4" />}
                            {...field}
                            formatNumber={true}
                            hasError={!!errors.netIncome}
                            className="bg-white/50"
                            helperText={ilsIncome ? `≈ ${fmt(ilsIncome, 'ILS')}` : undefined}
                        />
                    )}
                />
            </div>

            <p className="text-[10px] text-muted-foreground mt-4 italic">
                {t.convertNotice}
            </p>
        </div>
    );
}
