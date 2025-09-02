import { useState, useEffect } from 'react';
import { useEchoModelProviders } from '@merit-systems/echo-react-sdk';
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
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showLoadingBar, setShowLoadingBar] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [rawError, setRawError] = useState<any>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    // Bouncing animation state
    const [bouncingPosition, setBouncingPosition] = useState({ x: 100, y: 100 });
    const [bouncingVelocity, setBouncingVelocity] = useState({ dx: 2, dy: 1.5 });
    const [isGorilla, setIsGorilla] = useState(false);
    
    const { google } = useEchoModelProviders();

    const handleImageCapture = (newImage: UploadedImage) => {
        // Clean up previous image if exists
        if (uploadedImage) {
            URL.revokeObjectURL(uploadedImage.url);
        }
        
        setUploadedImage(newImage);
        setEditedImage(null); // Clear any previous results
    };

    const removeImage = () => {
        if (uploadedImage) {
            URL.revokeObjectURL(uploadedImage.url);
        }
        setUploadedImage(null);
        setEditedImage(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && modalImage) {
                setModalImage(null);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [modalImage]);

    // Bouncing animation effect
    useEffect(() => {
        if (!isEditingImage) return;
        
        const animationInterval = setInterval(() => {
            setBouncingPosition(prev => {
                const newX = prev.x + bouncingVelocity.dx;
                const newY = prev.y + bouncingVelocity.dy;
                
                // Check boundaries and bounce
                let newDx = bouncingVelocity.dx;
                let newDy = bouncingVelocity.dy;
                
                if (newX <= 0 || newX >= window.innerWidth - 60) {
                    newDx = -newDx;
                }
                if (newY <= 80 || newY >= window.innerHeight - 120) {
                    newDy = -newDy;
                }
                
                setBouncingVelocity({ dx: newDx, dy: newDy });
                
                return {
                    x: Math.max(0, Math.min(window.innerWidth - 60, newX)),
                    y: Math.max(80, Math.min(window.innerHeight - 120, newY))
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

    const handleImageEdit = async () => {
        if (!uploadedImage) {
            alert('🌲 Please upload an image for bigfoot transformation!');
            return;
        }

        setIsEditingImage(true);
        setEditedImage(null);
        setErrorMessage(null); // Clear any previous errors
        setShowLoadingBar(true);
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
            const editedImageUrls = await editImages([uploadedImage.file], bigfootPrompt, google);
            
            // Clear the interval and finish the progress bar
            clearInterval(progressInterval);
            setLoadingProgress(100);
            
            // Wait a moment to show completion, then hide
            setTimeout(() => {
                setEditedImage(editedImageUrls[0] || null);
                setShowLoadingBar(false);
                setLoadingProgress(0);
            }, 500);
            
        } catch (error) {
            console.error('Image editing error:', error);
            clearInterval(progressInterval);
            setShowLoadingBar(false);
            setLoadingProgress(0);
            
            // Store complete error for debugging
            setRawError(error);
            
            // Set user-friendly error message
            const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred while transforming your image. Please try again.';
            setErrorMessage(errorMsg);
        } finally {
            setIsEditingImage(false);
        }
    };

    const saveImage = async () => {
        if (!editedImage) return;
        
        try {
            // Fetch the blob from the object URL
            const response = await fetch(editedImage);
            const blob = await response.blob();
            
            // Create download link
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
        <div className="w-full px-6 py-8">
            {/* Show capture options if no image */}
            {!uploadedImage && (
                <ImageCapture 
                    onImageCapture={handleImageCapture} 
                    disabled={isEditingImage} 
                />
            )}

            {/* Current Image */}
            {uploadedImage && (
                <div className="mb-12">
                    <h3 className="mb-6 text-2xl text-green-900 font-display font-bold flex items-center justify-center gap-3">
                        📸 Your Subject
                    </h3>
                    <div className="flex justify-center">
                        <div className="relative max-w-lg bg-white rounded-2xl p-4 shadow-strong">
                            <img
                                src={uploadedImage.url}
                                alt={uploadedImage.file.name}
                                className="w-full h-auto object-cover cursor-pointer rounded-xl hover:shadow-medium transition-all duration-300"
                                onClick={() => setModalImage(uploadedImage.url)}
                            />
                            <button
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 w-8 h-8 cursor-pointer text-sm flex items-center justify-center text-white rounded-full shadow-medium hover:shadow-strong transition-all duration-200"
                            >
                                ×
                            </button>
                            <p className="mt-3 text-sm text-center text-green-800 font-medium">
                                {uploadedImage.file.name}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Research Incident Report */}
            {errorMessage && (
                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-8 shadow-medium max-w-2xl mx-auto">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h3 className="text-xl mb-3 text-red-800 font-display font-bold flex items-center gap-3">
                                ⚠️ Research Incident
                            </h3>
                            <p className="text-red-700 leading-relaxed mb-4">{errorMessage}</p>
                            
                            {/* Advanced Details Button */}
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-red-600 text-sm underline hover:text-red-800 transition-colors"
                            >
                                Advanced
                            </button>
                            
                            {/* Advanced Error Details */}
                            {showAdvanced && rawError && (
                                <div className="mt-4 p-4 bg-red-100 rounded-lg">
                                    <h4 className="font-bold text-red-800 mb-2">Error Type:</h4>
                                    <pre className="text-xs text-red-700 mb-3">
                                        {rawError.constructor?.name || typeof rawError}
                                    </pre>
                                    
                                    <h4 className="font-bold text-red-800 mb-2">Error Message:</h4>
                                    <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap break-words mb-3">
                                        {rawError.message || String(rawError)}
                                    </pre>
                                    
                                    {rawError.stack && (
                                        <>
                                            <h4 className="font-bold text-red-800 mb-2">Stack Trace:</h4>
                                            <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap break-words mb-3" style={{maxHeight: '200px'}}>
                                                {rawError.stack}
                                            </pre>
                                        </>
                                    )}
                                    
                                    <h4 className="font-bold text-red-800 mb-2">Full Error Object:</h4>
                                    <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap break-words" style={{maxHeight: '200px'}}>
                                        {JSON.stringify(rawError, (key, value) => {
                                            // Handle circular references and functions
                                            if (typeof value === 'function') return '[Function]';
                                            if (value === rawError && key !== '') return '[Circular]';
                                            return value;
                                        }, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setErrorMessage(null);
                                setRawError(null);
                                setShowAdvanced(false);
                            }}
                            className="bg-red-100 hover:bg-red-200 w-8 h-8 cursor-pointer text-lg flex items-center justify-center rounded-full text-red-800 transition-all hover:shadow-soft ml-4"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Bigfoot Birth Controls */}
            {uploadedImage && (
                <div className="flex justify-center mb-12">
                    <button
                        onClick={handleImageEdit}
                        disabled={isEditingImage}
                        className={`
                            px-12 py-6 border-2 cursor-pointer font-display font-bold text-2xl rounded-2xl transition-all duration-300
                            ${!isEditingImage 
                                ? 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 border-green-800 text-white shadow-strong hover:shadow-xl hover:scale-105' 
                                : 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed'
                            }
                        `}
                    >
                        {isEditingImage ? '🌟 Birthing a bigfoot...' : '🦶 Birth a bigfoot'}
                    </button>
                </div>
            )}

            {/* Bigfoot Born! */}
            {editedImage && (
                <div className="text-center">
                    <h3 className="mb-8 text-3xl text-green-900 font-display font-bold flex items-center gap-4 justify-center">
                        🦶 Bigfoot Born!
                    </h3>
                    <div className="flex justify-center mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-strong hover:shadow-xl transition-all duration-300">
                            <img
                                src={editedImage}
                                alt="Bigfoot transformation result"
                                className="w-full h-auto max-w-2xl object-contain cursor-pointer rounded-xl hover:scale-105 transition-transform duration-300"
                                onClick={() => setModalImage(editedImage)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={saveImage}
                            className="px-8 py-4 border-2 border-green-600 cursor-pointer bg-gradient-to-r from-green-100 to-green-50 hover:from-green-200 hover:to-green-100 flex items-center gap-3 text-green-800 font-display font-bold rounded-xl transition-all duration-300 text-xl shadow-medium hover:shadow-strong hover:scale-105"
                        >
                            💾 Save Bigfoot
                        </button>
                    </div>
                </div>
            )}

            {/* Research Progress Bar */}
            {showLoadingBar && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <div className="h-2 bg-green-100 shadow-soft">
                        <div 
                            className="h-full bg-gradient-to-r from-green-600 via-green-500 to-green-600 transition-all duration-300 ease-out shadow-forest"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Bouncing Research Assistant */}
            {isEditingImage && (
                <div 
                    className="fixed z-40 pointer-events-none text-6xl transition-transform duration-100 drop-shadow-lg"
                    style={{ 
                        left: `${bouncingPosition.x}px`, 
                        top: `${bouncingPosition.y}px`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {isGorilla ? '🦍' : '🌲'}
                </div>
            )}

            {/* Evidence Viewer Modal */}
            {modalImage && (
                <div 
                    className="fixed inset-0 bg-green-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-6"
                    onClick={() => setModalImage(null)}
                >
                    <div className="relative max-w-full max-h-full">
                        <div className="bg-white rounded-2xl p-4 shadow-xl">
                            <img
                                src={modalImage}
                                alt="Research evidence - full view"
                                className="max-w-full max-h-[80vh] object-contain rounded-xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <button
                            onClick={() => setModalImage(null)}
                            className="absolute -top-4 -right-4 bg-white hover:bg-gray-50 border-2 border-gray-300 w-12 h-12 cursor-pointer text-xl flex items-center justify-center text-gray-600 rounded-full transition-all shadow-medium hover:shadow-strong"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}