import { useState, useCallback, useRef } from 'react';
import { Upload, Camera, RefreshCw } from 'lucide-react';
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
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Reset input so same file can be selected again
        if (event.target) {
            event.target.value = '';
        }
    }, [onImageCapture, createUploadedImage, disabled]);

    const triggerFileUpload = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

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

    const handleCameraSuccess = useCallback(async () => {
        setCameraError(null);

        // Check if device has multiple cameras
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setHasMultipleCameras(videoDevices.length > 1);
        } catch (error) {
            console.error('Error enumerating devices:', error);
        }
    }, []);

    const toggleFacingMode = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={disabled}
                className="hidden"
            />

            {cameraError ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-green-50 via-green-100 to-green-200">
                    <div className="text-6xl mb-4 text-red-500">📷</div>
                    <h3 className="text-xl font-display font-bold text-red-800 mb-2">Camera Error</h3>
                    <p className="text-sm text-red-600 mb-6">{cameraError}</p>
                    <button
                        onClick={triggerFileUpload}
                        disabled={disabled}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all disabled:opacity-50 font-medium"
                    >
                        📁 Upload Photo Instead
                    </button>
                </div>
            ) : (
                <>
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        screenshotQuality={1}
                        videoConstraints={{
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                            facingMode: facingMode
                        }}
                        onUserMedia={handleCameraSuccess}
                        onUserMediaError={handleCameraError}
                        className="w-full h-full object-cover"
                    />

                    {/* Camera Controls Overlay */}
                    {/* Flip Camera Button - Top Right (only show if multiple cameras available) */}
                    {hasMultipleCameras && (
                        <button
                            onClick={toggleFacingMode}
                            disabled={disabled}
                            className="absolute top-6 right-6 bg-white/90 hover:bg-white border-2 border-green-600 w-12 h-12 rounded-full flex items-center justify-center text-green-800 transition-all hover:shadow-medium disabled:opacity-50 hover:scale-105"
                            title={`Switch to ${facingMode === 'user' ? 'Back' : 'Front'} Camera`}
                        >
                            <RefreshCw size={20} />
                        </button>
                    )}

                    {/* Upload Button - Bottom Left */}
                    <button
                        onClick={triggerFileUpload}
                        disabled={disabled}
                        className="absolute bottom-6 left-6 bg-white/90 hover:bg-white border-2 border-green-600 w-14 h-14 rounded-full flex items-center justify-center text-green-800 transition-all hover:shadow-medium disabled:opacity-50 hover:scale-105"
                        title="Upload Photo"
                    >
                        <Upload size={24} />
                    </button>

                    {/* Capture Button - Bottom Center */}
                    <button
                        onClick={capturePhoto}
                        disabled={disabled}
                        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 border-4 border-white w-16 h-16 rounded-full flex items-center justify-center text-white transition-all hover:shadow-strong hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-strong"
                        title="Capture Photo"
                    >
                        <Camera size={32} />
                    </button>
                </>
            )}
        </div>
    );
}