
import React from 'react';
import { GeneratedImage } from '../types';
import { Button } from './ui/Button';
import { DownloadIcon, LoaderIcon, RefreshCwIcon, XIcon } from './ui/Icons';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface GeneratedImageHistoryProps {
  images: GeneratedImage[];
  isVisible: boolean;
  onToggle: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

const GeneratedImageHistory: React.FC<GeneratedImageHistoryProps> = ({ images, isVisible, onToggle, onRegenerate, isGenerating }) => {
  const [isDownloadingAll, setIsDownloadingAll] = React.useState(false);

  const downloadImage = (src: string, name: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = async () => {
    if (images.length === 0) return;
    
    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      
      // Add each image to the zip
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        // Extract base64 data from data URL
        const base64Data = image.src.split(',')[1];
        zip.file(`expanded-image-${i + 1}.png`, base64Data, { base64: true });
      }
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Save the zip file
      saveAs(content, `expanded-images-${new Date().getTime()}.zip`);
    } catch (error) {
      console.error('Error creating zip file:', error);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 bg-secondary/95 backdrop-blur-sm border-l border-border shadow-2xl transition-transform duration-300 ease-in-out z-30 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: 'clamp(300px, 25vw, 400px)' }}
    >
        <div className="absolute top-1/2 -left-6 -translate-y-1/2">
             <Button variant="secondary" size="icon" onClick={onToggle} className="rounded-r-none">
                <XIcon className={`h-5 w-5 transition-transform ${isVisible ? '' : 'rotate-180'}`} />
            </Button>
        </div>

      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">History ({images.length})</h3>
            <Button onClick={onRegenerate} disabled={isGenerating} size="sm">
              {isGenerating ? <LoaderIcon className="animate-spin mr-2 h-4 w-4" /> : <RefreshCwIcon className="mr-2 h-4 w-4" />}
              Regenerate
            </Button>
          </div>
          {images.length > 0 && (
            <Button 
              onClick={downloadAllImages} 
              disabled={isDownloadingAll}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isDownloadingAll ? (
                <>
                  <LoaderIcon className="animate-spin mr-2 h-4 w-4" />
                  Creating zip...
                </>
              ) : (
                <>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download All ({images.length} images)
                </>
              )}
            </Button>
          )}
        </div>
        
        {images.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground">No images generated yet.</p>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              {images.map((image) => (
                <div key={image.id} className="group relative aspect-square overflow-hidden rounded-md">
                  <img src={image.src} alt="Generated" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      onClick={() => downloadImage(image.src, `expanded-${image.id}.png`)}
                    >
                      <DownloadIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratedImageHistory;
