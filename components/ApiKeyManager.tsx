
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../App';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { KeyIcon, EyeIcon, EyeOffIcon } from './ui/Icons';

const ApiKeyManager: React.FC = () => {
  const { apiKey, setApiKey } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [currentKey, setCurrentKey] = useState(apiKey || '');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCurrentKey(apiKey || '');
  }, [apiKey]);

  const handleSave = () => {
    setApiKey(currentKey);
    setIsOpen(false);
  };
  
  const handleClickOutside = (event: MouseEvent) => {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <div className="relative">
      <Button ref={buttonRef} variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <KeyIcon className="h-5 w-5" />
        <span className="sr-only">Manage API Key</span>
      </Button>
      {isOpen && (
        <div ref={popoverRef} className="absolute top-full right-0 mt-2 w-80 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm font-medium mb-2">Gemini API Key</p>
          <p className="text-xs text-muted-foreground mb-4">
            Your key is stored locally in your browser and never sent to our servers.
          </p>
          <div className="relative">
            <Input
              type={isKeyVisible ? 'text' : 'password'}
              placeholder="Enter your API key"
              value={currentKey}
              onChange={(e) => setCurrentKey(e.target.value)}
              className="pr-10"
            />
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setIsKeyVisible(!isKeyVisible)}
            >
                {isKeyVisible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </Button>
          </div>
          <Button onClick={handleSave} className="w-full mt-4">
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;
