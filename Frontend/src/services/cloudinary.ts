// cloudinary.ts
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'profile_pictures';

if (!CLOUD_NAME) {
  // Cloudinary cloud name is not set
}

export const uploadToCloudinary = async (file: File): Promise<string> => {
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary is not properly configured. Missing cloud name.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload error:', errorData);
      throw new Error(errorData.message || errorData.error?.message || 'Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};