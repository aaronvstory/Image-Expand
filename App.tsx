
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
  apiKeySource: 'env' | 'localStorage' | null;
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
  const [apiKeySource, setApiKeySource] = useState<'env' | 'localStorage' | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Initialize API key on mount
  useEffect(() => {
    // First check for .env file API key
    const envKey = (window as any).process?.env?.GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey !== 'undefined') {
      console.log('🔑 API Key Status: Found in .env file');
      setApiKeySource('env');
      setApiKey(envKey);
      return;
    }
    
    // Fallback to localStorage
    const localKey = localStorage.getItem('gemini-api-key');
    if (localKey) {
      console.log('🔑 API Key Status: Found in localStorage');
      setApiKeySource('localStorage');
      setApiKey(localKey);
      return;
    }
    
    console.log('🔑 API Key Status: Not configured');
  }, []);
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
      setApiKeySource('localStorage');
    } else {
      localStorage.removeItem('gemini-api-key');
      // If there's an env key, revert to it
      const envKey = (window as any).process?.env?.GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY;
      if (envKey && envKey !== 'undefined') {
        setApiKey(envKey);
        setApiKeySource('env');
      } else {
        setApiKeySource(null);
      }
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
    apiKeySource,
    theme,
    toggleTheme
  }), [apiKey, handleApiKeyChange, apiKeySource, theme, toggleTheme]);

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`flex flex-col h-screen min-h-screen bg-background text-foreground ${theme}`}>
        <header className="relative w-full px-6 py-4 border-b border-border bg-background/95 backdrop-blur-sm z-40">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-semibold">
              Gemini Image Expander
            </h1>
            <div className="flex items-center gap-3">
              <ApiKeyManager />
              <ThemeToggle />
              <a href="https://github.com/all-in-a-i/Gemini-Image-Expander" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <GithubIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
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
