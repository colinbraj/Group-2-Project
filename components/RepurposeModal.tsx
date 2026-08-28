import React, { useState } from 'react';
import { Asset, REPURPOSE_OPTIONS, RepurposeType } from '../types';
import { X, Calendar as CalendarIcon, CheckCircle2, Sparkles, AlertCircle, Loader2, Video, FileText, Image } from 'lucide-react';
import { processRepurposeJob, RepurposeJobResult } from '../services/repurposeService';

interface RepurposeModalProps {
    asset: Asset;
    onClose: () => void;
    onConfirm: (option: RepurposeType, date: string, result?: RepurposeJobResult) => void;
}

export const RepurposeModal: React.FC<RepurposeModalProps> = ({ asset, onClose, onConfirm }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedOption, setSelectedOption] = useState<RepurposeType | null>(null);
    const [scheduleDate, setScheduleDate] = useState<string>('');

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState('');
    const [currentModel, setCurrentModel] = useState('');
    const [result, setResult] = useState<RepurposeJobResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // All asset types now get the same 3 options
    const options: RepurposeType[] = ['Summarize', 'Image_Gen', 'Video_Sora'];

    const getOptionIcon = (opt: RepurposeType) => {
        switch (opt) {
            case 'Summarize': return <FileText size={18} />;
            case 'Image_Gen': return <Image size={18} />;
            case 'Video_Sora': return <Video size={18} />;
            default: return <Sparkles size={18} />;
        }
    };

    const handleStartProcessing = async () => {
        if (!selectedOption || !scheduleDate) return;

        setStep(3);
        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const jobResult = await processRepurposeJob(
                asset,
                selectedOption,
                (stage, prog, model) => {
                    setCurrentStage(stage);
                    setProgress(Math.round(prog));
                    setCurrentModel(model);
                },
                asset.fileBlob // Pass the file blob for content extraction
            );

            setResult(jobResult);
            setIsProcessing(false);

            if (!jobResult.success) {
                setError(jobResult.error || 'Processing failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIsProcessing(false);
        }
    };

    const handleComplete = () => {
        if (selectedOption && scheduleDate) {
            onConfirm(selectedOption, scheduleDate, result || undefined);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Choose Generation Method</h4>
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-4 rounded-xl border transition-all relative group
                        ${selectedOption === opt
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${selectedOption === opt ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                {getOptionIcon(opt)}
                            </div>
                            <div>
                                <p className={`font-semibold ${selectedOption === opt ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {REPURPOSE_OPTIONS[opt].label}
                                </p>
                                <p className="text-sm text-slate-500 mt-0.5">{REPURPOSE_OPTIONS[opt].desc}</p>
                            </div>
                        </div>
                        {selectedOption === opt && <CheckCircle2 size={20} className="text-blue-600" />}
                    </div>
                    <div className="mt-3 flex gap-2 ml-11">
                        {REPURPOSE_OPTIONS[opt].models.map(m => (
                            <span key={m} className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500 font-medium">
                                {m}
                            </span>
                        ))}
                    </div>
                </button>
            ))}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700">Schedule Publishing</h4>
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Date & Time</label>
                <div className="relative">
                    <CalendarIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="datetime-local"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        onChange={(e) => setScheduleDate(e.target.value)}
                        value={scheduleDate}
                    />
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    Content will be scheduled automatically after generation.
                </p>
            </div>

            {/* Summary of selected option */}
            {selectedOption && (
                <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
                    <p className="text-sm font-medium text-blue-800">Selected: {REPURPOSE_OPTIONS[selectedOption].label}</p>
                    <p className="text-xs text-blue-600 mt-1">
                        Using: {REPURPOSE_OPTIONS[selectedOption].models.join(' → ')}
                    </p>
                </div>
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            {/* Progress Section */}
            <div className="text-center">
                {isProcessing ? (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                            <div
                                className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
                                style={{ animationDuration: '1s' }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-slate-700">{progress}%</span>
                            </div>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-800">{currentStage}</h4>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                                <Loader2 size={12} className="animate-spin mr-1.5" />
                                {currentModel}
                            </span>
                        </div>
                    </>
                ) : result?.success ? (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-emerald-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-800">Processing Complete!</h4>
                        <p className="text-sm text-slate-500 mt-1">Your content is ready to be scheduled.</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle size={32} className="text-red-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-800">Processing Failed</h4>
                        <p className="text-sm text-red-500 mt-1">{error}</p>
                    </>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${result?.success ? 'bg-emerald-500' : error ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Result Preview */}
            {result?.success && (
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 max-h-48 overflow-y-auto">
                    {result.clips && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Generated Clips ({result.clips.length})</p>
                            <div className="space-y-2">
                                {result.clips.map((clip, i) => (
                                    <div key={clip.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100">
                                        <div className="w-12 h-8 bg-slate-200 rounded overflow-hidden">
                                            <img src={clip.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">{clip.title}</p>
                                            <p className="text-xs text-slate-400">{clip.duration}s</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {result.summary && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Summary</p>
                            <p className="text-sm text-slate-600">{result.summary.summary.substring(0, 200)}...</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {result.summary.modelsUsed.map(m => (
                                    <span key={m} className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                                        ✓ {m}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {result.imageUrl && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Generated Image</p>
                            <img src={result.imageUrl} alt="Generated" className="w-full h-32 object-cover rounded-lg" />

                            {result.imageCaptions && (
                                <div className="space-y-2 mt-3">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Generated Captions</p>
                                    <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                        <p className="text-[10px] font-medium text-blue-600 mb-1">📘 Facebook</p>
                                        <p className="text-xs text-slate-600">{result.imageCaptions.facebook.substring(0, 100)}...</p>
                                    </div>
                                    <div className="p-2 bg-pink-50 rounded border border-pink-100">
                                        <p className="text-[10px] font-medium text-pink-600 mb-1">📷 Instagram</p>
                                        <p className="text-xs text-slate-600">{result.imageCaptions.instagram.substring(0, 100)}...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {result.video && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Generated Video</p>
                            <video src={result.video.videoUrl} controls className="w-full rounded-lg" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-blue-600" />
                        {step === 3 ? 'Processing' : 'Repurpose Content'}
                    </h3>
                    {!isProcessing && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                                    ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-12 h-0.5 mx-1 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Asset Info */}
                    <div className="mb-6 flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-blue-600 text-xs">{asset.type}</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900 truncate max-w-[300px]">{asset.title}</p>
                            <p className="text-xs text-slate-500">
                                {step === 1 && 'Select how you want to transform this asset.'}
                                {step === 2 && 'Choose when to publish the generated content.'}
                                {step === 3 && (isProcessing ? 'AI is working on your content...' : 'Processing complete!')}
                            </p>
                        </div>
                    </div>

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-between bg-slate-50">
                    {step === 2 ? (
                        <button
                            onClick={() => setStep(1)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                        >
                            Back
                        </button>
                    ) : step === 3 && !isProcessing && !result?.success ? (
                        <button
                            onClick={() => setStep(2)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                        >
                            Try Again
                        </button>
                    ) : <div></div>}

                    {step === 1 && (
                        <button
                            disabled={!selectedOption}
                            onClick={() => setStep(2)}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            Next: Schedule
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            type="button"
                            disabled={!scheduleDate}
                            onClick={handleStartProcessing}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center gap-2 shadow-md"
                            style={{ backgroundColor: scheduleDate ? '#2563eb' : '#94a3b8', color: '#ffffff' }}
                        >
                            <Sparkles size={16} style={{ color: '#ffffff' }} />
                            <span style={{ color: '#ffffff' }}>Start Generation</span>
                        </button>
                    )}

                    {step === 3 && !isProcessing && result?.success && (
                        <button
                            onClick={handleComplete}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors flex items-center gap-2"
                        >
                            <CheckCircle2 size={16} />
                            Schedule & Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
