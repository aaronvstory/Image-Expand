
import React, { useState, useCallback, useMemo, useEffect, createContext, useContext } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageEditor from './components/ImageEditor';
import ApiKeyManager from './components/ApiKeyManager';
import ThemeToggle from './components/ThemeToggle';
import { OriginalImage } from './types';
import { GithubIcon } from './components/ui/Icons';

type Theme = 'dark' | 'light';

interface AppContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<OriginalImage | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(() => {
    const key = localStorage.getItem('gemini-api-key');
    console.log('🔑 API Key Status:', key ? 'Found in localStorage' : 'Not configured');
    return key;
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark';
    console.log('🎨 Theme initialized:', savedTheme);
    return savedTheme;
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const handleApiKeyChange = useCallback((key: string | null) => {
    console.log('🔐 API Key updated:', key ? 'New key set' : 'Key removed');
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini-api-key', key);
    } else {
      localStorage.removeItem('gemini-api-key');
    }
  }, []);
  
  const handleImageUpload = useCallback((image: OriginalImage) => {
    console.log('📸 Image uploaded:', {
      width: image.width,
      height: image.height,
      size: `${(image.src.length / 1024).toFixed(2)} KB`
    });
    setOriginalImage(image);
  }, []);

  const handleReset = useCallback(() => {
    console.log('🔄 Resetting to upload screen');
    setOriginalImage(null);
  }, []);

  const contextValue = useMemo(() => ({
    apiKey,
    setApiKey: handleApiKeyChange,
    theme,
    toggleTheme
  }), [apiKey, handleApiKeyChange, theme, toggleTheme]);

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`flex flex-col h-screen min-h-screen bg-background text-foreground ${theme}`}>
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
          <h1 className="text-lg font-semibold flex items-center gap-2">
             Gemini Image Expander
          </h1>
          <div className="flex items-center gap-4">
            <ApiKeyManager />
            <ThemeToggle />
            <a href="https://github.com/all-in-a-i/Gemini-Image-Expander" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <GithubIcon className="h-5 w-5" />
            </a>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center p-4">
          {!originalImage ? (
            <ImageUploader onImageUpload={handleImageUpload} />
          ) : (
            <ImageEditor originalImage={originalImage} onReset={handleReset} />
          )}
        </main>
      </div>
    </AppContext.Provider>
  );
};

export default App;
