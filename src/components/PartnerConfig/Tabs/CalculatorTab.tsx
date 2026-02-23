import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TabProps } from '../types';

export function CalculatorTab({ config, updateConfig, t }: TabProps) {
    return (
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
    );
}
