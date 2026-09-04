import cloudinary, { CLOUDINARY_FOLDER } from '../config/cloudinary';

export const uploadFile = async (
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  folder: string
): Promise<{ url: string; key: string }> => {
  const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `${CLOUDINARY_FOLDER}/${folder}`,
    resource_type: 'image',
    filename_override: originalFilename,
    use_filename: true,
    unique_filename: true,
  });

  return { url: result.secure_url, key: result.public_id };
};

export const deleteFile = async (key: string): Promise<void> => {
  await cloudinary.uploader.destroy(key);
};
