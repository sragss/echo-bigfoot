import { X } from 'lucide-react';
import QueueGridItem from './QueueGridItem';

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

interface QueueGridModalProps {
    queue: QueueItem[];
    onClose: () => void;
    onItemClick: (item: QueueItem) => void;
}

export default function QueueGridModal({ queue, onClose, onItemClick }: QueueGridModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-green-200">
                    <h2 className="text-2xl font-display font-bold text-green-900">
                        Your Bigfoots 🦶
                    </h2>
                    <button
                        onClick={onClose}
                        className="bg-green-100 hover:bg-green-200 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    >
                        <X size={24} className="text-green-800" />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {queue.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🌲</div>
                            <p className="text-green-700 text-lg">No bigfoots yet!</p>
                            <p className="text-green-600 text-sm mt-2">Capture some photos to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {queue.map((item) => (
                                <QueueGridItem
                                    key={item.id}
                                    item={item}
                                    onClick={() => onItemClick(item)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
