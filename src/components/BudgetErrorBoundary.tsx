import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class BudgetErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Silent Error Reporting to Supabase
        try {
            const errorData = {
                error_message: error.message,
                error_stack: error.stack || "",
                component_stack: errorInfo.componentStack || "",
                browser_info: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };

            // Fire and forget - don't await or block UI recovery
            supabase.from('activity_logs').insert({
                event_type: 'STATUS_CHANGE',
                description: `Error: ${error.message}`,
                metadata: errorData,
                timestamp: new Date().toISOString()
            }).then(({ error: insertError }) => {
                if (insertError) {
                    console.error('[ErrorBoundary] Failed to log error to Supabase:', insertError);
                } else {
                    console.log('[ErrorBoundary] Error logged successfully');
                }
            });
        } catch (loggingError) {
            // Catch any errors in the logging itself
            console.error('[ErrorBoundary] Exception while logging error:', loggingError);
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-6 animate-in fade-in duration-500">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-slate-800">
                            We encountered a minor technical pulse
                        </h2>
                        <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                            Your data is safe. Please refresh to resume your journey.
                        </p>
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Refresh Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
