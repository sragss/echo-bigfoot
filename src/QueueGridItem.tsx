import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

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

interface QueueGridItemProps {
    item: QueueItem;
    onClick: () => void;
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

export default function QueueGridItem({ item, onClick }: QueueGridItemProps) {
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

    return (
        <button
            onClick={onClick}
            className="aspect-square w-full rounded-xl overflow-hidden relative group cursor-pointer transition-all hover:scale-105 hover:shadow-strong"
        >
            {/* Processing State */}
            {item.status === 'processing' && (
                <div className="w-full h-full bg-gradient-to-br from-green-100 via-green-200 to-green-300 animate-pulse flex flex-col items-center justify-center">
                    <div className="text-4xl mb-2">🌲</div>
                    <div className="text-sm font-medium text-green-800">Processing...</div>
                    <div className="text-xs text-green-700 mt-1">{formatElapsedTime(elapsedTime)}</div>
                </div>
            )}

            {/* Completed State */}
            {item.status === 'completed' && item.resultUrl && (
                <>
                    <img
                        src={item.resultUrl}
                        alt="Bigfoot transformation"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1 shadow-medium">
                        <CheckCircle size={20} className="text-white" />
                    </div>
                </>
            )}

            {/* Failed State */}
            {item.status === 'failed' && (
                <div className="w-full h-full bg-red-100 border-2 border-red-400 flex flex-col items-center justify-center p-4">
                    <div className="bg-red-500 rounded-full p-2 mb-2">
                        <AlertCircle size={24} className="text-white" />
                    </div>
                    <div className="text-sm font-medium text-red-800 text-center">Failed</div>
                    <div className="text-xs text-red-600 mt-1 text-center line-clamp-2">{item.error}</div>
                </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
    );
}
