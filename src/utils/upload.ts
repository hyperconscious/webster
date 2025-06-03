export async function uploadToImgBB(imageFile: File): Promise<string | null> {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (data.success) {
            return data.data.url;
        } else {
            console.error('Upload failed:', data);
            return null;
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}