import { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { AmortizationRow, formatNumber } from '@/lib/calculator';
import { TrendingDown, PieChart } from 'lucide-react';

interface LoanChartsProps {
  amortization: AmortizationRow[];
  loanAmount: number;
}

export function LoanCharts({ amortization, loanAmount }: LoanChartsProps) {
  const { t } = useLanguage();

  // Aggregate data by year for cleaner visualization
  const yearlyData = useMemo(() => {
    const years: { year: number; balance: number; interestPaid: number; principalPaid: number }[] = [];
    
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    
    for (let i = 0; i < amortization.length; i++) {
      const row = amortization[i];
      cumulativeInterest += row.interest;
      cumulativePrincipal += row.principal;
      
      // Record at end of each year (month 12, 24, 36, etc.)
      if ((i + 1) % 12 === 0 || i === amortization.length - 1) {
        const year = Math.ceil((i + 1) / 12);
        years.push({
          year,
          balance: row.closing,
          interestPaid: cumulativeInterest,
          principalPaid: cumulativePrincipal,
        });
      }
    }
    
    return years;
  }, [amortization]);

  // Payment breakdown by year
  const paymentBreakdown = useMemo(() => {
    const breakdown: { year: number; interest: number; principal: number }[] = [];
    
    for (let yearIndex = 0; yearIndex < Math.ceil(amortization.length / 12); yearIndex++) {
      const startMonth = yearIndex * 12;
      const endMonth = Math.min(startMonth + 12, amortization.length);
      
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;
      
      for (let i = startMonth; i < endMonth; i++) {
        yearlyInterest += amortization[i].interest;
        yearlyPrincipal += amortization[i].principal;
      }
      
      breakdown.push({
        year: yearIndex + 1,
        interest: yearlyInterest,
        principal: yearlyPrincipal,
      });
    }
    
    return breakdown;
  }, [amortization]);

  if (amortization.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 shadow-card text-sm">
          <p className="font-semibold mb-2">{t.chartYear} {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ₪{formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Principal Balance Over Time */}
      <div className="glass rounded-2xl p-6 shadow-card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 font-display">
          <TrendingDown className="w-5 h-5 text-primary" />
          {t.chartBalanceTitle}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{t.chartBalanceDesc}</p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215, 70%, 50%)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(215, 70%, 50%)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="year" 
                className="text-xs" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: t.chartYears, position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="balance" 
                name={t.chartBalance}
                stroke="hsl(215, 70%, 50%)" 
                fillOpacity={1} 
                fill="url(#colorBalance)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Breakdown by Year */}
      <div className="glass rounded-2xl p-6 shadow-card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 font-display">
          <PieChart className="w-5 h-5 text-secondary" />
          {t.chartPaymentTitle}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{t.chartPaymentDesc}</p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentBreakdown} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="year" 
                className="text-xs" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: t.chartYears, position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
              <Bar 
                dataKey="principal" 
                name={t.chartPrincipal}
                stackId="a" 
                fill="hsl(160, 45%, 45%)" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="interest" 
                name={t.chartInterest}
                stackId="a" 
                fill="hsl(36, 70%, 50%)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}