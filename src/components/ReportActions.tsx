import { useState } from 'react';
import { Download, Mail, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { CalculatorResults, AmortizationRow, formatNumber } from '@/lib/calculator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportActionsProps {
  results: CalculatorResults;
  amortization: AmortizationRow[];
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  inputs: {
    equity: string;
    ltv: string;
    netIncome: string;
    ratio: string;
    age: string;
    maxAge: string;
    interest: string;
    isRented: boolean;
    rentalYield: string;
    rentRecognition: string;
    budgetCap: string;
    purchaseTaxMode: 'percent' | 'fixed';
    purchaseTaxPercent: string;
    purchaseTaxFixed: string;
    lawyerPct: string;
    brokerPct: string;
    vatPct: string;
    advisorFee: string;
    otherFee: string;
  };
}

export function ReportActions({ results, amortization, clientName, clientPhone, clientEmail, inputs }: ReportActionsProps) {
  const { t, language } = useLanguage();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const reportContent = document.getElementById('report-content');
      if (!reportContent) {
        toast.error('Report content not found');
        return;
      }

      // Temporarily show the report content for PDF generation
      const originalStyle = reportContent.style.cssText;
      
      const canvas = await html2canvas(reportContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: reportContent.scrollWidth,
        windowHeight: reportContent.scrollHeight,
      });

      reportContent.style.cssText = originalStyle;

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `property-budget-report-${clientName || 'client'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success(t.pdfSuccess);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(t.pdfError);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!clientEmail) {
      toast.error(t.emailRequired);
      return;
    }

    setIsSendingEmail(true);
    
    try {
      const amortizationSummary = {
        totalMonths: amortization.length,
        firstPayment: amortization.length > 0 
          ? { principal: amortization[0].principal, interest: amortization[0].interest }
          : { principal: 0, interest: 0 },
        lastPayment: amortization.length > 0 
          ? { principal: amortization[amortization.length - 1].principal, interest: amortization[amortization.length - 1].interest }
          : { principal: 0, interest: 0 },
      };

      const { data, error } = await supabase.functions.invoke('send-report-email', {
        body: {
          recipientEmail: clientEmail,
          recipientName: clientName || 'Client',
          recipientPhone: clientPhone,
          language,
          inputs,
          results: {
            maxPropertyValue: results.maxPropertyValue,
            loanAmount: results.loanAmount,
            actualLTV: results.actualLTV,
            monthlyPayment: results.monthlyPayment,
            rentIncome: results.rentIncome,
            netPayment: results.netPayment,
            closingCosts: results.closingCosts,
            totalInterest: results.totalInterest,
            totalCost: results.totalCost,
            loanTermYears: results.loanTermYears,
            shekelRatio: results.totalCost / results.loanAmount,
          },
          amortizationSummary,
        },
      });

      if (error) throw error;
      
      toast.success(t.emailSuccess);
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error(t.emailError);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center print:hidden">
      <Button
        variant="outline"
        onClick={handleDownloadPDF}
        disabled={isGeneratingPDF}
        className="gap-2"
      >
        {isGeneratingPDF ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {t.downloadPDF}
      </Button>
      
      <Button
        variant="outline"
        onClick={handlePrint}
        className="gap-2"
      >
        <Printer className="w-4 h-4" />
        {t.printReport}
      </Button>
      
      <Button
        variant="default"
        onClick={handleSendEmail}
        disabled={isSendingEmail || !clientEmail}
        className="gap-2"
      >
        {isSendingEmail ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
        {t.sendEmail}
      </Button>
    </div>
  );
}
