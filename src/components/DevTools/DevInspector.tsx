
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bug, Eye, Activity, ChevronRight, ChevronLeft, Mail } from 'lucide-react';
import { getDossierPreview } from '@/lib/devMirror';

interface DevInspectorProps {
    formData: any;
    results: any;
    language?: string;
}

export function DevInspector({ formData, results, language = 'he' }: DevInspectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewTab, setPreviewTab] = useState<'client' | 'advisor'>('client');

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

    // Generate HTML for preview
    const htmlContent = showPreview && results
        ? getDossierPreview(
            { ...formData, advisorFee: '9000', otherFee: '3000' }, // Inputs
            results, // Results
            language as any, // Language
            previewTab === 'advisor' // isAdvisorCopy
        )
        : '';

    return (
        <>
            <div className="fixed right-0 top-[120px] z-[9999] flex items-start">
                {/* Toggle Handle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-slate-900 text-white p-2 rounded-l-lg border-y border-l border-slate-700 shadow-xl hover:bg-slate-800 transition-colors"
                >
                    {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                {/* Main Panel */}
                <div
                    className={`bg-slate-900 text-white w-[260px] border border-slate-700 rounded-bl-lg shadow-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
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

                        {/* Actions */}
                        <div className="border-t border-slate-800 pt-3 space-y-2">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Mail size={12} />
                                📧 PREVIEW EMAILS
                            </button>

                            <button
                                onClick={testRemoteLogging}
                                className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800 rounded py-2 text-xs font-bold transition-colors"
                            >
                                🔴 TEST REMOTE LOGGING
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-lg">📧 Email Preview</h3>
                                <div className="flex bg-slate-800 rounded-lg p-1">
                                    <button
                                        onClick={() => setPreviewTab('client')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${previewTab === 'client' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Client Version
                                    </button>
                                    <button
                                        onClick={() => setPreviewTab('advisor')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${previewTab === 'advisor' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Advisor Version
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-slate-100 overflow-auto p-8 flex justify-center">
                            <div className="bg-white shadow-xl min-h-[1000px] w-full max-w-[800px] mx-auto transition-all duration-300">
                                {results ? (
                                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                                        <Activity size={48} className="mb-4 opacity-50" />
                                        <p>No results calculated yet.</p>
                                        <p className="text-sm mt-2">Complete the wizard to generate preview.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Keep backward-compatible named export
export { DevInspector as default };
