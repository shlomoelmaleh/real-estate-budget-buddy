import { z } from "zod";

export interface PartnerConfig {
    // Regulatory
    max_dti_ratio: number;                      // 0.25 - 0.50
    max_age: number;                            // 70 - 95
    max_loan_term_years: number;                // 10 - 35
    rent_recognition_first_property: number;    // 0 - 1
    rent_recognition_investment: number;        // 0 - 1

    // Financial
    default_interest_rate: number;              // 1.0 - 15.0
    lawyer_fee_percent: number;                 // 0 - 10
    broker_fee_percent: number;                 // 0 - 10
    vat_percent: number;                        // 0 - 25
    advisor_fee_fixed: number;                  // 0 - 100000
    other_fee_fixed: number;                    // 0 - 100000
    rental_yield_default: number;               // 0 - 20

    // Validation
    rent_warning_high_multiplier: number;       // 1.0 - 3.0
    rent_warning_low_multiplier: number;        // 0.3 - 0.9

    // Feature Flags
    enable_rent_validation: boolean;
    enable_what_if_calculator: boolean;
    show_amortization_table: boolean;
    max_amortization_months: number;            // 12 - 360
}

export const PartnerConfigSchema = z.object({
    // Regulatory
    max_dti_ratio: z.number().min(0.25).max(0.50),
    max_age: z.number().int().min(70).max(95),
    max_loan_term_years: z.number().int().min(10).max(35),
    rent_recognition_first_property: z.number().min(0).max(1),
    rent_recognition_investment: z.number().min(0).max(1),

    // Financial
    default_interest_rate: z.number().min(1.0).max(15.0),
    lawyer_fee_percent: z.number().min(0).max(10),
    broker_fee_percent: z.number().min(0).max(10),
    vat_percent: z.number().min(0).max(25),
    advisor_fee_fixed: z.number().int().min(0).max(100000),
    other_fee_fixed: z.number().int().min(0).max(100000),
    rental_yield_default: z.number().min(0).max(20),

    // Validation
    rent_warning_high_multiplier: z.number().min(1.0).max(3.0),
    rent_warning_low_multiplier: z.number().min(0.3).max(0.9),

    // Feature Flags
    enable_rent_validation: z.boolean(),
    enable_what_if_calculator: z.boolean(),
    show_amortization_table: z.boolean(),
    max_amortization_months: z.number().int().min(12).max(360),
});

export const DEFAULT_PARTNER_CONFIG: PartnerConfig = {
    max_dti_ratio: 0.33,
    max_age: 80,
    max_loan_term_years: 30,
    rent_recognition_first_property: 0.0,
    rent_recognition_investment: 0.8,
    default_interest_rate: 5.0,
    lawyer_fee_percent: 1.0,
    broker_fee_percent: 2.0,
    vat_percent: 17.0,
    advisor_fee_fixed: 9000,
    other_fee_fixed: 3000,
    rental_yield_default: 3.0,
    rent_warning_high_multiplier: 1.5,
    rent_warning_low_multiplier: 0.7,
    enable_rent_validation: true,
    enable_what_if_calculator: true,
    show_amortization_table: true,
    max_amortization_months: 60,
};

export function validatePartnerConfig(config: unknown): PartnerConfig {
    return PartnerConfigSchema.parse(config) as PartnerConfig;
}

export function isValidPartnerConfig(config: unknown): config is PartnerConfig {
    return PartnerConfigSchema.safeParse(config).success;
}
