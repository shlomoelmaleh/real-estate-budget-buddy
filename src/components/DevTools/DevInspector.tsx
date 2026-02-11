
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bug, Eye, Activity, ChevronRight, ChevronLeft } from 'lucide-react';

interface DevInspectorProps {
    formData: any;
    results: any;
    language?: string;
}

export function DevInspector({ formData, results }: DevInspectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    // ONLY SHOW IN DEV MODE (guard after hooks)
    if (!import.meta.env.DEV) return null;

    const testRemoteLogging = async () => {
        console.log("🚀 Triggering manual error log...");
        try {
            const { error } = await supabase.functions.invoke('log-error', {
                body: {
                    error_type: 'manual_test',
                    message: '🔴 TEST: Remote Logging button clicked',
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                }
            });
            if (error) alert("Log failed: " + error.message);
            else alert("✅ Success! Check activity_logs table.");
        } catch (e) {
            alert("Error: " + e);
        }
    };

    const netIncome = parseFloat((formData?.netIncome || '0').replace(/,/g, '')) || 1;
    const dtiValue = results?.monthlyPayment
        ? ((results.monthlyPayment / netIncome) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="fixed right-0 top-[120px] z-[10000] flex items-start">
            {/* Toggle Handle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-slate-900 text-white p-2 rounded-l-lg border-y border-l border-slate-700 shadow-xl"
            >
                {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Main Panel */}
            <div
                className={`bg-slate-900 text-white w-[260px] border border-slate-700 rounded-l-lg shadow-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 border-b border-slate-700 pb-2">
                        <Bug size={14} />
                        <span>ARCHITECT HUD</span>
                    </div>

                    <div className="space-y-3 text-xs">
                        {/* Limiting Factor */}
                        <div className="space-y-1">
                            <div className="text-slate-500 uppercase text-[10px] font-bold flex items-center gap-1">
                                <Eye size={10} />
                                Limiting Factor
                            </div>
                            <p className="text-green-400 font-mono font-semibold">
                                {results?.limitingFactor || 'N/A'}
                            </p>
                        </div>

                        {/* LTV / DTI */}
                        <div className="space-y-1">
                            <div className="text-slate-500 uppercase text-[10px] font-bold flex items-center gap-1">
                                <Activity size={10} />
                                LTV / DTI
                            </div>
                            <p className="text-blue-400 font-mono">
                                LTV: {results?.actualLTV?.toFixed(1) ?? 'N/A'}%
                            </p>
                            <p className="text-amber-400 font-mono">
                                DTI: {dtiValue}%
                            </p>
                        </div>
                    </div>

                    {/* Test Remote Logging Button */}
                    <button
                        onClick={testRemoteLogging}
                        className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800 rounded py-2 text-xs font-bold transition-colors"
                    >
                        🔴 TEST REMOTE LOGGING
                    </button>
                </div>
            </div>
        </div>
    );
}

// Keep backward-compatible named export
export { DevInspector as default };
