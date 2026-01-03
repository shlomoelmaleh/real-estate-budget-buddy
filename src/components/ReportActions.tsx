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

      // Temporarily show the hidden print-only sections for PDF generation
      const hiddenSections = reportContent.querySelectorAll('.hidden.print\\:block');
      const originalStyles: string[] = [];
      hiddenSections.forEach((section, index) => {
        originalStyles[index] = (section as HTMLElement).style.cssText;
        (section as HTMLElement).style.cssText = 'display: block !important;';
      });

      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: reportContent.scrollWidth,
        windowHeight: reportContent.scrollHeight,
      });

      // Restore original styles
      hiddenSections.forEach((section, index) => {
        (section as HTMLElement).style.cssText = originalStyles[index];
      });

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

      // Generate yearly balance data for chart
      const yearlyBalanceData: { year: number; balance: number }[] = [];
      for (let i = 0; i < amortization.length; i++) {
        if ((i + 1) % 12 === 0 || i === amortization.length - 1) {
          yearlyBalanceData.push({
            year: Math.ceil((i + 1) / 12),
            balance: amortization[i].closing,
          });
        }
      }

      // Generate payment breakdown by year
      const paymentBreakdownData: { year: number; interest: number; principal: number }[] = [];
      for (let yearIndex = 0; yearIndex < Math.ceil(amortization.length / 12); yearIndex++) {
        const startMonth = yearIndex * 12;
        const endMonth = Math.min(startMonth + 12, amortization.length);
        let yearlyInterest = 0;
        let yearlyPrincipal = 0;
        for (let i = startMonth; i < endMonth; i++) {
          yearlyInterest += amortization[i].interest;
          yearlyPrincipal += amortization[i].principal;
        }
        paymentBreakdownData.push({
          year: yearIndex + 1,
          interest: yearlyInterest,
          principal: yearlyPrincipal,
        });
      }

      // Generate CSV data for the full amortization table
      const csvHeader = "Month,Opening Balance,Monthly Payment,Principal,Interest,Closing Balance\n";
      const csvRows = amortization.map(row =>
        `${row.month},${row.opening.toFixed(2)},${row.payment.toFixed(2)},${row.principal.toFixed(2)},${row.interest.toFixed(2)},${row.closing.toFixed(2)}`
      ).join("\n");
      const csvData = csvHeader + csvRows;

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
          yearlyBalanceData,
          paymentBreakdownData,
          csvData,
        },
      });

      if (error) throw error;

      toast.success(t.emailSuccess);
    } catch (error) {
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
