import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { calculateMaxBudget } from '@/lib/calculatorLogic';
import { CalculatorInputs, CalculatorResults, formatNumber } from '@/lib/calculator';
import { PartnerConfig, DEFAULT_PARTNER_CONFIG, validatePartnerConfig } from '@/types/partnerConfig';
import type { SloganFontSize, SloganFontStyle, SloganFontFamily } from '@/lib/partnerTypes';
import { FONT_FAMILY_OPTIONS } from '@/lib/partnerTypes';
import { checkIsAdmin } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, RotateCcw, TrendingUp, User, ShieldCheck, DollarSign, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import logoEshel from '@/assets/logo-eshel-sm.webp';

// New Tab Components
import { BrandingTab } from './Tabs/BrandingTab';
import { CreditPolicyTab } from './Tabs/CreditPolicyTab';
import { FeesTab } from './Tabs/FeesTab';
import { CalculatorTab } from './Tabs/CalculatorTab';
import { ExtendedConfig, toDisplayPercent, toDbDecimal } from './types';

export function ConfigurationPanel({ isAdminMode = false }: { isAdminMode?: boolean }) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [config, setConfig] = useState<ExtendedConfig | null>(null);
    const [originalConfig, setOriginalConfig] = useState<ExtendedConfig | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [previewStats, setPreviewStats] = useState<CalculatorResults | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Check if current user is the super admin
    useEffect(() => {
        checkIsAdmin().then((result) => {
            if (result) setIsAdmin(true);
        });
    }, []);

    // Load Data
    useEffect(() => {
        async function fetchConfig() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                let query = supabase
                    .from('partners')
                    .select(`
                        id, name, slug, email, is_active,
                        logo_url, brand_color, slogan, slogan_font_size, slogan_font_style, slogan_font_family,
                        phone, whatsapp,
                        max_dti_ratio, max_age, max_loan_term_years,
                        rent_recognition_first_property, rent_recognition_investment,
                        default_interest_rate, lawyer_fee_percent, broker_fee_percent,
                        vat_percent, advisor_fee_fixed, other_fee_fixed, rental_yield_default,
                        rent_warning_high_multiplier, rent_warning_low_multiplier,
                        enable_rent_validation, enable_what_if_calculator,
                        show_amortization_table, max_amortization_months
                    `);

                if (isAdminMode) {
                    // Admin mode: specifically look for the record with slug null
                    query = query.is('slug', null);
                } else {
                    query = query.eq('owner_user_id', user.id);
                }

                let { data, error } = await query.maybeSingle();

                // If admin mode and no record found, check for an existing null-slug record without owner
                if (isAdminMode && !data && !error) {
                    console.log("[ConfigurationPanel] Checking for ownerless default record...");
                    const { data: globalDefault, error: globalError } = await supabase
                        .from('partners')
                        .select('*')
                        .is('slug', null)
                        .is('owner_user_id', null)
                        .maybeSingle();

                    if (!globalError && globalDefault) {
                        console.log("[ConfigurationPanel] Ownerless default found, claiming ownership...");
                        const { data: updatedData, error: updateError } = await supabase
                            .from('partners')
                            .update({
                                owner_user_id: user.id,
                                email: user.email,
                                name: globalDefault.name || 'Admin',
                                is_active: true
                            })
                            .eq('id', globalDefault.id)
                            .select()
                            .single();
                        if (updateError) throw updateError;
                        data = updatedData;
                    }
                }

                // If still no record found for admin, create one
                if (isAdminMode && !data) {
                    console.log("[ConfigurationPanel] Creating new admin record...");
                    const { data: newData, error: createError } = await supabase
                        .from('partners')
                        .insert({
                            name: 'Admin',
                            slug: null, // Use null for the admin default record
                            email: user.email,
                            owner_user_id: user.id,
                            is_active: true,
                            ...DEFAULT_PARTNER_CONFIG
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.warn("[ConfigurationPanel] Insert failed, attempting to fetch existing default:", createError);
                        const { data: existingData, error: fetchError } = await supabase
                            .from('partners')
                            .select('*')
                            .is('slug', null)
                            .maybeSingle();
                        if (fetchError || !existingData) throw createError;
                        data = existingData;
                    } else {
                        data = newData;
                    }
                }

                if (error) throw error;
                if (!data) {
                    setIsLoading(false);
                    return;
                }

                // Map database row to ExtendedConfig (filling nulls with defaults)
                const mappedConfig: ExtendedConfig = {
                    // Read-only fields
                    name: data.name || '',
                    slug: data.slug || '',
                    email: data.email,
                    is_active: data.is_active ?? true,

                    // Branding - Editable
                    logo_url: data.logo_url || (isAdminMode ? logoEshel : null),
                    brand_color: data.brand_color,
                    slogan: data.slogan || (isAdminMode ? t.advisorTitle : null),
                    slogan_font_size: data.slogan_font_size as SloganFontSize,
                    slogan_font_style: data.slogan_font_style as SloganFontStyle,
                    slogan_font_family: data.slogan_font_family as SloganFontFamily,
                    phone: data.phone || (isAdminMode ? t.advisorPhone : null),
                    whatsapp: data.whatsapp || (isAdminMode ? t.advisorPhone : null),

                    // Configuration
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

                setConfig(mappedConfig);
                setOriginalConfig(mappedConfig);
                setPartnerId(data.id);
            } catch (error) {
                console.error('Error fetching config:', error);
                toast.error('Failed to load configuration');
            } finally {
                setIsLoading(false);
            }
        }

        fetchConfig();
    }, [isAdminMode, t]);

    // Real-time Preview Effect
    useEffect(() => {
        if (!config) return;

        const mockInputs: CalculatorInputs = {
            equity: 500000,
            ltv: 75,
            netIncome: 20000,
            ratio: config.max_dti_ratio * 100,
            age: 40,
            maxAge: config.max_age,
            interest: config.default_interest_rate,
            isRented: false,
            rentalYield: config.rental_yield_default,
            rentRecognition: config.rent_recognition_investment * 100,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: config.lawyer_fee_percent,
            brokerPct: config.broker_fee_percent,
            vatPct: config.vat_percent,
            advisorFee: config.advisor_fee_fixed,
            otherFee: config.other_fee_fixed,
        };

        const partnerConfig: PartnerConfig = {
            max_dti_ratio: config.max_dti_ratio,
            max_age: config.max_age,
            max_loan_term_years: config.max_loan_term_years,
            rent_recognition_first_property: config.rent_recognition_first_property,
            rent_recognition_investment: config.rent_recognition_investment,
            default_interest_rate: config.default_interest_rate,
            lawyer_fee_percent: config.lawyer_fee_percent,
            broker_fee_percent: config.broker_fee_percent,
            vat_percent: config.vat_percent,
            advisor_fee_fixed: config.advisor_fee_fixed,
            other_fee_fixed: config.other_fee_fixed,
            rental_yield_default: config.rental_yield_default,
            rent_warning_high_multiplier: config.rent_warning_high_multiplier,
            rent_warning_low_multiplier: config.rent_warning_low_multiplier,
            enable_rent_validation: config.enable_rent_validation,
            enable_what_if_calculator: config.enable_what_if_calculator,
            show_amortization_table: config.show_amortization_table,
            max_amortization_months: config.max_amortization_months,
        };

        const result = calculateMaxBudget(mockInputs, partnerConfig);
        setPreviewStats(result);
    }, [config]);

    const isDirty = JSON.stringify(config) !== JSON.stringify(originalConfig);

    const handleSave = async () => {
        if (!config || !partnerId) return;
        setIsSaving(true);

        try {
            // Extract only the PartnerConfig fields for validation
            const configOnly: PartnerConfig = {
                max_dti_ratio: config.max_dti_ratio,
                max_age: config.max_age,
                max_loan_term_years: config.max_loan_term_years,
                rent_recognition_first_property: config.rent_recognition_first_property,
                rent_recognition_investment: config.rent_recognition_investment,
                default_interest_rate: config.default_interest_rate,
                lawyer_fee_percent: config.lawyer_fee_percent,
                broker_fee_percent: config.broker_fee_percent,
                vat_percent: config.vat_percent,
                advisor_fee_fixed: config.advisor_fee_fixed,
                other_fee_fixed: config.other_fee_fixed,
                rental_yield_default: config.rental_yield_default,
                rent_warning_high_multiplier: config.rent_warning_high_multiplier,
                rent_warning_low_multiplier: config.rent_warning_low_multiplier,
                enable_rent_validation: config.enable_rent_validation,
                enable_what_if_calculator: config.enable_what_if_calculator,
                show_amortization_table: config.show_amortization_table,
                max_amortization_months: config.max_amortization_months,
            };

            // Validate config fields
            validatePartnerConfig(configOnly);

            // Build update object with ALL fields (branding + config)
            // Note: percentages are already stored as decimals in state
            const updateData = {
                // Branding & Contact - EDITABLE
                logo_url: config.logo_url || null,
                brand_color: config.brand_color || null,
                slogan: config.slogan || null,
                slogan_font_size: config.slogan_font_size || 'sm',
                slogan_font_style: config.slogan_font_style || 'normal',
                slogan_font_family: config.slogan_font_family || 'system',
                phone: config.phone || null,
                whatsapp: config.whatsapp || null,

                // Read-Only fields EXCLUDED: name, slug, email, is_active

                // Config params
                ...configOnly,
            };

            const { error: updateError } = await supabase
                .from('partners')
                .update(updateData)
                .eq('id', partnerId);

            if (updateError) throw updateError;

            setOriginalConfig(config);
            toast.success(t.configSaved);
        } catch (e: any) {
            console.error('Save error:', e);
            toast.error(t.configSaveError);
        } finally {
            setIsSaving(false);
        }
    };


    const handleReset = () => {
        setConfig(originalConfig);
        toast.info(t.changesReverted);
    };

    const updateConfig = <K extends keyof ExtendedConfig>(key: K, value: ExtendedConfig[K]) => {
        if (!config) return;
        setConfig({ ...config, [key]: value });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[400px]">{t.loadingText}</div>;
    }

    if (!config) {
        return <div className="p-8 text-center text-muted-foreground">{t.configLoadError}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/')}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t.backToApp}
                            </Button>
                            {isAdminMode && (
                                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/partners')} title="Partners Management">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    )}
                    {!isAdmin && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/')}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t.backToApp}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    navigate('/');
                                }}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t.logout}
                            </Button>
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold">{t.partnerConfigTitle}</h1>
                            {config.is_active ? (
                                <Badge variant="secondary">{t.active}</Badge>
                            ) : (
                                <Badge variant="outline">{t.inactive}</Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">{t.partnerConfigDesc}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isDirty && (
                        <>
                            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                {t.reset}
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? t.saving : t.saveChanges}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="branding" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="branding">
                                <User className="w-4 h-4 mr-2" />
                                {t.tabBranding}
                            </TabsTrigger>
                            <TabsTrigger value="credit">
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                {t.tabCredit}
                            </TabsTrigger>
                            <TabsTrigger value="fees">
                                <DollarSign className="w-4 h-4 mr-2" />
                                {t.tabFees}
                            </TabsTrigger>
                            <TabsTrigger value="calculator">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                {t.tabCalculator}
                            </TabsTrigger>
                        </TabsList>

                        {/* --- TAB 1: BRANDING --- */}
                        <TabsContent value="branding">
                            <BrandingTab
                                config={config}
                                updateConfig={updateConfig}
                                t={t}
                                partnerId={partnerId}
                            />
                        </TabsContent>

                        {/* --- TAB 2: CREDIT POLICY --- */}
                        <TabsContent value="credit">
                            <CreditPolicyTab
                                config={config}
                                updateConfig={updateConfig}
                                t={t}
                                partnerId={partnerId}
                            />
                        </TabsContent>

                        {/* --- TAB 3: FINANCIALS & FEES --- */}
                        <TabsContent value="fees">
                            <FeesTab
                                config={config}
                                updateConfig={updateConfig}
                                t={t}
                                partnerId={partnerId}
                            />
                        </TabsContent>

                        {/* --- TAB 4: CALCULATOR SETTINGS --- */}
                        <TabsContent value="calculator">
                            <CalculatorTab
                                config={config}
                                updateConfig={updateConfig}
                                t={t}
                                partnerId={partnerId}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Real-time Preview */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20 sticky top-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                {t.impactPreviewTitle}
                            </CardTitle>
                            <CardDescription>{t.impactPreviewDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {previewStats ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-white rounded-lg border shadow-sm">
                                        <p className="text-sm text-muted-foreground">{t.impactMaxProperty}</p>
                                        <p className="text-2xl font-bold text-primary">₪{formatNumber(previewStats.maxPropertyValue)}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border shadow-sm">
                                        <p className="text-sm text-muted-foreground">{t.impactMonthlyPayment}</p>
                                        <p className="text-xl font-bold">₪{formatNumber(previewStats.monthlyPayment)}</p>
                                        <p className="text-xs text-muted-foreground">DTI: {toDisplayPercent(config.max_dti_ratio)}% of ₪20k income</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-white rounded-lg border">
                                            <p className="text-xs text-muted-foreground">{t.impactLoanTerm}</p>
                                            <p className="font-semibold">{previewStats.loanTermYears} {t.maxLoanTermUnit}</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border">
                                            <p className="text-xs text-muted-foreground">{t.impactInterest}</p>
                                            <p className="font-semibold">{config.default_interest_rate}%</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground italic">
                                    {t.impactUnavailable}
                                </div>
                            )}
                            <p className="text-[10px] text-muted-foreground text-center">
                                {t.impactSampleNotice(40, 20000, 500000)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
