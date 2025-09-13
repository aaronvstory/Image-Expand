
import React, { useState, useEffect, useCallback } from 'react';
import { OriginalImage, GeneratedImage } from '../types';
import { expandImage } from '../services/geminiService';
import { createExpandedCanvas } from '../utils/imageUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Slider } from './ui/Slider';
import { ChevronLeftIcon, LoaderIcon, WandIcon, XIcon, LayersIcon } from './ui/Icons';
import GeneratedImageHistory from './GeneratedImageHistory';
import ImageComposer from './ImageComposer';
import { useAppContext } from '../App';

interface ImageEditorProps {
  originalImage: OriginalImage;
  onReset: () => void;
}

const MAX_DIM = 4096;

const ImageEditor: React.FC<ImageEditorProps> = ({ originalImage, onReset }) => {
  const { apiKey } = useAppContext();
  const [width, setWidth] = useState(originalImage.width);
  const [height, setHeight] = useState(originalImage.height);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [currentCanvasImage, setCurrentCanvasImage] = useState<string | null>(null);

  useEffect(() => {
    setWidth(originalImage.width);
    setHeight(originalImage.height);
  }, [originalImage]);

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
        setError("Please set your Gemini API key using the key icon in the header.");
        return;
    }
    if (width === originalImage.width && height === originalImage.height) {
        setError("The new dimensions are the same as the original. Please expand the canvas.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Calculate expansion percentage for more precise instructions
      const widthExpansion = Math.round(((width - originalImage.width) / originalImage.width) * 100);
      const heightExpansion = Math.round(((height - originalImage.height) / originalImage.height) * 100);
      
      // Build structured prompt with numbered instructions
      let finalPrompt = '';
      
      if (prompt) {
        // When user provides a prompt, combine expansion AND modification instructions
        finalPrompt = `1. Expand and outpaint this image by ${Math.max(widthExpansion, heightExpansion)}% to completely fill the transparent areas with photorealistic content that seamlessly extends the original scene.
2. ${prompt}
3. Preserve the original centered image content while ensuring the expansion looks natural and cohesive.
4. Match the style, lighting, perspective, and details of the original image throughout the entire expanded canvas.
5. Ensure seamless blending between the original and expanded areas with no visible borders or transitions.`;
      } else {
        // Default expansion-only prompt
        finalPrompt = `1. Expand and outpaint this image by ${Math.max(widthExpansion, heightExpansion)}% to completely fill all transparent areas.
2. Generate photorealistic content that naturally extends the original scene outward.
3. Do not alter, change, or edit the original centered image content in any way.
4. Match the style, lighting, perspective, and details of the original image perfectly.
5. Create a seamless, cohesive, and natural-looking extension with no visible boundaries.`;
      }
      
      const canvasBase64 = await createExpandedCanvas(originalImage.src, width, height, originalImage.width, originalImage.height);
      const resultBase64 = await expandImage(canvasBase64, finalPrompt, apiKey);
      
      const newImages: GeneratedImage[] = resultBase64.map(src => ({
        id: crypto.randomUUID(),
        src: `data:image/png;base64,${src}`
      }));
      
      setGeneratedImages(prev => [...newImages, ...prev]);
      setIsHistoryVisible(true);
      
      // Store the canvas for potential compositing
      if (newImages.length > 0) {
        setCurrentCanvasImage(newImages[0].src);
      }
    // Fix: Added curly braces to the catch block to fix a syntax error.
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, width, height, prompt, apiKey]);

  const setAspectRatio = useCallback((ratio: 'landscape-16-9' | 'landscape-4-3' | 'portrait-9-16' | 'portrait-3-4' | 'square' | 
    'landscape-16-9-50' | 'landscape-4-3-50' | 'portrait-9-16-50' | 'portrait-3-4-50' | 'square-50' |
    'landscape-16-9-100' | 'landscape-4-3-100' | 'portrait-9-16-100' | 'portrait-3-4-100' | 'square-100') => {
    const originalW = originalImage.width;
    const originalH = originalImage.height;
    let newW = originalW;
    let newH = originalH;

    switch (ratio) {
      // Landscape ratios
      case 'landscape-16-9': {
        const targetAspectRatio = 16 / 9;
        if (originalW / originalH < targetAspectRatio) {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        } else {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        }
        break;
      }
      case 'landscape-4-3': {
        const targetAspectRatio = 4 / 3;
        if (originalW / originalH < targetAspectRatio) {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        } else {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        }
        break;
      }
      
      // Portrait ratios
      case 'portrait-9-16': {
        const targetAspectRatio = 9 / 16;
        if (originalW / originalH > targetAspectRatio) {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        } else {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        }
        break;
      }
      case 'portrait-3-4': {
        const targetAspectRatio = 3 / 4;
        if (originalW / originalH > targetAspectRatio) {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        } else {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        }
        break;
      }
      
      // Square
      case 'square': {
        const side = Math.max(originalW, originalH);
        newW = side;
        newH = side;
        break;
      }
      
      // Landscape +50%
      case 'landscape-16-9-50': {
        const targetAspectRatio = 16 / 9;
        if (originalW / originalH < targetAspectRatio) {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        } else {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        }
        newW = Math.round(newW * 1.5);
        newH = Math.round(newH * 1.5);
        break;
      }
      case 'landscape-4-3-50': {
        const targetAspectRatio = 4 / 3;
        if (originalW / originalH < targetAspectRatio) {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        } else {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        }
        newW = Math.round(newW * 1.5);
        newH = Math.round(newH * 1.5);
        break;
      }
      
      // Portrait +50%
      case 'portrait-9-16-50': {
        const targetAspectRatio = 9 / 16;
        if (originalW / originalH > targetAspectRatio) {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        } else {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        }
        newW = Math.round(newW * 1.5);
        newH = Math.round(newH * 1.5);
        break;
      }
      case 'portrait-3-4-50': {
        const targetAspectRatio = 3 / 4;
        if (originalW / originalH > targetAspectRatio) {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        } else {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        }
        newW = Math.round(newW * 1.5);
        newH = Math.round(newH * 1.5);
        break;
      }
      
      // Landscape +100%
      case 'landscape-16-9-100': {
        const targetAspectRatio = 16 / 9;
        if (originalW / originalH < targetAspectRatio) {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        } else {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        }
        newW = Math.round(newW * 2);
        newH = Math.round(newH * 2);
        break;
      }
      case 'landscape-4-3-100': {
        const targetAspectRatio = 4 / 3;
        if (originalW / originalH < targetAspectRatio) {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        } else {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        }
        newW = Math.round(newW * 2);
        newH = Math.round(newH * 2);
        break;
      }
      
      // Portrait +100%
      case 'portrait-9-16-100': {
        const targetAspectRatio = 9 / 16;
        if (originalW / originalH > targetAspectRatio) {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        } else {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        }
        newW = Math.round(newW * 2);
        newH = Math.round(newH * 2);
        break;
      }
      case 'portrait-3-4-100': {
        const targetAspectRatio = 3 / 4;
        if (originalW / originalH > targetAspectRatio) {
          newH = Math.max(Math.round(originalW / targetAspectRatio), originalH);
          newW = Math.max(originalW, newW);
        } else {
          newW = Math.max(Math.round(originalH * targetAspectRatio), originalW);
          newH = Math.max(originalH, newH);
        }
        newW = Math.round(newW * 2);
        newH = Math.round(newH * 2);
        break;
      }
      case 'square-50': {
        // Make a square that contains the entire original image, then expand by 50%
        const side = Math.round(Math.max(originalW, originalH) * 1.5);
        newW = side;
        newH = side;
        break;
      }
      case 'square-100': {
        // Make a square that contains the entire original image, then expand by 100%
        const side = Math.round(Math.max(originalW, originalH) * 2);
        newW = side;
        newH = side;
        break;
      }
    }
    
    // Ensure we never shrink below the original dimensions
    newW = Math.max(newW, originalW);
    newH = Math.max(newH, originalH);
    
    // Ensure we don't exceed maximum dimensions
    newW = Math.min(newW, MAX_DIM);
    newH = Math.min(newH, MAX_DIM);
    
    setWidth(newW);
    setHeight(newH);
  }, [originalImage.width, originalImage.height]);

  const handleCompositeComplete = useCallback((compositeImage: string) => {
    const newImage: GeneratedImage = {
      id: crypto.randomUUID(),
      src: compositeImage
    };
    setGeneratedImages(prev => [newImage, ...prev]);
    setShowComposer(false);
    setCurrentCanvasImage(null);
  }, []);


  // Calculate scale to fit the canvas in the viewport with proper padding
  const canvasScale = Math.min(
    (window.innerWidth * 0.65) / width,
    (window.innerHeight * 0.5) / height,
    1
  );

  // Calculate the scale ratio between original and expanded dimensions
  const imageToCanvasScaleX = originalImage.width / width;
  const imageToCanvasScaleY = originalImage.height / height;

  return (
    <div className="w-full h-full flex flex-col">
        {/* Top action bar */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-background/50">
            <Button variant="ghost" onClick={onReset}>
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Back
            </Button>
            <Button 
                variant="ghost" 
                onClick={onReset}
                title="Remove image and upload a new one"
                className="hover:bg-destructive/10 hover:text-destructive"
            >
                <XIcon className="h-4 w-4 mr-2" />
                Remove Image
            </Button>
        </div>
        
        {/* Canvas area - takes remaining space but doesn't overflow */}
        <div 
            className="flex-1 flex items-center justify-center w-full p-4 overflow-hidden relative min-h-0"
            style={{ touchAction: 'none' }}
        >
            <div
              className="relative transition-all duration-200 bg-secondary/20 shadow-lg rounded-lg"
              style={{
                  width: width * canvasScale,
                  height: height * canvasScale,
              }}
            >
                {/* Grid pattern background */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                
                {/* Original image properly scaled and centered within the expanded canvas */}
                <div 
                    className="absolute"
                    style={{
                        width: `${imageToCanvasScaleX * 100}%`,
                        height: `${imageToCanvasScaleY * 100}%`,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <img
                        src={originalImage.src}
                        alt="Original"
                        className="w-full h-full object-contain pointer-events-none"
                    />
                </div>
                
                {/* Border around the entire expanded canvas */}
                <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none"></div>
                
                {/* Visual indicator for the original image boundaries */}
                <div 
                    className="absolute border border-dashed border-primary/30 pointer-events-none"
                    style={{
                        width: `${imageToCanvasScaleX * 100}%`,
                        height: `${imageToCanvasScaleY * 100}%`,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                ></div>
            </div>
        </div>
        
        {/* Controls area - fixed at bottom, not overlapping */}
        <div className="relative px-6 py-4 border-t border-border bg-background/95 backdrop-blur-sm">
            {error && <p className="text-destructive text-center mb-3 max-w-4xl mx-auto">{error}</p>}
            <div className="max-w-7xl mx-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                           <label htmlFor="width" className="text-sm font-medium w-16">Width</label>
                           <Slider 
                               id="width" 
                               value={[width]} 
                               onValueChange={([val]) => setWidth(Math.max(val, originalImage.width))} 
                               min={originalImage.width}
                               max={MAX_DIM} 
                               step={1} 
                           />
                           <Input 
                               type="number" 
                               value={width} 
                               onChange={(e) => setWidth(Math.max(Number(e.target.value), originalImage.width))} 
                               min={originalImage.width}
                               max={MAX_DIM}
                               className="w-24" 
                           />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="height" className="text-sm font-medium w-16">Height</label>
                            <Slider 
                                id="height" 
                                value={[height]} 
                                onValueChange={([val]) => setHeight(Math.max(val, originalImage.height))} 
                                min={originalImage.height}
                                max={MAX_DIM} 
                                step={1} 
                            />
                            <Input 
                                type="number" 
                                value={height} 
                                onChange={(e) => setHeight(Math.max(Number(e.target.value), originalImage.height))} 
                                min={originalImage.height}
                                max={MAX_DIM}
                                className="w-24" 
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {/* Landscape Ratios */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Landscape</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center text-muted-foreground">Base</div>
                                <div className="text-center text-muted-foreground">+50%</div>
                                <div className="text-center text-muted-foreground">+100%</div>
                                
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('landscape-16-9')}>16:9</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('landscape-16-9-50')}>16:9</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('landscape-16-9-100')}>16:9</Button>
                                
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('landscape-4-3')}>4:3</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('landscape-4-3-50')}>4:3</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('landscape-4-3-100')}>4:3</Button>
                            </div>
                        </div>
                        
                        {/* Portrait Ratios */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Portrait</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('portrait-9-16')}>9:16</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('portrait-9-16-50')}>9:16</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('portrait-9-16-100')}>9:16</Button>
                                
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('portrait-3-4')}>3:4</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('portrait-3-4-50')}>3:4</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('portrait-3-4-100')}>3:4</Button>
                            </div>
                        </div>
                        
                        {/* Square */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Square</h4>
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('square')}>1:1</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('square-50')}>1:1 +50%</Button>
                                <Button variant="outline" size="sm" onClick={() => setAspectRatio('square-100')}>1:1 +100%</Button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Composer Section */}
                {showComposer && currentCanvasImage && (
                  <div className="mt-4 p-4 border border-border rounded-lg">
                    <ImageComposer
                      baseImage={currentCanvasImage}
                      width={width}
                      height={height}
                      onCompositeComplete={handleCompositeComplete}
                    />
                  </div>
                )}
                
                 <div className="mt-4 flex items-center gap-2">
                    <Input 
                        placeholder="Prompt (optional - describe the expanded areas)" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading} size="lg">
                        {isLoading ? <LoaderIcon className="animate-spin mr-2"/> : <WandIcon className="mr-2 h-4 w-4" />}
                        Generate
                    </Button>
                    {currentCanvasImage && (
                        <Button 
                            onClick={() => setShowComposer(!showComposer)} 
                            variant={showComposer ? "default" : "outline"}
                            title="Layer multiple images"
                        >
                            <LayersIcon className="h-4 w-4" />
                        </Button>
                    )}
                 </div>
            </div>
        </div>

        {generatedImages.length > 0 && 
            <GeneratedImageHistory 
              images={generatedImages} 
              isVisible={isHistoryVisible} 
              onToggle={() => setIsHistoryVisible(v => !v)}
              onRegenerate={handleGenerate}
              isGenerating={isLoading}
            />
        }
    </div>
  );
};

export default ImageEditor;

const BgGrid: React.FC = () => (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
    <defs>
      <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M 8 0 L 0 0 0 8" fill="none" stroke="hsl(var(--muted))" strokeWidth="0.5"/>
      </pattern>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" fill="url(#smallGrid)"/>
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="hsl(var(--muted))" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);
