import { useState, useCallback, useEffect } from 'react';
import { useEchoModelProviders } from '@merit-systems/echo-react-sdk';
import { editImages } from './imageHelpers';

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
        
        try {
            const files = uploadedImages.map(img => img.file);
            const editedImageUrls = await editImages(files, editPrompt, google);
            setEditedImages(editedImageUrls);
        } catch (error) {
            console.error('Image editing error:', error);
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

    return (
        <div className="w-full p-5">
            {/* Drag & Drop Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border border-dashed border-black p-10 text-center mb-8
                    ${isDragOver ? 'bg-gray-100' : 'bg-white'}
                `}
            >
                <div className="text-2xl mb-2">📸</div>
                <p className="mb-2">
                    Drag & drop images here, paste with Cmd+V, or click to select
                </p>
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
                    className="inline-block px-3 py-1 border border-black cursor-pointer bg-blue-600 text-white"
                >
                    Choose Images
                </label>
            </div>

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