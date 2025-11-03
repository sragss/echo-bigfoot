interface QueueBadgeProps {
    count: number;
    isProcessing: boolean;
    onClick: () => void;
}

export default function QueueBadge({ count, isProcessing, onClick }: QueueBadgeProps) {
    if (count === 0) return null;

    return (
        <button
            onClick={onClick}
            className={`
                fixed bottom-6 right-6 z-40
                w-16 h-16 rounded-full
                bg-green-600 hover:bg-green-700
                border-4 border-white
                shadow-strong hover:shadow-xl
                transition-all hover:scale-110
                flex items-center justify-center
                ${isProcessing ? 'animate-pulse ring-4 ring-green-400 ring-opacity-50' : ''}
            `}
        >
            <div className="text-center">
                <div className="text-2xl font-display font-bold text-white">
                    {count}
                </div>
                <div className="text-xs text-white opacity-90 font-medium -mt-1">
                    🦶
                </div>
            </div>
        </button>
    );
}
