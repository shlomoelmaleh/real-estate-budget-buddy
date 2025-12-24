import { LanguageProvider } from '@/contexts/LanguageContext';
import { BudgetCalculator } from '@/components/BudgetCalculator';
import { PWAInstallButton } from '@/components/PWAInstallButton';

const Index = () => {
  return (
    <LanguageProvider>
      <BudgetCalculator />
      <PWAInstallButton />
    </LanguageProvider>
  );
};

export default Index;
