import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateMaxBudget } from '@/lib/calculatorLogic';
import { CalculatorInputs, CalculatorResults, formatNumber } from '@/lib/calculator';
import { PartnerConfig, DEFAULT_PARTNER_CONFIG, validatePartnerConfig } from '@/types/partnerConfig';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Info, Save, RotateCcw, TrendingUp, ShieldCheck, Settings2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ConfigurationPanel() {
    const [config, setConfig] = useState<PartnerConfig | null>(null);
    const [originalConfig, setOriginalConfig] = useState<PartnerConfig | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [previewStats, setPreviewStats] = useState<CalculatorResults | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Load Data
    useEffect(() => {
        async function fetchConfig() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('partners')
                    .select('*')
                    .eq('owner_user_id', user.id)
                    .single();

                if (error) throw error;

                // Map database row to PartnerConfig (filling nulls with defaults)
                const mappedConfig: PartnerConfig = {
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
            lawyerPct: config.lawyer_fee_percent,
            brokerPct: config.broker_fee_percent,
            vatPct: config.vat_percent,
            advisorFee: config.advisor_fee_fixed,
            otherFee: config.other_fee_fixed,
        };

        const result = calculateMaxBudget(mockInputs, config);
        setPreviewStats(result);
    }, [config]);

    const isDirty = JSON.stringify(config) !== JSON.stringify(originalConfig);

    const handleSave = async () => {
        if (!config || !partnerId) return;
        setIsSaving(true);

        try {
            const validated = validatePartnerConfig(config);
            const { error } = await supabase
                .from('partners')
                .update(validated)
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

    const handleReset = () => {
        setConfig(originalConfig);
        toast.info('Changes reverted');
    };

    const updateConfig = (key: keyof PartnerConfig, value: any) => {
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
                <div>
                    <h1 className="text-3xl font-bold">Partner Configuration</h1>
                    <p className="text-muted-foreground">Customize your budget simulation parameters and features.</p>
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
                    <Tabs defaultValue="risk" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="risk">
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Risk & Regulations
                            </TabsTrigger>
                            <TabsTrigger value="financial">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Financials
                            </TabsTrigger>
                            <TabsTrigger value="features">
                                <Settings2 className="w-4 h-4 mr-2" />
                                App Features
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="risk">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Risk Limits</CardTitle>
                                    <CardDescription>Control the maximum boundaries for your simulations.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Max DTI */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                Max DTI Ratio (Debt-to-Income)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="w-4 h-4 text-muted-foreground" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>The maximum percentage of net income allowed for mortgage payments. Bank of Israel limit is 40%.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                            <span className="font-mono text-primary font-bold">{Math.round(config.max_dti_ratio * 100)}%</span>
                                        </div>
                                        <Slider
                                            value={[config.max_dti_ratio * 100]}
                                            min={25}
                                            max={50}
                                            step={1}
                                            onValueChange={([val]) => updateConfig('max_dti_ratio', val / 100)}
                                        />
                                    </div>

                                    {/* Max Age */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Max Borrower Age</Label>
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

                                    {/* Max Term */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Max Loan Term</Label>
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
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="financial">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Financial Defaults</CardTitle>
                                    <CardDescription>Standard values applied to all new simulations.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Default Interest Rate (%)</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={config.default_interest_rate}
                                                onChange={(e) => updateConfig('default_interest_rate', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Advisor Fee (₪)</Label>
                                            <Input
                                                type="number"
                                                value={config.advisor_fee_fixed}
                                                onChange={(e) => updateConfig('advisor_fee_fixed', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Lawyer Fee (%)</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={config.lawyer_fee_percent}
                                                onChange={(e) => updateConfig('lawyer_fee_percent', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Broker Fee (%)</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={config.broker_fee_percent}
                                                onChange={(e) => updateConfig('broker_fee_percent', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="features">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Experience Features</CardTitle>
                                    <CardDescription>Toggle visibility of complex features for your clients.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="show-amort">Show Amortization Table</Label>
                                        <Switch
                                            id="show-amort"
                                            checked={config.show_amortization_table}
                                            onCheckedChange={(val) => updateConfig('show_amortization_table', val)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="enable-what-if">Enable "What If" Calculator</Label>
                                        <Switch
                                            id="enable-what-if"
                                            checked={config.enable_what_if_calculator}
                                            onCheckedChange={(val) => updateConfig('enable_what_if_calculator', val)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="rent-validation">Enable Rent Validation</Label>
                                        <Switch
                                            id="rent-validation"
                                            checked={config.enable_rent_validation}
                                            onCheckedChange={(val) => updateConfig('enable_rent_validation', val)}
                                        />
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Max Amortization Months to Show</Label>
                                            <span className="font-mono text-primary font-bold">{config.max_amortization_months}mo</span>
                                        </div>
                                        <Slider
                                            value={[config.max_amortization_months]}
                                            min={12}
                                            max={360}
                                            step={12}
                                            onValueChange={([val]) => updateConfig('max_amortization_months', val)}
                                        />
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
                                        <p className="text-xs text-muted-foreground">DTI: {Math.round(config.max_dti_ratio * 100)}% of ₪20k income</p>
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
