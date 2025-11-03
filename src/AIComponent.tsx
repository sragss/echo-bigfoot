import { useState, useEffect, useCallback } from 'react';
import { useEchoModelProviders, useEcho, EchoTokenPurchase } from '@merit-systems/echo-react-sdk';
import { editImages } from './imageHelpers';
import ImageCapture from './ImageCapture';
import QueueBadge from './QueueBadge';
import QueueGridModal from './QueueGridModal';
import FullScreenModal from './FullScreenModal';

interface UploadedImage {
    file: File;
    url: string;
    id: string;
}

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

export default function AIComponent() {
    // Queue state
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [showQueueModal, setShowQueueModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Bouncing animation state for loading emoji
    const [bouncingPosition, setBouncingPosition] = useState({ x: 100, y: 100 });
    const [bouncingVelocity, setBouncingVelocity] = useState({ dx: 3, dy: 2.5 });
    const [isGorilla, setIsGorilla] = useState(false);

    const { google } = useEchoModelProviders();
    const { balance, freeTierBalance } = useEcho();

    // Check if user has sufficient funds
    const totalBalance = (balance?.balance || 0) + (freeTierBalance?.userSpendInfo?.amountLeft || 0);
    const needsPayment = totalBalance <= 0;

    // Check if any items are processing
    const isAnyProcessing = queue.some(item => item.status === 'processing');

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            queue.forEach(item => {
                URL.revokeObjectURL(item.originalUrl);
                if (item.resultUrl) {
                    URL.revokeObjectURL(item.resultUrl);
                }
            });
        };
    }, [queue]);

    // Bouncing DVD-style animation during loading
    useEffect(() => {
        if (!isAnyProcessing) return;

        const animationInterval = setInterval(() => {
            setBouncingPosition(prev => {
                const newX = prev.x + bouncingVelocity.dx;
                const newY = prev.y + bouncingVelocity.dy;

                // Check boundaries and bounce
                let newDx = bouncingVelocity.dx;
                let newDy = bouncingVelocity.dy;

                if (newX <= 30 || newX >= window.innerWidth - 30) {
                    newDx = -newDx;
                }
                if (newY <= 30 || newY >= window.innerHeight - 30) {
                    newDy = -newDy;
                }

                setBouncingVelocity({ dx: newDx, dy: newDy });

                return {
                    x: Math.max(30, Math.min(window.innerWidth - 30, newX)),
                    y: Math.max(30, Math.min(window.innerHeight - 30, newY))
                };
            });
        }, 16); // ~60fps

        // Flash to gorilla occasionally
        const flashInterval = setInterval(() => {
            setIsGorilla(true);
            setTimeout(() => setIsGorilla(false), 200);
        }, 3000);

        return () => {
            clearInterval(animationInterval);
            clearInterval(flashInterval);
        };
    }, [isAnyProcessing, bouncingVelocity.dx, bouncingVelocity.dy]);

    // Process a queue item in the background
    const processQueueItem = useCallback(async (itemId: string, file: File) => {
        try {
            const bigfootPrompt = "Transform all humans in this image into bigfoot. Keep their exact facial expression, pose, and body language. Leave the rest of the image unchanged. Keep their clothes and any accessories exactly as they are.";
            const editedImageUrls = await editImages([file], bigfootPrompt, google);

            // Update queue item with success
            setQueue(prev => prev.map(q =>
                q.id === itemId
                    ? { ...q, status: 'completed', resultUrl: editedImageUrls[0] || null, endTime: Date.now() }
                    : q
            ));

        } catch (error) {
            console.error('Image editing error:', error);

            // Check if this is a 402 payment required error
            const errorString = String(error);
            const isPaymentRequired = errorString.includes('402') ||
                                    errorString.includes('payment required') ||
                                    errorString.includes('insufficient funds') ||
                                    errorString.includes('credits');

            const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';

            // Update queue item with failure
            setQueue(prev => prev.map(q =>
                q.id === itemId
                    ? { ...q, status: 'failed', error: errorMsg, endTime: Date.now() }
                    : q
            ));

            // Show payment modal if it's a payment error
            if (isPaymentRequired) {
                setShowPaymentModal(true);
            }
        }
    }, [google]);

    // Handle new image capture
    const handleImageCapture = useCallback((newImage: UploadedImage) => {
        // Check if user has funds before adding to queue
        if (needsPayment) {
            setShowPaymentModal(true);
            return;
        }

        // Create new queue item
        const queueItem: QueueItem = {
            id: newImage.id,
            originalFile: newImage.file,
            originalUrl: newImage.url,
            status: 'processing',
            resultUrl: null,
            error: null,
            startTime: Date.now(),
            endTime: null
        };

        // Add to queue
        setQueue(prev => [...prev, queueItem]);

        // Start processing in background - pass the file directly
        processQueueItem(queueItem.id, newImage.file);
    }, [needsPayment, processQueueItem]);


    // Retry a failed queue item
    const handleRetry = useCallback((itemId: string) => {
        // Find the item to get its file
        const item = queue.find(q => q.id === itemId);
        if (!item) return;

        setQueue(prev => prev.map(q =>
            q.id === itemId
                ? { ...q, status: 'processing', error: null, startTime: Date.now(), endTime: null }
                : q
        ));
        processQueueItem(itemId, item.originalFile);
    }, [processQueueItem, queue]);

    return (
        <div className="relative w-full h-full">
            {/* Camera View - Always visible unless payment modal is showing */}
            {!showPaymentModal && (
                <ImageCapture
                    onImageCapture={handleImageCapture}
                    disabled={false}
                />
            )}

            {/* Bouncing DVD-style Bigfoot - shows when ANY item is processing */}
            {isAnyProcessing && (
                <div
                    className="fixed z-30 pointer-events-none text-6xl transition-transform duration-100 drop-shadow-lg"
                    style={{
                        left: `${bouncingPosition.x}px`,
                        top: `${bouncingPosition.y}px`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {isGorilla ? '🦍' : '🦶'}
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-green-100 to-green-200 flex flex-col items-center justify-center p-6 z-20">
                    <div className="bg-white rounded-2xl p-8 shadow-strong max-w-md text-center">
                        <div className="text-6xl mb-4">🪙</div>
                        <h3 className="text-2xl mb-4 text-green-900 font-display font-bold">
                            Need More Forest Credits
                        </h3>
                        <p className="text-green-700 mb-6 leading-relaxed">
                            Your bigfoot transformation requires more credits. Purchase additional credits to continue your cryptid research.
                        </p>
                        <div className="mb-4">
                            <p className="text-sm text-green-600">
                                Balance: ${(balance?.balance || 0).toFixed(2)} •
                                Free Credits: ${(freeTierBalance?.userSpendInfo?.amountLeft || 0).toFixed(2)}
                            </p>
                        </div>
                        <EchoTokenPurchase
                            amount={5}
                            onPurchaseComplete={() => {
                                setShowPaymentModal(false);
                            }}
                        />
                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="mt-4 text-green-600 hover:text-green-800 underline text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Queue Badge */}
            <QueueBadge
                count={queue.length}
                isProcessing={isAnyProcessing}
                onClick={() => setShowQueueModal(true)}
            />

            {/* Queue Grid Modal */}
            {showQueueModal && (
                <QueueGridModal
                    queue={queue}
                    onClose={() => setShowQueueModal(false)}
                    onItemClick={(item) => {
                        setSelectedItem(item);
                        setShowQueueModal(false);
                    }}
                />
            )}

            {/* Full Screen Item Modal */}
            {selectedItem && (
                <FullScreenModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onRetry={handleRetry}
                />
            )}
        </div>
    );
}