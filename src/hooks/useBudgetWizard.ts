import { useState, useEffect } from 'react';
import { UseFormGetValues, UseFormTrigger, UseFormSetValue } from 'react-hook-form';
import { CalculatorFormValues } from '@/components/budget/types';
import { CalculatorResults, parseFormattedNumber, AmortizationRow } from '@/lib/calculator';
import { usePartner } from '@/contexts/PartnerContext';
import { analyticsQueue } from '@/lib/analyticsQueue';
import { toast } from 'sonner';

export interface UseBudgetWizardProps {
    partner: any | null;
    language: string;
    trigger: UseFormTrigger<CalculatorFormValues>;
    getValues: UseFormGetValues<CalculatorFormValues>;
    setValue: UseFormSetValue<CalculatorFormValues>;
    t: any;
}

export function useBudgetWizard({
    partner,
    language,
    trigger,
    getValues,
    setValue,
    t,
}: UseBudgetWizardProps) {
    const { config, partner: contextPartner, binding } = usePartner(); // Using partner config from context
    // --- STATE MANAGEMENT ---
    const [step, setStep] = useState(0);
    const [sessionId] = useState(() => {
        try {
            return crypto.randomUUID();
        } catch (e) {
            return Math.random().toString(36).substring(2) + Date.now().toString(36);
        }
    });

    // --- RESUME LOGIC (From Admin) ---
    useEffect(() => {
        const savedStep = sessionStorage.getItem('wizard_return_step');
        if (savedStep) {
            console.log('[BudgetWizard] Resuming from step:', savedStep);
            setStep(Number(savedStep));
            sessionStorage.removeItem('wizard_return_step'); // Clear so refresh still resets
        }
    }, []);
    const [isExiting0, setIsExiting0] = useState(false);
    const [results, setResults] = useState<CalculatorResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [animClass, setAnimClass] = useState('animate-in slide-in-from-right fade-in duration-500');

    // Store calculation data for email
    const [calcData, setCalcData] = useState<{
        inputs: Record<string, unknown>;
        results: Record<string, unknown>;
        amortizationSummary: Record<string, unknown>;
        yearlyBalanceData: Array<Record<string, unknown>>;
        paymentBreakdownData: Array<Record<string, unknown>>;
        csvData: string;
    } | null>(null);

    // --- FUNNEL TRACKING ---
    useEffect(() => {
        const timer = setTimeout(() => {
            analyticsQueue.enqueue({
                session_id: sessionId,
                step_reached: step,
                event_type: 'entered',
                partner_id: partner?.id || null,
                language: language,
            });
            console.log(`[Funnel] Logged 'entered' for Step ${step}`);
        }, 500);

        return () => clearTimeout(timer);
    }, [step, sessionId, partner, language]);

    // --- PARTNER CONFIG SYNC ---
    useEffect(() => {
        if (config) {
            console.log("[PartnerConfig] Syncing form defaults from config", config);
            setValue('interest', config.default_interest_rate.toString());
            setValue('lawyerPct', config.lawyer_fee_percent.toString());
            setValue('brokerPct', config.broker_fee_percent.toString());
            setValue('vatPct', config.vat_percent.toString());
            setValue('advisorFee', config.advisor_fee_fixed.toString());
            setValue('otherFee', config.other_fee_fixed.toString());
            setValue('ratio', (config.max_dti_ratio * 100).toString());
            setValue('maxAge', config.max_age.toString());
            setValue('rentalYield', config.rental_yield_default.toString());
            setValue('rentRecognition', (config.rent_recognition_investment * 100).toString());
        }
    }, [config, setValue]);

    // --- HELPER FUNCTIONS ---
    const calculateLTV = (isFirstProperty: boolean, isIsraeliCitizen: boolean): number => {
        if (!isFirstProperty) return 50;
        if (isIsraeliCitizen) return 75;
        return 50;
    };

    const logCompletion = () => {
        analyticsQueue.enqueue({
            session_id: sessionId,
            step_reached: step,
            event_type: 'completed',
            partner_id: partner?.id || null,
            language: language,
        });
        console.log(`[Funnel] Logged 'completed' for Step ${step}`);
    };

    // --- NAVIGATION LOGIC ---
    const handleNext = async () => {
        if (step === 0) {
            logCompletion();
            setIsExiting0(true);
            setTimeout(() => {
                setStep(1);
                setIsExiting0(false);
                window.scrollTo({ top: 0 });
            }, 500);
            return;
        }

        let fields: (keyof CalculatorFormValues)[] = [];

        switch (step) {
            case 1:
                fields = ['fullName', 'age', 'targetPropertyPrice'];
                break;
            case 2:
                fields = ['equity', 'netIncome'];
                break;
            case 3:
                fields = ['isFirstProperty', 'isIsraeliCitizen', 'isIsraeliTaxResident'];
                break;
            default:
                break;
        }

        const isValid = await trigger(fields);
        if (isValid) {
            logCompletion();
            const nextStep = step + 1;
            setAnimClass('animate-in slide-in-from-right fade-in duration-500');
            setStep(nextStep);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setAnimClass('animate-in slide-in-from-left fade-in duration-500');
        setStep((s) => Math.max(0, s - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- CALCULATION LOGIC ---
    const handleCalculate = async () => {
        const isValid = await trigger(['isRented', 'expectedRent', 'targetPropertyPrice', 'budgetCap']);
        if (!isValid) return;

        setIsLoading(true);
        logCompletion();
        setAnimClass('animate-in fade-in duration-700');
        setStep(5);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const data = getValues();

        // Use form values (synced from partner config but potentially overridden by user)
        const inputs = {
            equity: parseFormattedNumber(data.equity),
            ltv: calculateLTV(data.isFirstProperty, data.isIsraeliCitizen),
            netIncome: parseFormattedNumber(data.netIncome),
            ratio: parseFormattedNumber(data.ratio || (config.max_dti_ratio * 100).toString()),
            age: parseFormattedNumber(data.age),
            maxAge: parseFormattedNumber(data.maxAge || config.max_age.toString()),
            interest: parseFloat(data.interest || config.default_interest_rate.toString()) || 0,
            isRented: data.isRented,
            rentalYield: parseFloat(data.rentalYield || config.rental_yield_default.toString()) || 0,
            rentRecognition: parseFormattedNumber(data.rentRecognition || (config.rent_recognition_investment * 100).toString()),
            budgetCap: data.budgetCap ? parseFormattedNumber(data.budgetCap) : null,
            isFirstProperty: data.isFirstProperty,
            isIsraeliTaxResident: data.isIsraeliTaxResident,
            expectedRent: data.isRented && data.expectedRent ? parseFormattedNumber(data.expectedRent) : null,
            lawyerPct: parseFloat(data.lawyerPct || config.lawyer_fee_percent.toString()) || 0,
            brokerPct: parseFloat(data.brokerPct || config.broker_fee_percent.toString()) || 0,
            vatPct: parseFormattedNumber(data.vatPct || config.vat_percent.toString()),
            advisorFee: parseFormattedNumber(data.advisorFee || config.advisor_fee_fixed.toString()),
            otherFee: parseFormattedNumber(data.otherFee || config.other_fee_fixed.toString()),
        };

        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-budget`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                    },
                    body: JSON.stringify({
                        ...inputs,
                        partnerId: partner?.id ?? binding?.partnerId ?? null,
                        config: config || null,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Calculate] Function error:', response.status, errorText);
                throw new Error(`Calculation failed: ${response.status}`);
            }

            const { results: calcResults, amortization: amortRows } = await response.json();

            if (calcResults) {
                // Prepare chart data
                const yearlyBalanceData: { year: number; balance: number }[] = [];
                for (let i = 0; i < amortRows.length; i++) {
                    if ((i + 1) % 12 === 0 || i === amortRows.length - 1) {
                        yearlyBalanceData.push({
                            year: Math.ceil((i + 1) / 12),
                            balance: amortRows[i].closing,
                        });
                    }
                }

                const paymentBreakdownData: { year: number; interest: number; principal: number }[] = [];
                for (let yearIndex = 0; yearIndex < Math.ceil(amortRows.length / 12); yearIndex++) {
                    const startMonth = yearIndex * 12;
                    const endMonth = Math.min(startMonth + 12, amortRows.length);
                    let yearlyInterest = 0;
                    let yearlyPrincipal = 0;
                    for (let i = startMonth; i < endMonth; i++) {
                        yearlyInterest += amortRows[i].interest;
                        yearlyPrincipal += amortRows[i].principal;
                    }
                    paymentBreakdownData.push({
                        year: yearIndex + 1,
                        interest: yearlyInterest,
                        principal: yearlyPrincipal,
                    });
                }

                // CSV generation
                const asciiHeaders = ['Month', 'Opening', 'Payment', 'Principal', 'Interest', 'Closing'];
                const isRTL = language === 'he';
                const headers = isRTL ? [...asciiHeaders].reverse() : asciiHeaders;
                const csvHeader = headers.join(',') + '\n';
                const csvRows = (amortRows || [])
                    .map((row: AmortizationRow) => {
                        const values = isRTL
                            ? [row.closing, row.interest, row.principal, row.payment, row.opening, row.month]
                            : [row.month, row.opening, row.payment, row.principal, row.interest, row.closing];
                        return values.map((v) => (typeof v === 'number' ? v.toFixed(2) : v)).join(',');
                    })
                    .join('\n');
                const csvData = csvHeader + csvRows;

                const amortizationSummary = {
                    totalMonths: amortRows.length,
                    firstPayment:
                        amortRows.length > 0
                            ? { principal: amortRows[0].principal, interest: amortRows[0].interest }
                            : { principal: 0, interest: 0 },
                    lastPayment:
                        amortRows.length > 0
                            ? {
                                principal: amortRows[amortRows.length - 1].principal,
                                interest: amortRows[amortRows.length - 1].interest,
                            }
                            : { principal: 0, interest: 0 },
                };

                const simulationInputs = {
                    ...data,
                    ltv: inputs.ltv.toString(),
                    maxAge: inputs.maxAge.toString(),
                    interest: inputs.interest.toString(),
                    rentalYield: inputs.rentalYield.toString(),
                    rentRecognition: inputs.rentRecognition.toString(),
                    lawyerPct: inputs.lawyerPct.toString(),
                    brokerPct: inputs.brokerPct.toString(),
                    vatPct: inputs.vatPct.toString(),
                    advisorFee: inputs.advisorFee.toString(),
                    otherFee: inputs.otherFee.toString(),
                    ratio: inputs.ratio.toString(),
                    targetPropertyPrice: data.targetPropertyPrice || '',
                };

                const simulationResults = {
                    ...calcResults,
                    shekelRatio: calcResults.totalCost / calcResults.loanAmount,
                };

                setCalcData({
                    inputs: simulationInputs,
                    results: simulationResults,
                    amortizationSummary,
                    yearlyBalanceData,
                    paymentBreakdownData,
                    csvData,
                });

                // Artificial loading delay
                setTimeout(() => {
                    setResults(calcResults);
                    setIsLoading(false);
                }, 2000);
            } else {
                toast.error('Calculation failed');
                setStep(4);
                setIsLoading(false);
            }
        } catch (error) {
            toast.error(t.emailError || 'An error occurred.');
            setStep(4);
            setIsLoading(false);
        }
    };

    // --- EMAIL SUBMISSION LOGIC ---
    const handleSendReport = async () => {
        const isValid = await trigger(['email', 'phone']);
        if (!isValid) return;

        setIsSending(true);
        const data = getValues();
        const partnerId = partner?.id || null;

        try {
            const { supabase } = await import('@/integrations/supabase/client');

            const { error: emailError } = await supabase.functions.invoke('send-report-email', {
                body: {
                    recipientEmail: data.email,
                    recipientName: data.fullName || 'Client',
                    recipientPhone: data.phone,
                    language: language,
                    inputs: calcData?.inputs,
                    results: calcData?.results,
                    amortizationSummary: calcData?.amortizationSummary,
                    yearlyBalanceData: calcData?.yearlyBalanceData,
                    paymentBreakdownData: calcData?.paymentBreakdownData,
                    csvData: calcData?.csvData,
                    partnerId: partner?.id ?? binding?.partnerId ?? null,
                    partnerEmail: partner?.email || null,
                    partnerName: partner?.name || null,
                },
            });

            if (emailError) throw emailError;

            setShowConfirmation(true);
        } catch (error) {
            toast.error(t.emailError);
        }
        setIsSending(false);
    };

    return {
        step,
        sessionId,
        isExiting0,
        results,
        isLoading,
        isSending,
        showConfirmation,
        animClass,
        calcData,
        handleNext,
        handleBack,
        handleCalculate,
        handleSendReport,
        setShowConfirmation,
    };
}
