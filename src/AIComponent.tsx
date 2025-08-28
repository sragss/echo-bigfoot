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

    return (
        <div className="w-full p-5">
            {/* Drag & Drop Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-2 border-dashed rounded-xl p-10 text-center mb-8 transition-all duration-300 ease-in-out
                    ${isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-gray-50'
                    }
                `}
            >
                <div className="text-2xl mb-2.5">📸</div>
                <p className="text-lg mb-2.5 text-gray-700">
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
                    className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-md cursor-pointer text-base hover:bg-blue-700 transition-colors"
                >
                    Choose Images
                </label>
            </div>

            {/* Uploaded Images Grid */}
            {uploadedImages.length > 0 && (
                <div className="mb-8">
                    <h3 className="mb-4 text-xl font-semibold text-gray-800">
                        Uploaded Images ({uploadedImages.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-5">
                        {uploadedImages.map((image) => (
                            <div key={image.id} className="relative">
                                <img
                                    src={image.url}
                                    alt={image.file.name}
                                    className="w-full h-50 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setModalImage(image.url)}
                                />
                                <button
                                    onClick={() => removeImage(image.id)}
                                    className="absolute top-1 right-1 bg-white/90 border-0 rounded-full w-7 h-7 cursor-pointer text-base hover:bg-white transition-colors flex items-center justify-center"
                                >
                                    ×
                                </button>
                                <p className="mt-1 text-xs text-gray-600 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                                    {image.file.name}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Controls */}
            {uploadedImages.length > 0 && (
                <div className="bg-gray-100 p-6 rounded-xl mb-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800">Edit Instructions</h3>
                    <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="Describe how you want to edit your images..."
                        className="w-full h-20 p-3 border border-gray-300 rounded-lg text-base mb-4 resize-y font-inherit focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleImageEdit}
                        disabled={isEditingImages || uploadedImages.length === 0}
                        className={`
                            px-6 py-3 text-white border-0 rounded-lg text-base font-semibold transition-colors
                            ${uploadedImages.length > 0 && !isEditingImages 
                                ? 'bg-green-600 cursor-pointer hover:bg-green-700' 
                                : 'bg-gray-400 cursor-not-allowed'
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
                    <h3 className="mb-5 text-xl font-semibold text-gray-800">
                        Edited Results ({editedImages.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                        {editedImages.map((imageUrl, index) => (
                            <div key={index} className="text-center">
                                <img
                                    src={imageUrl}
                                    alt={`Edited image ${index + 1}`}
                                    className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-300 shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setModalImage(imageUrl)}
                                />
                            </div>
                        ))}
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
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setModalImage(null)}
                            className="absolute top-2 right-2 bg-white/90 border-0 rounded-full w-8 h-8 cursor-pointer text-lg hover:bg-white transition-colors flex items-center justify-center font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}