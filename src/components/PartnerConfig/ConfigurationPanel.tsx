import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { calculateMaxBudget } from '@/lib/calculatorLogic';
import { CalculatorInputs, CalculatorResults, formatNumber } from '@/lib/calculator';
import { PartnerConfig, DEFAULT_PARTNER_CONFIG, validatePartnerConfig } from '@/types/partnerConfig';
import type { SloganFontSize, SloganFontStyle } from '@/lib/partnerTypes';
import { ADMIN_EMAIL } from '@/lib/admin';
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

export function ConfigurationPanel() {
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

    // Check if current user is the super admin
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.email?.toLowerCase() === ADMIN_EMAIL) setIsAdmin(true);
        });
    }, []);

    // Load Data
    useEffect(() => {
        async function fetchConfig() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('partners')
                    .select(`
                        id, name, slug, email, is_active,
                        logo_url, brand_color, slogan, slogan_font_size, slogan_font_style,
                        phone, whatsapp,
                        max_dti_ratio, max_age, max_loan_term_years,
                        rent_recognition_first_property, rent_recognition_investment,
                        default_interest_rate, lawyer_fee_percent, broker_fee_percent,
                        vat_percent, advisor_fee_fixed, other_fee_fixed, rental_yield_default,
                        rent_warning_high_multiplier, rent_warning_low_multiplier,
                        enable_rent_validation, enable_what_if_calculator,
                        show_amortization_table, max_amortization_months
                    `)
                    .eq('owner_user_id', user.id)
                    .single();

                if (error) throw error;

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
                phone: config.phone || null,
                whatsapp: config.whatsapp || null,

                // Read-Only fields EXCLUDED: name, slug, email, is_active

                // Config params
                ...configOnly,
            };

            const { error } = await supabase
                .from('partners')
                .update(updateData)
                .eq('id', partnerId);

            if (error) throw error;

            setOriginalConfig(config);
            toast.success('Configuration saved successfully');
        } catch (error) {
            console.error('Error saving config:', error);
            toast.error('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !partnerId) return;

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
            toast.success('Logo uploaded successfully');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Failed to upload logo');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleReset = () => {
        setConfig(originalConfig);
        toast.info('Changes reverted');
    };

    const updateConfig = <K extends keyof ExtendedConfig>(key: K, value: ExtendedConfig[K]) => {
        if (!config) return;
        setConfig({ ...config, [key]: value });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[400px]">Loading configuration...</div>;
    }

    if (!config) {
        return <div className="p-8 text-center text-muted-foreground">No partner configuration found for this user.</div>;
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
                                onClick={() => navigate('/')}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to App
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
                                Logout
                            </Button>
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold">Partner Configuration</h1>
                            {config.is_active ? (
                                <Badge variant="secondary">Active</Badge>
                            ) : (
                                <Badge variant="outline">Inactive</Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">Customize your branding, policies, and simulation parameters.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isDirty && (
                        <>
                            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
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
                                    <CardDescription>Your brand identity and contact details shown to clients</CardDescription>
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
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    disabled={isUploadingLogo}
                                                    className="max-w-xs cursor-pointer"
                                                />
                                                {isUploadingLogo && <span className="text-sm text-muted-foreground animate-pulse">{t.uploading}</span>}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground italic">
                                                Recommended: PNG or SVG with transparent background. Max 2MB.
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
                                    </div>

                                    {/* Slogan */}
                                    <div className="space-y-2">
                                        <Label>{t.slogan}</Label>
                                        <Input
                                            value={config.slogan || ''}
                                            onChange={(e) => updateConfig('slogan', e.target.value || null)}
                                            placeholder="Your trusted mortgage partner"
                                        />
                                    </div>

                                    {/* Slogan Font Size + Style */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t.sloganSize}</Label>
                                            <Select
                                                value={config.slogan_font_size || 'sm'}
                                                onValueChange={(val) => updateConfig('slogan_font_size', val as SloganFontSize)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="xs">Extra Small</SelectItem>
                                                    <SelectItem value="sm">Small</SelectItem>
                                                    <SelectItem value="base">Medium</SelectItem>
                                                    <SelectItem value="lg">Large</SelectItem>
                                                    <SelectItem value="xl">Extra Large</SelectItem>
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
                                                    <SelectItem value="normal">Normal</SelectItem>
                                                    <SelectItem value="italic">Italic</SelectItem>
                                                    <SelectItem value="bold">Bold</SelectItem>
                                                    <SelectItem value="bold-italic">Bold Italic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Phone + WhatsApp - EDITABLE */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t.phone}</Label>
                                            <Input
                                                value={config.phone || ''}
                                                onChange={(e) => updateConfig('phone', e.target.value || null)}
                                                placeholder="+972-50-123-4567"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>WhatsApp</Label>
                                            <Input
                                                value={config.whatsapp || ''}
                                                onChange={(e) => updateConfig('whatsapp', e.target.value || null)}
                                                placeholder="+972-50-123-4567"
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
                                                <p className="text-xs text-muted-foreground">{t.companyName}</p>
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
                                    <CardDescription>Credit Policy & Risk Limits</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Max DTI Ratio */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                Max DTI Ratio (%)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="w-4 h-4 text-muted-foreground" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Maximum percentage of net income for mortgage payments. Bank of Israel limit is 40%.</p>
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
                                            <Label>Max Applicant Age</Label>
                                            <span className="font-mono text-primary font-bold">{config.max_age} years</span>
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
                                            <Label>Max Loan Term (Years)</Label>
                                            <span className="font-mono text-primary font-bold">{config.max_loan_term_years} years</span>
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
                                            <Label htmlFor="rent_recog_first">Rent Recognition (1st Property) %</Label>
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
                                            <Label htmlFor="rent_recog_inv">Rent Recognition (Investment) %</Label>
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
                                        <Label htmlFor="enable_rent_validation">Enable Rent Validation Logic</Label>
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
                                    <CardDescription>Financials & Fees Configuration</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="interest_rate">Default Interest Rate (%)</Label>
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
                                            <Label htmlFor="vat_percent">VAT % (מע״מ)</Label>
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
                                            <Label htmlFor="lawyer_fee">Lawyer Fee (%)</Label>
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
                                            <Label htmlFor="broker_fee">Broker Fee (%)</Label>
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
                                            <Label htmlFor="advisor_fee">Advisor Fee (Fixed ₪)</Label>
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
                                            <Label htmlFor="other_fee">Other Fee (Fixed ₪)</Label>
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
                                    <CardDescription>Advanced Calculator Settings</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="rental_yield">Default Rental Yield (%)</Label>
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
                                            <Label htmlFor="max_amort_months">Max Amortization Months (Display)</Label>
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
                                            <Label htmlFor="rent_warn_high">Rent High Warning Multiplier</Label>
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
                                            <Label htmlFor="rent_warn_low">Rent Low Warning Multiplier</Label>
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
                                            <Label htmlFor="enable_what_if">Enable "What If" Module</Label>
                                            <Switch
                                                id="enable_what_if"
                                                checked={config.enable_what_if_calculator}
                                                onCheckedChange={(val) => updateConfig('enable_what_if_calculator', val)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between space-x-2">
                                            <Label htmlFor="show_amort">Show Amortization Table</Label>
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
                                Impact Preview
                            </CardTitle>
                            <CardDescription>Instant impact of your settings on a sample ₪500k equity case.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {previewStats ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-white rounded-lg border shadow-sm">
                                        <p className="text-sm text-muted-foreground">Estimated Max Property</p>
                                        <p className="text-2xl font-bold text-primary">₪{formatNumber(previewStats.maxPropertyValue)}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border shadow-sm">
                                        <p className="text-sm text-muted-foreground">Monthly Payment</p>
                                        <p className="text-xl font-bold">₪{formatNumber(previewStats.monthlyPayment)}</p>
                                        <p className="text-xs text-muted-foreground">DTI: {toDisplayPercent(config.max_dti_ratio)}% of ₪20k income</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-white rounded-lg border">
                                            <p className="text-xs text-muted-foreground">Loan Term</p>
                                            <p className="font-semibold">{previewStats.loanTermYears} Years</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border">
                                            <p className="text-xs text-muted-foreground">Interest</p>
                                            <p className="font-semibold">{config.default_interest_rate}%</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground italic">
                                    Calculation unavailable for current settings.
                                </div>
                            )}
                            <p className="text-[10px] text-muted-foreground text-center">
                                * Sample: Borrower Age 40, Net Income ₪20k, Equity ₪500k.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
