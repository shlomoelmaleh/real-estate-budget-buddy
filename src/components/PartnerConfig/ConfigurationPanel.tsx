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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Info, Save, RotateCcw, TrendingUp, User, ShieldCheck, DollarSign, ArrowLeft, Copy } from 'lucide-react'; // Added Copy
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext'; // Added useLanguage

// Extended config with all partner fields
interface ExtendedConfig extends PartnerConfig {
    // Branding & Contact - EDITABLE
    logo_url: string | null;
    brand_color: string | null;
    slogan: string | null;
    slogan_font_size: SloganFontSize | null;
    slogan_font_style: SloganFontStyle | null;
    slogan_font_family: SloganFontFamily | null;
    phone: string | null;
    whatsapp: string | null;

    // Read-only display fields (NOT in update payload)
    name: string;
    slug: string;
    email: string | null;
    is_active: boolean;
}

// Helper: Convert DB percentage decimals to display percentages (0.17 → 17)
function toDisplayPercent(value: number): number {
    return Math.round(value * 100);
}

// Helper: Convert display percentages to DB decimals (17 → 0.17)
function toDbDecimal(value: number): number {
    return value / 100;
}

// Font size labels
const FONT_SIZE_LABELS: Record<SloganFontSize, string> = {
    xs: 'Extra Small',
    sm: 'Small',
    base: 'Medium',
    lg: 'Large',
    xl: 'Extra Large',
};

// Font style labels
const FONT_STYLE_LABELS: Record<SloganFontStyle, string> = {
    normal: 'Normal',
    italic: 'Italic',
    bold: 'Bold',
    'bold-italic': 'Bold Italic',
};

// Font family options with CSS stacks removed, now imported from partnerTypes.ts

