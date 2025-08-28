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
    const [editPrompt, setEditPrompt] = useState("Make the image more vibrant and add dramatic lighting");
    const [editedImages, setEditedImages] = useState<string[]>([]);
    const [isEditingImages, setIsEditingImages] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showLoadingBar, setShowLoadingBar] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
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

    const handleImageEdit = async () => {
        if (uploadedImages.length === 0) {
            alert('Please upload at least one image first');
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
            const editedImageUrls = await editImages(files, editPrompt, google);
            
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
                relative aspect-square w-[200px] border border-dashed border-black text-center cursor-pointer group
                ${isDragOver ? 'bg-gray-100' : 'bg-white'}
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
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
            >
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative mb-2">
                        <Plus 
                            size={24} 
                            className="opacity-100 group-hover:opacity-0 transition-opacity duration-200" 
                        />
                        <Upload 
                            size={24} 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                        />
                    </div>
                    <p className="text-sm px-2 mb-1">
                        Add Images
                    </p>
                    <p className="text-xs px-2 opacity-60">
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

            {/* Uploaded Images Grid */}
            {uploadedImages.length > 0 && (
                <div className="mb-8">
                    <h3 className="mb-4 text-lg">
                        Uploaded Images ({uploadedImages.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-5">
                        {uploadedImages.map((image) => (
                            <div key={image.id} className="relative">
                                <img
                                    src={image.url}
                                    alt={image.file.name}
                                    className="w-full h-50 object-cover border border-black cursor-pointer"
                                    onClick={() => setModalImage(image.url)}
                                />
                                <button
                                    onClick={() => removeImage(image.id)}
                                    className="absolute top-1 right-1 bg-white border border-black w-6 h-6 cursor-pointer text-sm flex items-center justify-center"
                                >
                                    ×
                                </button>
                                <p className="mt-1 text-xs text-center overflow-hidden text-ellipsis whitespace-nowrap">
                                    {image.file.name}
                                </p>
                            </div>
                        ))}
                        {/* Show upload area at end if there are images */}
                        <UploadArea />
                    </div>
                </div>
            )}

            {/* Error Display */}
            {errorMessage && (
                <div className="border border-black bg-red-50 p-4 mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg mb-2">Error</h3>
                            <p className="text-sm">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="border border-black bg-white w-6 h-6 cursor-pointer text-sm flex items-center justify-center"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Controls */}
            {uploadedImages.length > 0 && (
                <div className="border border-black p-6 mb-8">
                    <h3 className="mb-4 text-lg">Edit Instructions</h3>
                    <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                if (uploadedImages.length > 0 && !isEditingImages) {
                                    handleImageEdit();
                                }
                            }
                        }}
                        placeholder="Describe how you want to edit your images... (Cmd+Enter to generate)"
                        className="w-full h-20 p-3 border border-black mb-4 resize-y focus:outline-none"
                    />
                    <button
                        onClick={handleImageEdit}
                        disabled={isEditingImages || uploadedImages.length === 0}
                        className={`
                            px-3 py-2 border border-black cursor-pointer
                            ${uploadedImages.length > 0 && !isEditingImages 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-300 text-gray-500'
                            }
                        `}
                    >
                        {isEditingImages 
                            ? `Editing ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}...` 
                            : `Edit ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`
                        }
                    </button>
                </div>
            )}

            {/* Edited Results */}
            {editedImages.length > 0 && (
                <div>
                    <h3 className="mb-5 text-lg">
                        Edited Results ({editedImages.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 mb-5">
                        {editedImages.map((imageUrl, index) => (
                            <div key={index} className="text-center">
                                <img
                                    src={imageUrl}
                                    alt={`Edited image ${index + 1}`}
                                    className="w-full h-auto max-h-96 object-contain border border-black cursor-pointer"
                                    onClick={() => setModalImage(imageUrl)}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addEditedToInput}
                        title="Add to Input"
                        className="w-8 h-8 border border-black cursor-pointer bg-white flex items-center justify-center text-lg"
                    >
                        +
                    </button>
                </div>
            )}

            {/* Loading Bar */}
            {showLoadingBar && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <div className="h-2 sm:h-1 bg-gray-200">
                        <div 
                            className="h-full bg-black transition-all duration-300 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {modalImage && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setModalImage(null)}
                >
                    <div className="relative max-w-full max-h-full">
                        <img
                            src={modalImage}
                            alt="Full size view"
                            className="max-w-full max-h-full object-contain border border-black"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setModalImage(null)}
                            className="absolute top-2 right-2 bg-white border border-black w-8 h-8 cursor-pointer text-lg flex items-center justify-center"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}