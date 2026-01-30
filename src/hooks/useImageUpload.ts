import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BUCKET_NAME = 'product-images';

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File, folder: string = 'products'): Promise<string | null> => {
    if (!file) return null;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, WebP, or GIF.');
      return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      setProgress(100);
      return urlData.publicUrl;
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleImages = async (files: File[], folder: string = 'products'): Promise<string[]> => {
    const urls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100));
      const url = await uploadImage(files[i], folder);
      if (url) urls.push(url);
    }
    
    setProgress(100);
    return urls;
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract path from URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split(`/${BUCKET_NAME}/`);
      if (pathParts.length < 2) return false;
      
      const filePath = pathParts[1];
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      toast.error('Failed to delete image: ' + error.message);
      return false;
    }
  };

  return {
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    isUploading,
    progress,
  };
};
