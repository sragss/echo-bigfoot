import { useState, useCallback, useEffect } from 'react';
import { useEchoModelProviders } from '@merit-systems/echo-react-sdk';
import { editImages } from './imageHelpers';
import { Upload, Plus } from 'lucide-react';

interface UploadedImage {
    file: File;
    url: string;
    id: string;
}


export default function AIComponent() { 
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [editedImages, setEditedImages] = useState<string[]>([]);
    const [isEditingImages, setIsEditingImages] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showLoadingBar, setShowLoadingBar] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Bouncing animation state
    const [bouncingPosition, setBouncingPosition] = useState({ x: 100, y: 100 });
    const [bouncingVelocity, setBouncingVelocity] = useState({ dx: 2, dy: 1.5 });
    const [isGorilla, setIsGorilla] = useState(false);
    
    const { google } = useEchoModelProviders();

    const addImages = useCallback((files: FileList | File[]) => {
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        const newImages: UploadedImage[] = validFiles.map(file => ({
            file,
            url: URL.createObjectURL(file),
            id: Math.random().toString(36).substring(7)
        }));
        setUploadedImages(prev => [...prev, ...newImages]);
    }, []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            addImages(files);
        }
    };

    const removeImage = (id: string) => {
        setUploadedImages(prev => {
            const imageToRemove = prev.find(img => img.id === id);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.url);
            }
            return prev.filter(img => img.id !== id);
        });
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            addImages(files);
        }
    }, [addImages]);

    const handlePaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length > 0) {
            addImages(imageFiles);
        }
    }, [addImages]);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

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
        if (!isEditingImages) return;
        
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
    }, [isEditingImages, bouncingVelocity.dx, bouncingVelocity.dy]);

    const handleImageEdit = async () => {
        if (uploadedImages.length === 0) {
            alert('🌲 Please upload at least one image for cryptid analysis!');
            return;
        }

        setIsEditingImages(true);
        setEditedImages([]);
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
            const files = uploadedImages.map(img => img.file);
            const bigfootPrompt = "Make all humans in this image into bigfoot. Leave the rest of the image unchanged. Keep their clothes and any accessories exactly.";
            const editedImageUrls = await editImages(files, bigfootPrompt, google);
            
            // Clear the interval and finish the progress bar
            clearInterval(progressInterval);
            setLoadingProgress(100);
            
            // Wait a moment to show completion, then hide
            setTimeout(() => {
                setEditedImages(editedImageUrls);
                setShowLoadingBar(false);
                setLoadingProgress(0);
            }, 500);
            
        } catch (error) {
            console.error('Image editing error:', error);
            clearInterval(progressInterval);
            setShowLoadingBar(false);
            setLoadingProgress(0);
            
            // Set user-friendly error message
            const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred while editing your images. Please try again.';
            setErrorMessage(errorMsg);
        } finally {
            setIsEditingImages(false);
        }
    };

    const addEditedToInput = async () => {
        const newImages: UploadedImage[] = [];
        
        for (let i = 0; i < editedImages.length; i++) {
            const imageUrl = editedImages[i];
            try {
                // Fetch the blob from the object URL
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                
                // Create a File object from the blob
                const file = new File([blob], `edited-image-${i + 1}.png`, { type: blob.type });
                
                // Create new UploadedImage object
                const uploadedImage: UploadedImage = {
                    file,
                    url: imageUrl, // Keep the same URL since it's already created
                    id: Math.random().toString(36).substring(7)
                };
                
                newImages.push(uploadedImage);
            } catch (error) {
                console.error(`Error converting edited image ${i + 1}:`, error);
            }
        }
        
        // Add new images to uploaded images
        setUploadedImages(prev => [...prev, ...newImages]);
        
        // Clear edited results
        setEditedImages([]);
    };

    const UploadArea = () => (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative aspect-square w-[200px] border-2 border-dashed border-green-600 text-center cursor-pointer group rounded-lg
                ${isDragOver ? 'bg-green-100 border-green-700' : 'bg-green-50 hover:bg-green-100'}
                transition-all duration-200
            `}
        >
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="file-upload"
            />
            <label
                htmlFor="file-upload"
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-green-800"
            >
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative mb-2 text-green-700">
                        <div className="text-2xl opacity-100 group-hover:opacity-0 transition-opacity duration-200">
                            🌲
                        </div>
                        <Upload 
                            size={24} 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                        />
                    </div>
                    <p className="text-sm px-2 mb-1 font-medium">
                        Upload Evidence
                    </p>
                    <p className="text-xs px-2 opacity-70">
                        Paste, Drag or Click
                    </p>
                </div>
            </label>
        </div>
    );

    return (
        <div className="w-full p-5">
            {/* Show upload area first if no images */}
            {uploadedImages.length === 0 && (
                <div className="mb-8">
                    <UploadArea />
                </div>
            )}

            {/* Research Evidence Collection */}
            {uploadedImages.length > 0 && (
                <div className="mb-8">
                    <h3 className="mb-4 text-lg text-green-900 font-bold flex items-center gap-2">
                        📸 Evidence Collection ({uploadedImages.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-5">
                        {uploadedImages.map((image) => (
                            <div key={image.id} className="relative">
                                <img
                                    src={image.url}
                                    alt={image.file.name}
                                    className="w-full h-50 object-cover border-2 border-green-600 cursor-pointer rounded-lg hover:border-green-700 transition-colors"
                                    onClick={() => setModalImage(image.url)}
                                />
                                <button
                                    onClick={() => removeImage(image.id)}
                                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 border border-red-800 w-6 h-6 cursor-pointer text-sm flex items-center justify-center text-white rounded-full transition-colors"
                                >
                                    ×
                                </button>
                                <p className="mt-1 text-xs text-center overflow-hidden text-ellipsis whitespace-nowrap text-green-800">
                                    {image.file.name}
                                </p>
                            </div>
                        ))}
                        {/* Show upload area at end if there are images */}
                        <UploadArea />
                    </div>
                </div>
            )}

            {/* Research Incident Report */}
            {errorMessage && (
                <div className="border-2 border-red-600 bg-red-50 p-4 mb-8 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg mb-2 text-red-800 font-bold flex items-center gap-2">
                                ⚠️ Research Incident
                            </h3>
                            <p className="text-sm text-red-700">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="border border-red-600 bg-red-100 hover:bg-red-200 w-6 h-6 cursor-pointer text-sm flex items-center justify-center rounded text-red-800 transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Bigfoot Detection Controls */}
            {uploadedImages.length > 0 && (
                <div className="border-2 border-green-800 bg-gradient-to-r from-green-100 to-green-50 p-6 mb-8 rounded-lg">
                    <h3 className="mb-4 text-lg text-green-900 font-bold flex items-center gap-2">
                        🔍 Cryptid Analysis Station
                    </h3>
                    <div className="bg-green-50 border border-green-600 p-4 mb-4 rounded text-green-800 text-sm">
                        <strong>Field Research Protocol:</strong> Our advanced AI will scan for human subjects and transform them into bigfoot while preserving all clothing, accessories, and environmental details.
                    </div>
                    <button
                        onClick={handleImageEdit}
                        disabled={isEditingImages || uploadedImages.length === 0}
                        className={`
                            px-6 py-3 border-2 border-green-800 cursor-pointer font-bold rounded-lg transition-all
                            ${uploadedImages.length > 0 && !isEditingImages 
                                ? 'bg-green-700 hover:bg-green-600 text-white shadow-lg' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }
                        `}
                    >
                        {isEditingImages 
                            ? `🔬 Analyzing ${uploadedImages.length} specimen${uploadedImages.length > 1 ? 's' : ''}...` 
                            : `🦶 Detect Bigfoot in ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`
                        }
                    </button>
                </div>
            )}

            {/* Cryptid Sightings Confirmed */}
            {editedImages.length > 0 && (
                <div>
                    <h3 className="mb-5 text-lg text-green-900 font-bold flex items-center gap-2">
                        🦶 Bigfoot Sightings Confirmed ({editedImages.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 mb-5">
                        {editedImages.map((imageUrl, index) => (
                            <div key={index} className="text-center">
                                <img
                                    src={imageUrl}
                                    alt={`Bigfoot sighting ${index + 1}`}
                                    className="w-full h-auto max-h-96 object-contain border-2 border-green-600 cursor-pointer rounded-lg hover:border-green-700 transition-colors"
                                    onClick={() => setModalImage(imageUrl)}
                                />
                                <p className="mt-2 text-sm text-green-800 font-medium">
                                    Research Photo #{index + 1}
                                </p>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addEditedToInput}
                        title="Add to Evidence Collection"
                        className="px-4 py-2 border-2 border-green-600 cursor-pointer bg-green-100 hover:bg-green-200 flex items-center gap-2 text-green-800 font-medium rounded-lg transition-colors"
                    >
                        📁 Add to Evidence Collection
                    </button>
                </div>
            )}

            {/* Research Progress Bar */}
            {showLoadingBar && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <div className="h-3 bg-green-100">
                        <div 
                            className="h-full bg-gradient-to-r from-green-600 to-green-700 transition-all duration-300 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Bouncing Research Assistant */}
            {isEditingImages && (
                <div 
                    className="fixed z-40 pointer-events-none text-5xl transition-transform duration-100"
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
                    className="fixed inset-0 bg-green-900/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setModalImage(null)}
                >
                    <div className="relative max-w-full max-h-full">
                        <img
                            src={modalImage}
                            alt="Research evidence - full view"
                            className="max-w-full max-h-full object-contain border-2 border-green-600 rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setModalImage(null)}
                            className="absolute top-2 right-2 bg-green-100 hover:bg-green-200 border-2 border-green-600 w-8 h-8 cursor-pointer text-lg flex items-center justify-center text-green-800 rounded-full transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}