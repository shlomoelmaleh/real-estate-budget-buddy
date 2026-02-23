import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TabProps } from '../types';

export function FeesTab({ config, updateConfig, t }: TabProps) {
    return (
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
    );
}
