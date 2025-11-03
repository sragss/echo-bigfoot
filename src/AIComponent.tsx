import { useState, useEffect, useCallback } from 'react';
import { useEchoModelProviders, useEcho, EchoTokenPurchase } from '@merit-systems/echo-react-sdk';
import { editImages } from './imageHelpers';
import ImageCapture from './ImageCapture';

interface UploadedImage {
    file: File;
    url: string;
    id: string;
}


export default function AIComponent() {
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [rawError, setRawError] = useState<any>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Bouncing animation state for loading emoji
    const [bouncingPosition, setBouncingPosition] = useState({ x: 100, y: 100 });
    const [bouncingVelocity, setBouncingVelocity] = useState({ dx: 3, dy: 2.5 });
    const [isGorilla, setIsGorilla] = useState(false);

    const { google } = useEchoModelProviders();
    const { balance, freeTierBalance } = useEcho();

    // Check if user has sufficient funds
    const totalBalance = (balance?.balance || 0) + (freeTierBalance?.userSpendInfo?.amountLeft || 0);
    const needsPayment = totalBalance <= 0;

    const resetToCamera = useCallback(() => {
        if (uploadedImage) {
            URL.revokeObjectURL(uploadedImage.url);
        }
        if (editedImage) {
            URL.revokeObjectURL(editedImage);
        }
        setUploadedImage(null);
        setEditedImage(null);
        setErrorMessage(null);
        setRawError(null);
        setShowAdvanced(false);
    }, [uploadedImage, editedImage]);

    // Bouncing DVD-style animation during loading
    useEffect(() => {
        if (!isEditingImage) return;

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
    }, [isEditingImage, bouncingVelocity.dx, bouncingVelocity.dy]);

    const handleImageEdit = useCallback(async (imageFile: File) => {
        setIsEditingImage(true);
        setEditedImage(null);
        setErrorMessage(null);
        setLoadingProgress(0);

        // Start simulated progress animation
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev < 90) {
                    return prev + Math.random() * 2 + 1; // Random progress between 1-3% per step
                }
                return 90; // Stop at 90%
            });
        }, 400);

        try {
            const bigfootPrompt = "Transform all humans in this image into bigfoot. Keep their exact facial expression, pose, and body language. Leave the rest of the image unchanged. Keep their clothes and any accessories exactly as they are.";
            const editedImageUrls = await editImages([imageFile], bigfootPrompt, google);

            // Clear the interval and finish the progress bar
            clearInterval(progressInterval);
            setLoadingProgress(100);

            // Wait a moment to show completion
            setTimeout(() => {
                setEditedImage(editedImageUrls[0] || null);
                setLoadingProgress(0);
            }, 500);

        } catch (error) {
            console.error('Image editing error:', error);
            clearInterval(progressInterval);
            setLoadingProgress(0);

            // Check if this is a 402 payment required error
            const errorString = String(error);
            const isPaymentRequired = errorString.includes('402') ||
                                    errorString.includes('payment required') ||
                                    errorString.includes('insufficient funds') ||
                                    errorString.includes('credits');

            if (isPaymentRequired) {
                // Don't show error for payment issues, let the payment component handle it
                return;
            }

            // Store complete error for debugging
            setRawError(error);

            // Set user-friendly error message
            const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred while transforming your image. Please try again.';
            setErrorMessage(errorMsg);
        } finally {
            setIsEditingImage(false);
        }
    }, [google]);

    const handleImageCapture = useCallback((newImage: UploadedImage) => {
        // Clean up previous image if exists
        if (uploadedImage) {
            URL.revokeObjectURL(uploadedImage.url);
        }

        setUploadedImage(newImage);
        setEditedImage(null); // Clear any previous results

        // Auto-trigger bigfoot transformation if user has funds
        if (!needsPayment) {
            handleImageEdit(newImage.file);
        }
    }, [uploadedImage, needsPayment, handleImageEdit]);


    return (
        <div className="relative w-full h-full">
            {/* Camera View - Always visible unless there's an error or payment needed */}
            {!needsPayment && !errorMessage && (
                <ImageCapture
                    onImageCapture={handleImageCapture}
                    disabled={isEditingImage}
                />
            )}

            {/* Loading Overlay */}
            {isEditingImage && (
                <>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                        <div className="bg-white/90 rounded-2xl p-6 mx-6 max-w-sm">
                            <h3 className="text-xl font-display font-bold text-green-900 mb-3 text-center">
                                Birthing Bigfoot...
                            </h3>
                            <div className="w-full bg-green-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-600 via-green-500 to-green-600 transition-all duration-300 ease-out"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                            <p className="text-sm text-green-700 mt-3 text-center">
                                {loadingProgress < 90 ? 'Analyzing cryptid features...' : 'Almost there...'}
                            </p>
                        </div>
                    </div>

                    {/* Bouncing DVD-style Bigfoot */}
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
                </>
            )}

            {/* Error Overlay */}
            {errorMessage && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-green-100 to-green-200 flex flex-col items-center justify-center p-6 z-20">
                    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-strong max-w-lg">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-xl mb-3 text-red-800 font-display font-bold flex items-center gap-3">
                                    ⚠️ Research Incident
                                </h3>
                                <p className="text-red-700 leading-relaxed mb-4">{errorMessage}</p>

                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="text-red-600 text-sm underline hover:text-red-800 transition-colors mb-4"
                                >
                                    {showAdvanced ? 'Hide' : 'Show'} Advanced Details
                                </button>

                                {showAdvanced && rawError && (
                                    <div className="mt-4 p-4 bg-red-100 rounded-lg max-h-64 overflow-y-auto">
                                        <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                                            {JSON.stringify(rawError, (key, value) => {
                                                if (typeof value === 'function') return '[Function]';
                                                if (value === rawError && key !== '') return '[Circular]';
                                                return value;
                                            }, 2)}
                                        </pre>
                                    </div>
                                )}

                                <button
                                    onClick={resetToCamera}
                                    className="w-full mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-medium"
                                >
                                    Try Again
                                </button>
                            </div>
                            <button
                                onClick={resetToCamera}
                                className="bg-red-100 hover:bg-red-200 w-8 h-8 cursor-pointer text-lg flex items-center justify-center rounded-full text-red-800 transition-all hover:shadow-soft ml-4"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Required Overlay */}
            {needsPayment && (
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
                                // Refresh will happen automatically through the hook
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Result Overlay */}
            {editedImage && !isEditingImage && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-30">
                    <img
                        src={editedImage}
                        alt="Bigfoot transformation result"
                        className="w-full h-full object-cover"
                    />

                    {/* Save Button */}
                    <button
                        onClick={async () => {
                            try {
                                const response = await fetch(editedImage);
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
                        }}
                        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 px-8 py-4 rounded-full shadow-strong hover:shadow-xl transition-all hover:scale-105"
                    >
                        <p className="text-white font-display font-bold text-lg flex items-center gap-2">
                            💾
                        </p>
                    </button>

                    {/* Close button */}
                    <button
                        onClick={resetToCamera}
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white border-2 border-green-600 w-12 h-12 cursor-pointer text-lg flex items-center justify-center text-green-800 rounded-full transition-all shadow-medium hover:shadow-strong"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}