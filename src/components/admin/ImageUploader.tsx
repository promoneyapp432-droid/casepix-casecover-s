import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
  className?: string;
}

const ImageUploader = ({
  value,
  onChange,
  folder = 'products',
  label = 'Upload Image',
  className,
}: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, deleteImage, isUploading } = useImageUpload();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File) => {
    const url = await uploadImage(file, folder);
    if (url) {
      onChange(url);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = async () => {
    if (value) {
      await deleteImage(value);
      onChange(null);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          value ? 'p-2' : 'p-6'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <AnimatePresence mode="wait">
          {value ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative aspect-video rounded-lg overflow-hidden bg-secondary"
            >
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Drop your image here</p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse (JPG, PNG, WebP, max 5MB)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploader;
