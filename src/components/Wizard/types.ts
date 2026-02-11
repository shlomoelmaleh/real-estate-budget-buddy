import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { CalculatorFormValues } from '@/components/budget/types';
import { Translations } from '@/lib/translations';
import { CalculatorResults } from '@/lib/calculator';

export interface StepProps {
    control: Control<CalculatorFormValues>;
    errors: FieldErrors<CalculatorFormValues>;
    register?: UseFormRegister<CalculatorFormValues>;
    setValue?: UseFormSetValue<CalculatorFormValues>;
    watch?: UseFormWatch<CalculatorFormValues>;
    t: Translations;
}

export interface StepRevealProps extends StepProps {
    results: CalculatorResults | null;
    isLoading: boolean;
    onSendReport: () => void;
    isSending: boolean;
    onBack?: () => void;
}
