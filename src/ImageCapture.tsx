import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Camera, RotateCcw } from 'lucide-react';
import Webcam from 'react-webcam';

interface UploadedImage {
    file: File;
    url: string;
    id: string;
}

interface ImageCaptureProps {
    onImageCapture: (image: UploadedImage) => void;
    disabled?: boolean;
}

export default function ImageCapture({ onImageCapture, disabled = false }: ImageCaptureProps) {
    // State
    const [captureMode, setCaptureMode] = useState<'upload' | 'camera'>('camera');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    // Helper functions
    const createUploadedImage = useCallback((file: File): UploadedImage => ({
        file,
        url: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7)
    }), []);

    const dataURLtoFile = useCallback((dataurl: string, filename: string): File => {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }, []);

    // Upload handlers
    const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0 && !disabled) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                onImageCapture(createUploadedImage(file));
            }
        }
    }, [onImageCapture, createUploadedImage, disabled]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragOver(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                onImageCapture(createUploadedImage(file));
            }
        }
    }, [onImageCapture, createUploadedImage, disabled]);

    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (disabled) return;
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    onImageCapture(createUploadedImage(file));
                    break;
                }
            }
        }
    }, [onImageCapture, createUploadedImage, disabled]);

    // Camera handlers
    const capturePhoto = useCallback(() => {
        if (disabled) return;
        
        // Get the video element from the webcam
        const video = webcamRef.current?.video;
        if (!video) return;
        
        // Create a canvas with the video's natural dimensions (full resolution)
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Draw the current frame at full resolution
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to high quality JPEG
        const imageSrc = canvas.toDataURL('image/jpeg', 0.95);
        
        if (imageSrc) {
            const file = dataURLtoFile(imageSrc, 'webcam-capture.jpg');
            onImageCapture(createUploadedImage(file));
            setCameraError(null);
        }
    }, [onImageCapture, createUploadedImage, dataURLtoFile, disabled]);

    const handleCameraError = useCallback((error: string | Error) => {
        console.error('Camera error:', error);
        setCameraError(typeof error === 'string' ? error : 'Camera access denied or not available');
    }, []);

    const handleCameraSuccess = useCallback(() => {
        setCameraError(null);
    }, []);

    const toggleFacingMode = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, []);

    // Effects
    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

    // Components
    const UploadArea = () => (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative aspect-square w-[280px] border-2 border-dashed text-center cursor-pointer group rounded-2xl shadow-medium hover:shadow-strong
                ${isDragOver 
                    ? 'bg-green-100 border-green-700 scale-105' 
                    : 'bg-white hover:bg-green-50 border-green-500 hover:border-green-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                transition-all duration-300 ease-out
            `}
        >
            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={disabled}
                className="hidden"
                id="file-upload"
            />
            <label
                htmlFor="file-upload"
                className={`absolute inset-0 flex flex-col items-center justify-center text-green-800 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div className="flex flex-col items-center justify-center h-full p-6">
                    <div className="relative mb-4 text-green-700">
                        <div className="text-4xl opacity-100 group-hover:opacity-0 transition-opacity duration-200">
                            🌲
                        </div>
                        <Upload 
                            size={32} 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                        />
                    </div>
                    <p className="text-lg px-2 mb-2 font-display font-bold">
                        Upload Evidence
                    </p>
                    <p className="text-sm px-2 opacity-70">
                        Paste, Drag or Click
                    </p>
                </div>
            </label>
        </div>
    );

    const CameraArea = () => (
        <div className={`relative bg-white rounded-2xl shadow-medium hover:shadow-strong transition-all duration-300 overflow-hidden ${disabled ? 'opacity-50' : ''}`}>
            {cameraError ? (
                <div className="w-[280px] aspect-square flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-4xl mb-4 text-red-500">📷</div>
                    <h3 className="text-lg font-display font-bold text-red-800 mb-2">Camera Error</h3>
                    <p className="text-sm text-red-600 mb-4">{cameraError}</p>
                    <button
                        onClick={() => setCaptureMode('upload')}
                        disabled={disabled}
                        className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Use Upload Instead
                    </button>
                </div>
            ) : (
                <>
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        width={280}
                        height={280}
                        screenshotFormat="image/jpeg"
                        screenshotQuality={1}
                        videoConstraints={{
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                            facingMode: facingMode
                        }}
                        onUserMedia={handleCameraSuccess}
                        onUserMediaError={handleCameraError}
                        className="w-[280px] h-[280px] object-cover"
                    />
                    
                    {/* Camera Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                        {/* Flip Camera Button (Mobile) */}
                        <button
                            onClick={toggleFacingMode}
                            disabled={disabled}
                            className="bg-white/90 hover:bg-white border-2 border-green-600 w-10 h-10 rounded-full flex items-center justify-center text-green-800 transition-all hover:shadow-medium disabled:opacity-50"
                            title="Switch Camera"
                        >
                            <RotateCcw size={16} />
                        </button>
                        
                        {/* Capture Button */}
                        <button
                            onClick={capturePhoto}
                            disabled={disabled}
                            className="bg-green-600 hover:bg-green-700 border-2 border-green-800 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:shadow-medium hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            title="Capture Photo"
                        >
                            <Camera size={20} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    const ModeToggle = () => (
        <div className="flex justify-center mb-6">
            <div className="bg-white rounded-xl p-2 shadow-medium">
                <div className="flex gap-2">
                    <button
                        onClick={() => setCaptureMode('upload')}
                        disabled={disabled}
                        className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                            captureMode === 'upload'
                                ? 'bg-green-600 text-white shadow-soft'
                                : 'text-green-800 hover:bg-green-50'
                        }`}
                    >
                        📁 Upload Photo
                    </button>
                    <button
                        onClick={() => setCaptureMode('camera')}
                        disabled={disabled}
                        className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                            captureMode === 'camera'
                                ? 'bg-green-600 text-white shadow-soft'
                                : 'text-green-800 hover:bg-green-50'
                        }`}
                    >
                        📷 Take Photo
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center">
            <ModeToggle />
            <div className="mb-12">
                {captureMode === 'upload' ? <UploadArea /> : <CameraArea />}
            </div>
        </div>
    );
}