import { generateText } from 'ai';

// Helper function to convert File to base64
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });
};

// Helper function to process AI response and extract image URLs
export const processAIResponse = (result: any): string[] => {
    const imageFiles = result.files?.filter((f: any) =>
        f.mediaType?.startsWith('image/')
    ) || [];

    return imageFiles.map((file: any) => {
        const blob = new Blob([file.uint8Array], { type: file.mediaType });
        return URL.createObjectURL(blob);
    });
};

// Helper function to edit multiple images in a single prompt
export const editImages = async (files: File[], prompt: string, googleProvider: any): Promise<string[]> => {
    try {
        // Convert all files to base64
        const base64Images = await Promise.all(files.map(file => fileToBase64(file)));
        
        // Create content array with all images and the prompt
        const content = [
            ...base64Images.map((base64, index) => ({ 
                type: 'image' as const, 
                image: base64 
            })),
            { type: 'text' as const, text: `${prompt}\n\nPlease edit all ${files.length} images according to these instructions.` }
        ];

        const result = await generateText({
            model: await googleProvider('gemini-2.5-flash-image-preview'),
            messages: [
                {
                    role: 'user',
                    content
                }
            ],
            providerOptions: {
                google: { responseModalities: ['TEXT', 'IMAGE'] },
            },
        });

        return processAIResponse(result);
    } catch (error) {
        console.error('Error editing images:', error);
        return [];
    }
};