export function ConfigurationPanel({ isAdminMode = false }: { isAdminMode?: boolean }) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [config, setConfig] = useState<ExtendedConfig | null>(null);
    const [originalConfig, setOriginalConfig] = useState<ExtendedConfig | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [previewStats, setPreviewStats] = useState<CalculatorResults | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

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
                    // Admin mode: specifically look for the record with owner_user_id and special slug or just owner_user_id
                    // The requirement mentioned: "existing admin partner record (the one with no slug, or create a special admin record if needed)"
                    query = query.eq('owner_user_id', user.id).is('slug', null);
                } else {
                    query = query.eq('owner_user_id', user.id);
                }

                let { data, error } = await query.maybeSingle();

                // If admin mode and no record found, create the "Default/Admin" record
                if (isAdminMode && !data && !error) {
                    console.log("[ConfigurationPanel] Creating default admin record...");
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

                    if (createError) throw createError;
                    data = newData;
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
                    logo_url: data.logo_url,
                    brand_color: data.brand_color,
                    slogan: data.slogan,
                    slogan_font_size: data.slogan_font_size as SloganFontSize,
                    slogan_font_style: data.slogan_font_style as SloganFontStyle,
                    slogan_font_family: data.slogan_font_family as SloganFontFamily,
                    phone: data.phone,
                    whatsapp: data.whatsapp,

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
    }, []);

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
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
            setSelectedFileName(null);
        } catch (e: any) {
            console.error('Save error:', e);
            toast.error(t.configSaveError);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !partnerId) {
            setSelectedFileName(null);
            return;
        }

        setSelectedFileName(file.name);

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB');
            return;
        }

        setIsUploadingLogo(true);
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
            const path = `${partnerId}/logo-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('partner-logos')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('partner-logos')
                .getPublicUrl(path);

            updateConfig('logo_url', data.publicUrl);
            toast.success(t.logoUploadSuccess);
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error(t.logoUploadError);
        } finally {
            setIsUploadingLogo(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setSelectedFileName(null);
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
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/partners')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    {!isAdmin && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(config.slug ? `/?ref=${config.slug}` : '/')}
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

                        {/* --- TAB 1: BRANDING (Editable + Read-Only) --- */}
                        <TabsContent value="branding">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t.tabBranding}</CardTitle>
                                    <CardDescription>{t.brandingTabDesc}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">

                                    {/* Logo Upload */}
                                    <div className="space-y-2">
                                        <Label>{t.logo}</Label>
                                        <div className="flex flex-col gap-4">
                                            {config.logo_url && (
                                                <div className="p-4 border rounded-md bg-white shadow-sm w-fit">
                                                    <img
                                                        src={config.logo_url}
                                                        alt="Logo Preview"
                                                        className="h-20 w-auto object-contain"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    disabled={isUploadingLogo}
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                />
                                                <div className="flex items-center w-full max-w-sm border rounded-md bg-white shadow-sm overflow-hidden h-10 px-3 gap-3">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border-none shrink-0"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploadingLogo}
                                                    >
                                                        {t.chooseFile}
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground truncate flex-1">
                                                        {selectedFileName || (isUploadingLogo ? t.uploading : t.noFileChosen)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground italic">
                                                {t.logoUploadDesc}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Brand Color */}
                                    <div className="space-y-2">
                                        <Label>{t.brandColor}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={config.brand_color || '#1a73e8'}
                                                onChange={(e) => updateConfig('brand_color', e.target.value)}
                                                className="w-12 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={config.brand_color || ''}
                                                onChange={(e) => updateConfig('brand_color', e.target.value || null)}
                                                placeholder="#1a73e8"
                                                className="flex-1 font-mono"
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic pt-1">
                                            {t.brandColorDesc}
                                        </p>
                                    </div>

                                    {/* Slogan */}
                                    <div className="space-y-2">
                                        <Label>{t.slogan}</Label>
                                        <Input
                                            value={config.slogan || ''}
                                            onChange={(e) => updateConfig('slogan', e.target.value || null)}
                                            placeholder={t.sloganPlaceholder}
                                        />
                                    </div>

                                    {/* Slogan Font Settings */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t.sloganFont}</Label>
                                            <Select
                                                value={config.slogan_font_family || 'system'}
                                                onValueChange={(val) => updateConfig('slogan_font_family', val as SloganFontFamily)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(FONT_FAMILY_OPTIONS).map(([value]) => {
                                                        const label =
                                                            value === 'system' ? t.fontSystem :
                                                                value === 'assistant' ? t.fontAssistant :
                                                                    value === 'heebo' ? t.fontHeebo :
                                                                        value === 'frank-ruhl-libre' ? t.fontFrank :
                                                                            value === 'rubik' ? t.fontRubik :
                                                                                value === 'inter' ? t.fontInter : value;

                                                        return (
                                                            <SelectItem key={value} value={value}>
                                                                {label}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t.sloganSize}</Label>
                                            <Select
                                                value={config.slogan_font_size || 'sm'}
                                                onValueChange={(val) => updateConfig('slogan_font_size', val as SloganFontSize)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="xs">{t.sloganSizeXs}</SelectItem>
                                                    <SelectItem value="sm">{t.sloganSizeSm}</SelectItem>
                                                    <SelectItem value="base">{t.sloganSizeBase}</SelectItem>
                                                    <SelectItem value="lg">{t.sloganSizeLg}</SelectItem>
                                                    <SelectItem value="xl">{t.sloganSizeXl}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t.sloganStyle}</Label>
                                            <Select
                                                value={config.slogan_font_style || 'normal'}
                                                onValueChange={(val) => updateConfig('slogan_font_style', val as SloganFontStyle)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="normal">{t.sloganStyleNormal}</SelectItem>
                                                    <SelectItem value="italic">{t.sloganStyleItalic}</SelectItem>
                                                    <SelectItem value="bold">{t.sloganStyleBold}</SelectItem>
                                                    <SelectItem value="bold-italic">{t.sloganStyleBoldItalic}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Slogan Preview */}
                                    {config.slogan && (
                                        <div className="p-4 bg-muted/50 border rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-2">{t.preview}:</p>
                                            <p
                                                style={{
                                                    fontFamily: FONT_FAMILY_OPTIONS[config.slogan_font_family || 'system'].css,
                                                    fontSize: config.slogan_font_size === 'xs' ? '12px' :
                                                        config.slogan_font_size === 'sm' ? '14px' :
                                                            config.slogan_font_size === 'base' ? '16px' :
                                                                config.slogan_font_size === 'lg' ? '18px' : '20px',
                                                    fontStyle: config.slogan_font_style === 'italic' || config.slogan_font_style === 'bold-italic' ? 'italic' : 'normal',
                                                    fontWeight: config.slogan_font_style === 'bold' || config.slogan_font_style === 'bold-italic' ? '700' : '400',
                                                }}
                                            >
                                                {config.slogan}
                                            </p>
                                        </div>
                                    )}

                                    {/* Phone + WhatsApp - EDITABLE */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t.phone}</Label>
                                            <Input
                                                value={config.phone || ''}
                                                onChange={(e) => updateConfig('phone', e.target.value || null)}
                                                placeholder={t.phonePlaceholder}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t.whatsappLabel}</Label>
                                            <Input
                                                value={config.whatsapp || ''}
                                                onChange={(e) => updateConfig('whatsapp', e.target.value || null)}
                                                placeholder={t.whatsappPlaceholder}
                                            />
                                        </div>
                                    </div>

                                    {/* Partner Link Box - READ ONLY display */}
                                    <div className="mt-6 p-4 bg-muted/50 border rounded-lg space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                            {t.readOnlyTitle}
                                        </h4>

                                        {/* Partner Link */}
                                        <div className="p-3 bg-white border rounded-md shadow-sm">
                                            <p className="text-xs text-muted-foreground mb-1">🔗 {t.partnerLink}</p>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-sm font-mono text-primary truncate bg-slate-50 p-1.5 rounded">
                                                    {window.location.origin}/?ref={config.slug}
                                                </code>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/?ref=${config.slug}`);
                                                        toast.success(t.linkCopied);
                                                    }}
                                                >
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    {t.copyLink}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Name, Email, Status - read-only */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t.companyNameLabel}</p>
                                                <p className="text-sm font-medium">{config.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t.email}</p>
                                                <p className="text-sm font-medium">{config.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t.status}</p>
                                                <Badge variant={config.is_active ? "secondary" : "outline"} className={config.is_active ? "bg-green-100 text-green-800" : ""}>
                                                    {config.is_active ? t.active : t.inactive}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- TAB 2: CREDIT POLICY --- */}
                        <TabsContent value="credit">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t.tabCredit}</CardTitle>
                                    <CardDescription>{t.creditTabDesc}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Max DTI Ratio */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                {t.maxDtiLabel}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="w-4 h-4 text-muted-foreground" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t.maxDtiTooltip}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                            <span className="font-mono text-primary font-bold">{toDisplayPercent(config.max_dti_ratio)}%</span>
                                        </div>
                                        <Slider
                                            value={[toDisplayPercent(config.max_dti_ratio)]}
                                            min={25}
                                            max={50}
                                            step={1}
                                            onValueChange={([val]) => updateConfig('max_dti_ratio', toDbDecimal(val))}
                                        />
                                    </div>

                                    {/* Max Age */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>{t.maxAgeLabel}</Label>
                                            <span className="font-mono text-primary font-bold">{config.max_age} {t.maxAgeUnit}</span>
                                        </div>
                                        <Slider
                                            value={[config.max_age]}
                                            min={70}
                                            max={95}
                                            step={1}
                                            onValueChange={([val]) => updateConfig('max_age', val)}
                                        />
                                    </div>

                                    {/* Max Loan Term */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>{t.maxLoanTermLabel}</Label>
                                            <span className="font-mono text-primary font-bold">{config.max_loan_term_years} {t.maxLoanTermUnit}</span>
                                        </div>
                                        <Slider
                                            value={[config.max_loan_term_years]}
                                            min={10}
                                            max={35}
                                            step={1}
                                            onValueChange={([val]) => updateConfig('max_loan_term_years', val)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="rent_recog_first">{t.rentRecogFirstLabel}</Label>
                                            <Input
                                                id="rent_recog_first"
                                                type="number"
                                                step="1"
                                                min="0"
                                                max="100"
                                                value={toDisplayPercent(config.rent_recognition_first_property)}
                                                onChange={(e) => updateConfig('rent_recognition_first_property', toDbDecimal(parseFloat(e.target.value) || 0))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rent_recog_inv">{t.rentRecogInvLabel}</Label>
                                            <Input
                                                id="rent_recog_inv"
                                                type="number"
                                                step="1"
                                                min="0"
                                                max="100"
                                                value={toDisplayPercent(config.rent_recognition_investment)}
                                                onChange={(e) => updateConfig('rent_recognition_investment', toDbDecimal(parseFloat(e.target.value) || 0))}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between space-x-2 pt-4">
                                        <Label htmlFor="enable_rent_validation">{t.enableRentValidationLabel}</Label>
                                        <Switch
                                            id="enable_rent_validation"
                                            checked={config.enable_rent_validation}
                                            onCheckedChange={(val) => updateConfig('enable_rent_validation', val)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- TAB 3: FINANCIALS & FEES --- */}
                        <TabsContent value="fees">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t.tabFees}</CardTitle>
                                    <CardDescription>{t.feesTabDesc}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="interest_rate">{t.defaultInterestLabel}</Label>
                                            <Input
                                                id="interest_rate"
                                                type="number"
                                                step="0.1"
                                                min="1"
                                                max="15"
                                                value={config.default_interest_rate}
                                                onChange={(e) => updateConfig('default_interest_rate', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vat_percent">{t.vatLabel}</Label>
                                            <Input
                                                id="vat_percent"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="25"
                                                value={config.vat_percent}
                                                onChange={(e) => updateConfig('vat_percent', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="lawyer_fee">{t.lawyerFeeLabel}</Label>
                                            <Input
                                                id="lawyer_fee"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="10"
                                                value={config.lawyer_fee_percent}
                                                onChange={(e) => updateConfig('lawyer_fee_percent', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="broker_fee">{t.brokerFeeLabel}</Label>
                                            <Input
                                                id="broker_fee"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="10"
                                                value={config.broker_fee_percent}
                                                onChange={(e) => updateConfig('broker_fee_percent', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="advisor_fee">{t.advisorFeeLabel}</Label>
                                            <Input
                                                id="advisor_fee"
                                                type="number"
                                                min="0"
                                                max="100000"
                                                value={config.advisor_fee_fixed}
                                                onChange={(e) => updateConfig('advisor_fee_fixed', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="other_fee">{t.otherFeeLabel}</Label>
                                            <Input
                                                id="other_fee"
                                                type="number"
                                                min="0"
                                                max="100000"
                                                value={config.other_fee_fixed}
                                                onChange={(e) => updateConfig('other_fee_fixed', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- TAB 4: CALCULATOR SETTINGS --- */}
                        <TabsContent value="calculator">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t.tabCalculator}</CardTitle>
                                    <CardDescription>{t.calcTabDesc}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="rental_yield">{t.defaultRentalYieldLabel}</Label>
                                            <Input
                                                id="rental_yield"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="20"
                                                value={config.rental_yield_default}
                                                onChange={(e) => updateConfig('rental_yield_default', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="max_amort_months">{t.maxAmortMonthsLabel}</Label>
                                            <Input
                                                id="max_amort_months"
                                                type="number"
                                                min="12"
                                                max="360"
                                                step="12"
                                                value={config.max_amortization_months}
                                                onChange={(e) => updateConfig('max_amortization_months', parseInt(e.target.value) || 12)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="rent_warn_high">{t.rentWarnHighLabel}</Label>
                                            <Input
                                                id="rent_warn_high"
                                                type="number"
                                                step="0.1"
                                                min="1"
                                                max="3"
                                                value={config.rent_warning_high_multiplier}
                                                onChange={(e) => updateConfig('rent_warning_high_multiplier', parseFloat(e.target.value) || 1)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rent_warn_low">{t.rentWarnLowLabel}</Label>
                                            <Input
                                                id="rent_warn_low"
                                                type="number"
                                                step="0.1"
                                                min="0.3"
                                                max="0.9"
                                                value={config.rent_warning_low_multiplier}
                                                onChange={(e) => updateConfig('rent_warning_low_multiplier', parseFloat(e.target.value) || 0.3)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between space-x-2">
                                            <Label htmlFor="enable_what_if">{t.enableWhatIfLabel}</Label>
                                            <Switch
                                                id="enable_what_if"
                                                checked={config.enable_what_if_calculator}
                                                onCheckedChange={(val) => updateConfig('enable_what_if_calculator', val)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between space-x-2">
                                            <Label htmlFor="show_amort">{t.showAmortTableLabel}</Label>
                                            <Switch
                                                id="show_amort"
                                                checked={config.show_amortization_table}
                                                onCheckedChange={(val) => updateConfig('show_amortization_table', val)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
