import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AmortizationRow, formatNumber } from '@/lib/calculator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AmortizationTableProps {
  rows: AmortizationRow[];
  maxDisplayMonths?: number;
}

export function AmortizationTable({ rows, maxDisplayMonths }: AmortizationTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  if (rows.length === 0) return null;

  const downloadCSV = () => {
    const headers = [t.th_month, t.th_open, t.th_pay, t.th_int, t.th_princ, t.th_close];
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        [row.month, row.opening, row.payment, row.interest, row.principal, row.closing].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'amortization_schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "gap-2 px-6 py-3 rounded-full font-semibold text-base",
            "border-2 hover:border-primary transition-all duration-300"
          )}
        >
          <Calendar className="w-5 h-5" />
          {isExpanded ? t.toggleHide : t.toggleShow}
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </Button>

        <Button
          variant="secondary"
          onClick={downloadCSV}
          className={cn(
            "gap-2 px-6 py-3 rounded-full font-semibold text-base",
            "transition-all duration-300"
          )}
        >
          <Download className="w-5 h-5" />
          {t.downloadCSV}
        </Button>
      </div>

      {isExpanded && (
        <div className="glass rounded-2xl p-6 shadow-card overflow-hidden animate-slide-in">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 font-display">
            <Calendar className="w-6 h-6 text-primary" />
            {t.titleAmort}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 font-semibold border-b-2 border-border">{t.th_month}</th>
                  <th className="px-4 py-3 font-semibold border-b-2 border-border">{t.th_open}</th>
                  <th className="px-4 py-3 font-semibold border-b-2 border-border">{t.th_pay}</th>
                  <th className="px-4 py-3 font-semibold border-b-2 border-border">{t.th_int}</th>
                  <th className="px-4 py-3 font-semibold border-b-2 border-border">{t.th_princ}</th>
                  <th className="px-4 py-3 font-semibold border-b-2 border-border">{t.th_close}</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, maxDisplayMonths).map((row) => (
                  <tr
                    key={row.month}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-center border-b border-border/50 font-medium">{row.month}</td>
                    <td className="px-4 py-3 text-center border-b border-border/50">{formatNumber(row.opening)}</td>
                    <td className="px-4 py-3 text-center border-b border-border/50">{formatNumber(row.payment)}</td>
                    <td className="px-4 py-3 text-center border-b border-border/50 text-accent">{formatNumber(row.interest)}</td>
                    <td className="px-4 py-3 text-center border-b border-border/50 text-secondary">{formatNumber(row.principal)}</td>
                    <td className="px-4 py-3 text-center border-b border-border/50">{formatNumber(row.closing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
