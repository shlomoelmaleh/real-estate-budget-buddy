import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getDossierPreview } from '@/lib/devMirror';
import type { ReportEmailRequest } from '@/lib/devMirror';

interface DevEmailPreviewProps {
  inputs: ReportEmailRequest['inputs'] | null;
  results: ReportEmailRequest['results'] | null;
  language: 'he' | 'en' | 'fr';
}

export function DevEmailPreview({ inputs, results, language }: DevEmailPreviewProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (inputs && results) {
        setOpen(true);
      } else {
        console.warn('[DevEmailPreview] No inputs/results available yet.');
      }
    };
    window.addEventListener('dev-mirror-preview', handler);
    return () => window.removeEventListener('dev-mirror-preview', handler);
  }, [inputs, results]);

  if (!import.meta.env.DEV || !inputs || !results) return null;

  const clientHtml = getDossierPreview(inputs, results, language, false);
  const adminHtml = getDossierPreview(inputs, results, language, true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>📧 Email Preview (DEV)</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="client" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="client">👤 Client Email</TabsTrigger>
            <TabsTrigger value="admin">🔒 Advisor Email</TabsTrigger>
          </TabsList>
          <TabsContent value="client" className="flex-1 overflow-auto mt-0">
            <iframe
              srcDoc={clientHtml}
              title="Client Email Preview"
              className="w-full h-[70vh] border border-border rounded-md"
              sandbox=""
            />
          </TabsContent>
          <TabsContent value="admin" className="flex-1 overflow-auto mt-0">
            <iframe
              srcDoc={adminHtml}
              title="Advisor Email Preview"
              className="w-full h-[70vh] border border-border rounded-md"
              sandbox=""
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
