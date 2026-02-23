import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { TabProps, toDisplayPercent, toDbDecimal } from '../types';

export function CreditPolicyTab({ config, updateConfig, t }: TabProps) {
    return (
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
    );
}
