import { useState, useEffect } from 'react';
import { X, Download, RefreshCw } from 'lucide-react';

interface QueueItem {
    id: string;
    originalFile: File;
    originalUrl: string;
    status: 'processing' | 'completed' | 'failed';
    resultUrl: string | null;
    error: string | null;
    startTime: number;
    endTime: number | null;
}

interface FullScreenModalProps {
    item: QueueItem;
    onClose: () => void;
    onRetry?: (itemId: string) => void;
}

function formatElapsedTime(ms: number): string {
    const totalSeconds = ms / 1000;
    if (totalSeconds < 60) {
        return `${totalSeconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
}

export default function FullScreenModal({ item, onClose, onRetry }: FullScreenModalProps) {
    const [elapsedTime, setElapsedTime] = useState(0);

    // Update elapsed time every 100ms for processing items
    useEffect(() => {
        if (item.status !== 'processing') return;

        const updateElapsed = () => {
            setElapsedTime(Date.now() - item.startTime);
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 100);

        return () => clearInterval(interval);
    }, [item.status, item.startTime]);

    const handleSave = async () => {
        if (!item.resultUrl) return;

        try {
            const response = await fetch(item.resultUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'bigfoot-transformation.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error saving image:', error);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black flex items-center justify-center z-50"
            onClick={onClose}
        >
            {/* Processing State */}
            {item.status === 'processing' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                    <div className="bg-white/90 rounded-2xl p-8 mx-6 max-w-sm text-center">
                        <div className="text-6xl mb-4 animate-pulse-soft">🦶</div>
                        <h3 className="text-2xl font-display font-bold text-green-900 mb-4">
                            Birthing Bigfoot...
                        </h3>
                        <p className="text-green-700 text-lg mb-4">
                            {formatElapsedTime(elapsedTime)}
                        </p>
                        <p className="text-sm text-green-600">
                            This usually takes 10-30 seconds
                        </p>
                    </div>
                </div>
            )}

            {/* Completed State */}
            {item.status === 'completed' && item.resultUrl && (
                <>
                    <img
                        src={item.resultUrl}
                        alt="Bigfoot transformation result"
                        className="w-full h-full object-cover"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Save Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                        }}
                        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 px-8 py-4 rounded-full shadow-strong hover:shadow-xl transition-all hover:scale-105"
                    >
                        <div className="text-white font-display font-bold text-lg flex items-center gap-2">
                            <Download size={24} />
                            Save Bigfoot
                        </div>
                    </button>
                </>
            )}

            {/* Failed State */}
            {item.status === 'failed' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 mx-6 max-w-lg">
                        <div className="text-6xl mb-4 text-center">⚠️</div>
                        <h3 className="text-2xl font-display font-bold text-red-800 mb-4 text-center">
                            Transformation Failed
                        </h3>
                        <p className="text-red-700 mb-6 text-center">
                            {item.error || 'An unexpected error occurred'}
                        </p>

                        {onRetry && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRetry(item.id);
                                    onClose();
                                }}
                                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={20} />
                                Retry Transformation
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white border-2 border-green-600 w-12 h-12 cursor-pointer text-lg flex items-center justify-center text-green-800 rounded-full transition-all shadow-medium hover:shadow-strong"
            >
                <X size={24} />
            </button>
        </div>
    );
}
