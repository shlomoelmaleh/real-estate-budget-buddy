import React, { useState, useRef, ChangeEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { FONT_FAMILY_OPTIONS } from '@/lib/partnerTypes';
import type { SloganFontSize, SloganFontStyle, SloganFontFamily } from '@/lib/partnerTypes';
import { TabProps } from '../types';

export function BrandingTab({ config, updateConfig, t, partnerId }: TabProps) {
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

    const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !partnerId) {
            setSelectedFileName(null);
            return;
        }

        setSelectedFileName(file.name);

        if (!file.type.startsWith('image/')) {
            toast.error(t.imageFileError || 'Please upload an image file');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error(t.fileSizeError || 'File size must be less than 2MB');
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

    return (
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
                                {window.location.origin}{config.slug ? `/?ref=${config.slug}` : ''}
                            </code>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const url = config.slug ? `${window.location.origin}/?ref=${config.slug}` : window.location.origin;
                                    navigator.clipboard.writeText(url);
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
    );
}
