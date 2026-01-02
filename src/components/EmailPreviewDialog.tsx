
import React, { useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, X } from 'lucide-react';
import { generateEmailHtml } from '@/lib/email-preview-generator';
import { CalculatorResults } from '@/lib/calculator';

interface EmailPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    data: {
        language: 'he' | 'en' | 'fr';
        recipientName: string;
        recipientPhone: string;
        recipientEmail: string;
        inputs: any;
        results: CalculatorResults;
        amortizationSummary: any;
    };
}

export function EmailPreviewDialog({ isOpen, onOpenChange, data }: EmailPreviewDialogProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (isOpen && iframeRef.current) {
            const html = generateEmailHtml(data);
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(html);
                doc.title = "Email Preview";
                doc.close();
            }
        }
    }, [isOpen, data]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[700px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
                <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        Email Preview
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 w-full bg-gray-100 p-4 sm:p-8 overflow-y-auto">
                    <div className="mx-auto max-w-[600px] bg-white shadow-xl rounded-xl overflow-hidden ring-1 ring-black/5">
                        <iframe
                            ref={iframeRef}
                            className="w-full h-[600px] border-none bg-white block"
                            title="Email Preview"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
