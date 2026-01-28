// components/Signup/cloudinary.ts
import axios from 'axios';

export const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'codermeet_payment_upload'); // unsigned preset
  formData.append('folder', 'payment_screenshot');

  try {
    const res = await axios.post(
      'https://api.cloudinary.com/v1_1/dsfwkhqwq/image/upload',
      formData
    );
    // Cloudinary response handled successfully
    return res.data.secure_url as string;
  } catch (err: any) {
    return null;
  }
};
