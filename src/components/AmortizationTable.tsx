import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AmortizationRow, formatNumber } from '@/lib/calculator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AmortizationTableProps {
  rows: AmortizationRow[];
}

export function AmortizationTable({ rows }: AmortizationTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  if (rows.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "gap-2 px-6 py-3 rounded-full font-semibold",
            "border-2 hover:border-primary transition-all duration-300"
          )}
        >
          <Calendar className="w-4 h-4" />
          {isExpanded ? t.toggleHide : t.toggleShow}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="glass rounded-2xl p-6 shadow-card overflow-hidden animate-slide-in">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t.titleAmort}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-sm font-semibold border-b-2 border-border">{t.th_month}</th>
                  <th className="px-4 py-3 text-sm font-semibold border-b-2 border-border">{t.th_open}</th>
                  <th className="px-4 py-3 text-sm font-semibold border-b-2 border-border">{t.th_pay}</th>
                  <th className="px-4 py-3 text-sm font-semibold border-b-2 border-border">{t.th_int}</th>
                  <th className="px-4 py-3 text-sm font-semibold border-b-2 border-border">{t.th_princ}</th>
                  <th className="px-4 py-3 text-sm font-semibold border-b-2 border-border">{t.th_close}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
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
