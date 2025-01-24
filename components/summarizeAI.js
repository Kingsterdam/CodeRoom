import React, { useState, useRef } from 'react';
import { geminiCodeSummary } from '@/utils/aiUtils';
import { Sparkles, Copy, Wand2, Zap } from 'lucide-react';

const CodeSummaryPopup = ({
    selectedCode,
    language,
    onClose,
    style
}) => {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSummarize = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const summaryResult = await geminiCodeSummary(selectedCode, language);
            setSummary(summaryResult);
        } catch (err) {
            setError('Failed to generate summary.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopySummary = () => {
        if (summary) {
            navigator.clipboard.writeText(summary);
        }
    };

    // Function to parse the summary and format it
    const parseSummary = (text) => {
        // Split the text by '**' to detect headings and normal text
        const parts = text.split('**').map((part, index) => {
            if (index % 2 === 1) {
                // If part is inside '**', treat it as a heading
                return <h3 key={index} className="text-xl font-semibold text-emerald-600 my-2">{part}</h3>;
            } else {
                // Otherwise, it's just normal text
                return <p key={index} className="text-sm dark:text-white/90 leading-relaxed">{part}</p>;
            }
        });
        return parts;
    };

    return (
        <div
            className="fixed bg-white dark:bg-gray-900 rounded-xl shadow-lg transition-all duration-300 ease-in-out overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-blue-400/20 scrollbar-track-gray-100 dark:scrollbar-track-gray-800/40"
            style={{
                ...style,
                width: summary || isLoading ? '380px' : '100px', 
                height: summary || isLoading ? 'auto' : '40px', 
                maxHeight: '400px',
            }}
        >
            <div className="flex items-center justify-between p-2">
                {!summary && !isLoading ? (
                    <button 
                        onClick={handleSummarize}
                        className="w-full flex items-center justify-center"
                    >
                        <Sparkles className="text-emerald-500" size={20} />
                        <span className="text-sm text-emerald-500 font-bold dark:text-white/80 px-2">
                            Explain
                        </span>
                    </button>
                ) : (
                    <>
                        <div className="flex items-center justify-between space-x-3 w-full">
                            <Sparkles className="text-emerald-500" size={20} />
                            {isLoading && (
                                <span className="text-sm text-emerald-500 font-bold dark:text-white/80">
                                    Explaining ...
                                </span>
                            )}
                            <button 
                                onClick={onClose} 
                                className="ml-auto text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                    </>
                )}
            </div>

            {(summary || error) && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
                    {error && (
                        <div className="text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                    {summary && (
                        <div>
                            {parseSummary(summary)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CodeSummaryPopup;
