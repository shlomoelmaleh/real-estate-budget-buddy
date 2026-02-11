
import React, { useState, useEffect } from 'react';
import {
    getDossierPreview,
    calculateLeadScore,
    calculateBonusPower,
    getLimitingFactorDescription,
    ReportEmailRequest
} from '@/lib/devMirror';
import { X, Terminal, Activity, Eye, ChevronRight, ChevronLeft } from 'lucide-react';

interface DevInspectorProps {
    formData: ReportEmailRequest['inputs'];
    results: ReportEmailRequest['results'] | null;
    language: ReportEmailRequest['language'];
}

export const DevInspector: React.FC<DevInspectorProps> = ({ formData, results, language }) => {
    // 1. Guard: Return null if not in DEV mode
    if (!import.meta.env.DEV) return null;

    const [isOpen, setIsOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [viewMode, setViewMode] = useState<'client' | 'advisor'>('client');
    const [queueCount, setQueueCount] = useState(0);

    // Listen for external trigger (from Step 5)
    useEffect(() => {
        const handleTrigger = () => {
            setShowPreview(true);
            setIsOpen(true);
        };
        window.addEventListener('dev-mirror-preview', handleTrigger);
        return () => window.removeEventListener('dev-mirror-preview', handleTrigger);
    }, []);

    // Poll analytics queue count
    useEffect(() => {
        const updateQueueCount = () => {
            try {
                const queue = JSON.parse(localStorage.getItem('budget_buddy_analytics_queue') || '[]');
                setQueueCount(queue.length);
            } catch (e) {
                setQueueCount(0);
            }
        };

        updateQueueCount();
        const interval = setInterval(updateQueueCount, 2000);
        return () => clearInterval(interval);
    }, []);

    // Calculate live values (handle null results gracefully)
    const leadScoreData = results ? calculateLeadScore(formData, results) : null;
    const bonusPower = results ? calculateBonusPower(
        results.monthlyPayment,
        parseFloat(formData.interest) || 5.0,
        results.loanTermYears
    ) : 0;

    const limitingFactorDesc = results ? getLimitingFactorDescription(results.limitingFactor) : "Calculation pending...";

    const toggleOpen = () => setIsOpen(!isOpen);

    // Generate preview HTML
    const handlePreview = () => {
        setShowPreview(true);
    };

    const previewHtml = results ? getDossierPreview(formData, results, language, viewMode === 'advisor') : "";

    return (
        <>
            {!isOpen && (
                <button
                    onClick={toggleOpen}
                    className="fixed right-0 top-[100px] z-[10000] bg-black text-green-400 p-2 rounded-l-md shadow-lg border-l border-t border-b border-green-900 hover:bg-gray-900 transition-all font-mono text-xs flex items-center gap-2"
                >
                    <Terminal size={14} />
                    <span>DEV</span>
                    {queueCount > 0 && (
                        <span className="bg-red-900 text-red-200 px-1 rounded text-[10px]">{queueCount}</span>
                    )}
                </button>
            )}

            {/* Main Panel */}
            <div
                className={`fixed right-0 top-[100px] z-[10000] bg-black/90 border-l border-green-900/50 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out font-mono text-xs text-green-400 w-[280px]
          ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
        `}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-2 bg-green-900/20 border-b border-green-900/30">
                    <div className="flex items-center gap-2 font-bold">
                        <Terminal size={14} />
                        <span>ARCHITECT_HUD v1.1</span>
                    </div>
                    <button onClick={toggleOpen} className="hover:text-white transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* Analytics Monitor */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-500 uppercase text-[10px] font-bold">
                            <Activity size={10} /> Analytics Queue
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${queueCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                            <span className="text-white font-bold">{queueCount} events awaiting flush</span>
                        </div>
                    </div>

                    <div className="h-px bg-green-900/30"></div>

                    {/* Logic Monitor */}
                    <div className="space-y-2">
                        <div className="text-gray-500 uppercase text-[10px] font-bold">Logic State</div>

                        <div className="grid grid-cols-[80px_1fr] gap-1">
                            <span className="text-green-600">Factor:</span>
                            <span className="text-white truncate" title={results?.limitingFactor}>
                                {results?.limitingFactor || 'PENDING...'}
                            </span>

                            <span className="text-green-600">Score:</span>
                            <span className="text-white">
                                {leadScoreData ? (
                                    <span style={{ color: leadScoreData.priorityColor }}>
                                        {leadScoreData.score} ({leadScoreData.priorityLabel})
                                    </span>
                                ) : '---'}
                            </span>

                            <span className="text-green-600">Bonus:</span>
                            <span className="text-white">₪{bonusPower.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="h-px bg-green-900/30"></div>

                    {/* Actions */}
                    <button
                        onClick={handlePreview}
                        disabled={!results}
                        className={`w-full bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800 rounded py-2 transition-colors flex items-center justify-center gap-2 font-bold group ${!results ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Eye size={14} className="group-hover:scale-110 transition-transform" />
                        LIVE PREVIEW DOSSIER
                    </button>

                </div>
            </div>

            {/* Full Screen Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[10001] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-[700px] h-full max-h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-3 bg-gray-100 border-b">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Terminal size={14} className="text-gray-500" />
                                    <span>PREVIEW_DOSSIER</span>
                                </div>
                                <div className="flex bg-gray-200 p-1 rounded-md">
                                    <button
                                        onClick={() => setViewMode('client')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${viewMode === 'client' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        CLIENT_COPY
                                    </button>
                                    <button
                                        onClick={() => setViewMode('advisor')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${viewMode === 'advisor' ? 'bg-black text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        ADVISOR_DATA
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded uppercase">
                                    {language}
                                </span>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 bg-gray-50 relative">
                            {results ? (
                                <iframe
                                    srcDoc={previewHtml}
                                    className="w-full h-full border-none"
                                    title="Email Preview"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 font-mono text-sm bg-gray-900">
                                    <div className="flex flex-col items-center gap-3">
                                        <Activity size={32} className="animate-pulse text-green-900" />
                                        <span>[WAITING_FOR_RESULTS_FLUSH]</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-2 bg-gray-100 border-t text-[10px] text-center text-gray-500 font-mono flex justify-between items-center px-4">
                            <span>MIRROR_LOGIC: v2.4 (LOCAL_ONLY)</span>
                            <span className={viewMode === 'advisor' ? 'text-green-600 font-bold animate-pulse' : 'text-blue-600'}>
                                {viewMode.toUpperCase()}_VIEW_ACTIVE
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
