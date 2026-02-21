
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePartner } from '@/contexts/PartnerContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminFloatingButtonProps {
    onClick?: () => void;
}

export function AdminFloatingButton({ onClick }: AdminFloatingButtonProps) {
    const { isOwner, isAdmin } = usePartner();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Only check ownership. Visibility logic is now handled by the parent (BudgetCalculator).
    if (!isOwner && !isAdmin) {
        return null;
    }

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(isAdmin ? '/admin/my-config' : '/admin/settings');
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[100] animate-in fade-in zoom-in duration-300">
            <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all gap-2 text-xs font-semibold text-slate-700 hover:text-primary hover:border-primary/50"
                onClick={handleClick}
            >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{t.managePartnerSettings}</span>
            </Button>
        </div>
    );
}
