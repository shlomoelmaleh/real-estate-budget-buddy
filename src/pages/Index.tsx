import { LanguageProvider } from '@/contexts/LanguageContext';
import { BudgetCalculator } from '@/components/BudgetCalculator';

const Index = () => {
  return (
    <LanguageProvider>
      <BudgetCalculator />
    </LanguageProvider>
  );
};

export default Index;
