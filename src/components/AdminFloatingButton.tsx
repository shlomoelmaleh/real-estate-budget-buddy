
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePartner } from '@/contexts/PartnerContext';

export function AdminFloatingButton() {
    const { isOwner } = usePartner();
    const navigate = useNavigate();
    const location = useLocation();

    // Hide if not owner OR if on the Partner Configuration page (where we are already managing settings)
    if (!isOwner || location.pathname === '/admin/settings') {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-[100] animate-in fade-in zoom-in duration-300">
            <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all gap-2 text-xs font-semibold text-slate-700 hover:text-primary hover:border-primary/50"
                onClick={() => navigate('/admin/settings')}
            >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Manage Partner</span>
            </Button>
        </div>
    );
}
