import { ConfigurationPanel } from "@/components/PartnerConfig/ConfigurationPanel";

const AdminMyConfig = () => {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">הגדרות המערכת שלי</h1>
                <p className="text-muted-foreground mt-2">
                    ניהול מיתוג, פרמטרים והגדרות ברירת מחדל של המערכת.
                </p>
            </div>

            <div className="bg-card rounded-xl border shadow-sm">
                <ConfigurationPanel isAdminMode={true} />
            </div>
        </div>
    );
};

export default AdminMyConfig;
