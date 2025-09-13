
import React, { useState, useCallback, useEffect } from 'react';
import { OriginalImage } from '../types';
import { ExpandIcon, UploadCloudIcon } from './ui/Icons';

interface ImageUploaderProps {
  onImageUpload: (image: OriginalImage) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File | null) => {
    // Debug logging
    console.log('Processing file:', {
      file: file,
      name: file?.name,
      type: file?.type,
      size: file?.size
    });

    if (!file) {
      alert('No file provided. Please try again.');
      return;
    }

    // Check if file is an image by MIME type or extension
    const isImageByType = file.type && file.type.startsWith('image/');
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'];
    const fileName = file.name?.toLowerCase() || '';
    const isImageByExtension = imageExtensions.some(ext => fileName.endsWith(ext));
    
    // More lenient check - if we have a file with size, try to process it
    const shouldTryProcessing = file && (isImageByType || isImageByExtension || file.size > 0);
    
    if (shouldTryProcessing) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        const result = e.target?.result as string;
        img.onload = () => {
          console.log('Image loaded successfully:', img.width, 'x', img.height);
          onImageUpload({ src: result, width: img.width, height: img.height });
        };
        img.onerror = () => {
          console.error('Failed to load image');
          alert('Failed to load the image. Please try a different file.');
        };
        img.src = result;
      };
      reader.onerror = () => {
        console.error('FileReader error');
        alert('Failed to read the file. Please try again.');
      };
      reader.readAsDataURL(file);
    } else {
      console.error('File validation failed:', {
        isImageByType,
        isImageByExtension,
        fileName,
        fileType: file?.type
      });
      alert('Please select an image file.');
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    console.log('Drop event:', {
      files: e.dataTransfer.files,
      items: e.dataTransfer.items,
      types: e.dataTransfer.types
    });

    // Try using items API first (better compatibility)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0];
      console.log('Using items API:', item.kind, item.type);
      
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          processFile(file);
          return;
        }
      }
    }
    
    // Fallback to files API
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log('Using files API');
      processFile(e.dataTransfer.files[0]);
      return;
    }
    
    console.error('No files found in drop event');
    alert('No files were dropped. Please try again.');
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);
  
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              processFile(file);
            }
            break;
        }
    }
  }, [processFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
        window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="text-center w-full max-w-2xl">
      <div className="flex flex-col items-center justify-center gap-2 mb-8">
        <ExpandIcon className="h-6 w-6 text-muted-foreground" />
        <p className="text-muted-foreground">Expand your images to any size</p>
      </div>
      <div
        onClick={triggerFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed border-border transition-all duration-300 cursor-pointer
          ${isDragging ? 'border-primary bg-accent' : 'bg-secondary/50 hover:border-primary/80'}`}
      >
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <UploadCloudIcon className="w-12 h-12 mb-4" />
          <p className="text-lg font-semibold text-foreground">Drag and drop an image</p>
          <p>or click to upload. You can also paste from clipboard (Ctrl+V).</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploader;
