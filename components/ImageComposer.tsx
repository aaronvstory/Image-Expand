import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import { UploadCloudIcon, DownloadIcon, XIcon } from './ui/Icons';

interface CompositeLayer {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

interface ImageComposerProps {
  baseImage: string;
  width: number;
  height: number;
  onCompositeComplete: (compositeImage: string) => void;
}

const ImageComposer: React.FC<ImageComposerProps> = ({ baseImage, width, height, onCompositeComplete }) => {
  const [layers, setLayers] = useState<CompositeLayer[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const newLayer: CompositeLayer = {
            id: crypto.randomUUID(),
            src: event.target?.result as string,
            x: e.nativeEvent.offsetX - img.width / 4,
            y: e.nativeEvent.offsetY - img.height / 4,
            width: img.width / 2,
            height: img.height / 2,
            opacity: 1
          };
          setLayers(prev => [...prev, newLayer]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const newLayer: CompositeLayer = {
            id: crypto.randomUUID(),
            src: event.target?.result as string,
            x: width / 2 - img.width / 4,
            y: height / 2 - img.height / 4,
            width: img.width / 2,
            height: img.height / 2,
            opacity: 1
          };
          setLayers(prev => [...prev, newLayer]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, [width, height]);

  const updateLayerPosition = useCallback((layerId: string, x: number, y: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, x, y } : layer
    ));
  }, []);

  const updateLayerSize = useCallback((layerId: string, width: number, height: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, width, height } : layer
    ));
  }, []);

  const updateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    ));
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
  }, []);

  const renderComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw base image
    const baseImg = new Image();
    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, width, height);

      // Draw layers
      layers.forEach(layer => {
        const layerImg = new Image();
        layerImg.onload = () => {
          ctx.globalAlpha = layer.opacity;
          ctx.drawImage(layerImg, layer.x, layer.y, layer.width, layer.height);
          ctx.globalAlpha = 1;
        };
        layerImg.src = layer.src;
      });
    };
    baseImg.src = baseImage;
  }, [baseImage, layers, width, height]);

  const saveComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Render final composite
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const baseImg = new Image();
    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, width, height);

      let loadedLayers = 0;
      if (layers.length === 0) {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              onCompositeComplete(reader.result as string);
            };
            reader.readAsDataURL(blob);
          }
        });
        return;
      }

      layers.forEach(layer => {
        const layerImg = new Image();
        layerImg.onload = () => {
          ctx.globalAlpha = layer.opacity;
          ctx.drawImage(layerImg, layer.x, layer.y, layer.width, layer.height);
          ctx.globalAlpha = 1;
          
          loadedLayers++;
          if (loadedLayers === layers.length) {
            canvas.toBlob((blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  onCompositeComplete(reader.result as string);
                };
                reader.readAsDataURL(blob);
              }
            });
          }
        };
        layerImg.src = layer.src;
      });
    };
    baseImg.src = baseImage;
  }, [baseImage, layers, width, height, onCompositeComplete]);

  React.useEffect(() => {
    renderComposite();
  }, [renderComposite]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Image Composer</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloudIcon className="h-4 w-4 mr-1" />
            Add Layer
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={saveComposite}
            disabled={layers.length === 0}
          >
            <DownloadIcon className="h-4 w-4 mr-1" />
            Save Composite
          </Button>
        </div>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full"
          style={{ maxHeight: '400px', objectFit: 'contain' }}
        />
        
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 rounded-lg p-4">
              <UploadCloudIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Drop image to add as layer</p>
            </div>
          </div>
        )}
      </div>

      {layers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Layers ({layers.length})</h4>
          {layers.map((layer, index) => (
            <div key={layer.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded">
              <span className="text-xs flex-1">Layer {index + 1}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={layer.opacity}
                onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                className="w-20"
                title="Opacity"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeLayer(layer.id)}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageComposer;