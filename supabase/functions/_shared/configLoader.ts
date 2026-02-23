import type { PartnerConfig, TaxProfile, TaxBracket } from "./calculatorEngine.ts";

export const DEFAULT_PARTNER_CONFIG: PartnerConfig = {
    max_dti_ratio: 0.33,
    max_age: 80,
    max_loan_term_years: 30,
    rent_recognition_first_property: 0.0,
    rent_recognition_investment: 0.8,
    default_interest_rate: 5.0,
    lawyer_fee_percent: 1.0,
    broker_fee_percent: 2.0,
    vat_percent: 18.0,
    advisor_fee_fixed: 9000,
    other_fee_fixed: 3000,
    rental_yield_default: 3.0,
    rent_warning_high_multiplier: 1.5,
    rent_warning_low_multiplier: 0.7,
    enable_rent_validation: true,
    enable_what_if_calculator: true,
    show_amortization_table: true,
    max_amortization_months: 360,
};

export async function loadPartnerConfig(
    supabaseClient: any,
    partnerId: string | null
): Promise<PartnerConfig> {
    if (!partnerId) {
        return DEFAULT_PARTNER_CONFIG;
    }

    try {
        const { data, error } = await supabaseClient
            .from('partners')
            .select(`
        max_dti_ratio,
        max_age,
        max_loan_term_years,
        rent_recognition_first_property,
        rent_recognition_investment,
        default_interest_rate,
        lawyer_fee_percent,
        broker_fee_percent,
        vat_percent,
        advisor_fee_fixed,
        other_fee_fixed,
        rental_yield_default,
        rent_warning_high_multiplier,
        rent_warning_low_multiplier,
        enable_rent_validation,
        enable_what_if_calculator,
        show_amortization_table,
        max_amortization_months
      `)
            .eq('id', partnerId)
            .single();

        if (error || !data) {
            console.error('Failed to load partner config:', error);
            return DEFAULT_PARTNER_CONFIG;
        }

        return {
            max_dti_ratio: data.max_dti_ratio ?? DEFAULT_PARTNER_CONFIG.max_dti_ratio,
            max_age: data.max_age ?? DEFAULT_PARTNER_CONFIG.max_age,
            max_loan_term_years: data.max_loan_term_years ?? DEFAULT_PARTNER_CONFIG.max_loan_term_years,
            rent_recognition_first_property: data.rent_recognition_first_property ?? DEFAULT_PARTNER_CONFIG.rent_recognition_first_property,
            rent_recognition_investment: data.rent_recognition_investment ?? DEFAULT_PARTNER_CONFIG.rent_recognition_investment,
            default_interest_rate: data.default_interest_rate ?? DEFAULT_PARTNER_CONFIG.default_interest_rate,
            lawyer_fee_percent: data.lawyer_fee_percent ?? DEFAULT_PARTNER_CONFIG.lawyer_fee_percent,
            broker_fee_percent: data.broker_fee_percent ?? DEFAULT_PARTNER_CONFIG.broker_fee_percent,
            vat_percent: data.vat_percent ?? DEFAULT_PARTNER_CONFIG.vat_percent,
            advisor_fee_fixed: data.advisor_fee_fixed ?? DEFAULT_PARTNER_CONFIG.advisor_fee_fixed,
            other_fee_fixed: data.other_fee_fixed ?? DEFAULT_PARTNER_CONFIG.other_fee_fixed,
            rental_yield_default: data.rental_yield_default ?? DEFAULT_PARTNER_CONFIG.rental_yield_default,
            rent_warning_high_multiplier: data.rent_warning_high_multiplier ?? DEFAULT_PARTNER_CONFIG.rent_warning_high_multiplier,
            rent_warning_low_multiplier: data.rent_warning_low_multiplier ?? DEFAULT_PARTNER_CONFIG.rent_warning_low_multiplier,
            enable_rent_validation: data.enable_rent_validation ?? DEFAULT_PARTNER_CONFIG.enable_rent_validation,
            enable_what_if_calculator: data.enable_what_if_calculator ?? DEFAULT_PARTNER_CONFIG.enable_what_if_calculator,
            show_amortization_table: data.show_amortization_table ?? DEFAULT_PARTNER_CONFIG.show_amortization_table,
            max_amortization_months: data.max_amortization_months ?? DEFAULT_PARTNER_CONFIG.max_amortization_months,
        };
    } catch (error) {
        console.error('Exception loading partner config:', error);
        return DEFAULT_PARTNER_CONFIG;
    }
}

export async function loadSystemTaxBrackets(
    supabaseClient: any
): Promise<Record<TaxProfile, TaxBracket[]> | undefined> {
    try {
        const { data, error } = await supabaseClient
            .from('system_settings')
            .select('value')
            .eq('key', 'tax_brackets')
            .single();

        if (error) {
            console.warn('Could not load system tax brackets, using defaults:', error.message);
            return undefined;
        }

        return data.value;
    } catch (err) {
        console.error('Exception loading system tax brackets:', err);
        return undefined;
    }
}
