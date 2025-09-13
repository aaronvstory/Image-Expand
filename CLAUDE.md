# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gemini Image Expander is a React-based web application that uses Google's Gemini AI (specifically the `gemini-2.5-flash-image-preview` model) to expand images beyond their original boundaries through AI-powered outpainting. The app allows users to upload an image, set new canvas dimensions, and generate AI-expanded versions that seamlessly extend the original content.

**Google AI Studio**: https://ai.studio/apps/drive/16U35FkfIFuPaaFzKS3oQu6BoZ0MlXSlP  
**GitHub Repository**: https://github.com/all-in-a-i/Gemini-Image-Expander

## Development Commands

### Setup & Installation
```bash
# Install dependencies
npm install

# Set up API key (required)
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local
```

### Development
```bash
# Start development server (auto-opens browser on http://localhost:5173)
npm run dev

# Quick start on Windows
start.bat
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Architecture & Core Implementation

### Technology Stack
- **Frontend Framework**: React 19.1.1 with TypeScript 5.8
- **Build Tool**: Vite 6.2.0 with HMR
- **Styling**: Tailwind CSS 4.1.13 with custom UI components
- **AI Integration**: Google Gemini API (@google/genai 1.16.0)
- **Model**: `gemini-2.5-flash-image-preview` with image generation capabilities

### Core Data Flow

1. **Image Upload** → User uploads image → stored as base64 data URL in `OriginalImage` type
2. **Canvas Setup** → User adjusts dimensions via sliders/presets → preview shows centered original with grid overlay
3. **Prompt Generation** → System creates structured multi-stage prompt combining expansion + user modifications
4. **AI Processing** → Canvas + prompt sent to Gemini API → returns expanded image(s)
5. **History Management** → Generated images stored in component state array for comparison

### Critical Implementation Details

#### Prompt Structure (Fixed in Latest Update)
The application now uses **structured, numbered prompts** to ensure both expansion and modifications work together:

```typescript
// When user provides custom prompt (e.g., "make subject face camera")
finalPrompt = `
1. Expand and outpaint this image by ${expansionPercentage}% to completely fill the transparent areas
2. ${userPrompt}
3. Preserve the original centered image content
4. Match the style, lighting, perspective, and details
5. Ensure seamless blending with no visible borders
`;
```

This fixes the previous issue where custom prompts would cause black borders instead of proper expansion.

#### API Integration (`services/geminiService.ts`)
- **Model Configuration**: Uses `gemini-2.5-flash-image-preview` with experimental image generation
- **Response Modalities**: Configured for both `Modality.IMAGE` and `Modality.TEXT`
- **Error Handling**: Graceful fallback for blocked content, API key validation, rate limits
- **Base64 Processing**: Converts canvas to base64 PNG for API submission

#### Canvas Processing (`utils/imageUtils.ts`)
- **Max Dimensions**: 4096x4096 pixels (MAX_DIM constant)
- **Canvas Creation**: Creates transparent canvas with original image centered
- **Format**: All images handled as base64 PNG data URLs
- **Scaling**: Automatic scale calculation for viewport fitting

### State Management

#### Context API (`App.tsx`)
- **Global State**: API key, theme preference
- **Persistence**: localStorage for both values
- **Provider**: Wraps entire app for universal access

#### Local Component State
- **ImageEditor**: Canvas dimensions, prompt, loading state, error messages
- **GeneratedImageHistory**: Array of generated images with unique IDs

#### localStorage Keys
- `gemini-api-key`: User's Gemini API key
- `theme`: Current theme preference (dark/light)

### Component Architecture

```
App.tsx (Context Provider for API key & theme)
├── ImageUploader
│   └── Drag & drop or click upload interface
├── ImageEditor (Main editing interface)
│   ├── Canvas Preview
│   │   ├── Grid overlay background
│   │   ├── Original image (centered)
│   │   └── Expansion boundaries (dashed)
│   ├── Dimension Controls
│   │   ├── Width/Height sliders (constrained to MAX_DIM)
│   │   └── Direct input fields
│   ├── Aspect Ratio Presets
│   │   ├── Landscape (16:9)
│   │   ├── Portrait (9:16)
│   │   ├── Square (1:1)
│   │   └── Auto (1:1 +30%)
│   └── Prompt Input + Generate Button
├── GeneratedImageHistory (Sidebar)
│   └── Chronological list of generated images
├── ApiKeyManager
│   └── API key input with localStorage persistence
└── ThemeToggle
    └── Dark/Light mode switcher
```

### Type System

```typescript
// Core type definitions (types.ts)
interface OriginalImage {
  src: string;      // base64 data URL
  width: number;    // original pixel width
  height: number;   // original pixel height
}

interface GeneratedImage {
  id: string;       // crypto.randomUUID()
  src: string;      // base64 data URL of expanded image
}
```

## Recent Updates & Fixes

### Multi-Stage Prompt Fix (Latest Commit)
**Problem**: When users added custom prompts (e.g., "make subject face camera"), the expansion would fail, creating black borders instead of generated content.

**Root Cause**: Custom prompts were completely replacing the expansion instruction rather than being combined with it.

**Solution**: Implemented structured, numbered prompt format that:
1. Always puts expansion instruction first with calculated percentage
2. Adds user modifications as secondary instruction
3. Includes explicit preservation and quality requirements
4. Ensures seamless blending directives

**Implementation Location**: `components/ImageEditor.tsx` lines 47-68

### Enhanced Logging System
**Location**: `vite.config.ts` lines 18-33
- Development mode: `info` level logging
- Production mode: `warn` level only
- HMR overlay enabled for immediate error visibility
- Detailed build reporting with chunk size warnings

## API Documentation & Resources

### Google Gemini API
- **Official Documentation**: https://ai.google.com/api/docs
- **Model Details**: https://ai.google.com/models/gemini-2-flash
- **Image Generation Guide**: https://ai.google.com/api/generate-images
- **Rate Limits**: Standard tier allows 60 requests per minute

### Key API Parameters
```typescript
// Gemini API configuration
{
  model: 'gemini-2.5-flash-image-preview',
  contents: {
    parts: [imagePart, textPart]
  },
  config: {
    responseModalities: [Modality.IMAGE, Modality.TEXT]
  }
}
```

## Common Development Tasks

### Changing Expansion Defaults
- **Max canvas size**: Modify `MAX_DIM` in `components/ImageEditor.tsx` line 18
- **Default prompt**: Update lines 63-67 in `components/ImageEditor.tsx`
- **Aspect ratio presets**: Edit `setAspectRatio` function lines 68-131

### Adding New Aspect Ratios
```typescript
// In ImageEditor.tsx setAspectRatio function
case 'custom_ratio': {
  const targetAspectRatio = width / height;
  // Add expansion logic here
  break;
}
```

### Debugging API Issues
1. Check browser console for detailed logs (🚀 start, 📡 response, ❌ errors)
2. Verify API key in localStorage: `localStorage.getItem('gemini-api-key')`
3. Monitor network tab for API requests to `generativelanguage.googleapis.com`
4. Check response for block reasons in error messages

### Testing Different Models
To experiment with other Gemini models:
```typescript
// In services/geminiService.ts line 32
model: 'gemini-2.5-flash-image-preview', // Change to other supported models
```
Note: Not all models support image generation - check documentation first.

## Environment Variables

### Required
- `GEMINI_API_KEY`: Your Google AI Studio API key

### Setting Environment Variables
```bash
# Development (.env.local)
GEMINI_API_KEY=your_key_here

# The key is injected via Vite's define config (vite.config.ts lines 9-12)
```

## UI Component Library

Custom UI components in `components/ui/`:
- **Button**: Variants (default, ghost, destructive) with hover states
- **Input**: Text input with consistent styling
- **Slider**: Range input for dimension control
- **Icons**: Lucide React icons wrapped for consistency
- **Tooltip**: Hover tooltips using Radix UI primitives

All components use Tailwind CSS with dark mode support via CSS variables.

## Performance Considerations

### Image Processing
- **Canvas operations** are performed client-side to reduce API calls
- **Base64 encoding** adds ~33% overhead but ensures compatibility
- **Max dimensions** (4096px) prevent memory issues
- **Viewport scaling** ensures UI remains responsive

### API Optimization
- **Single API call** per generation (no polling needed)
- **Error caching** prevents repeated failed requests
- **Local storage** for API key avoids re-entry

## Deployment

### Vercel/Netlify
```bash
# Build command
npm run build

# Output directory
dist

# Environment variables
GEMINI_API_KEY (add in deployment platform)
```

### Self-Hosting
1. Build the production bundle: `npm run build`
2. Serve the `dist` folder with any static file server
3. Ensure environment variables are set on the server

## Troubleshooting Guide

### Black Borders Issue (FIXED)
- **Symptom**: Expansion creates black borders when using custom prompts
- **Solution**: Update to latest version with structured prompt fix

### API Key Issues
- **Invalid key**: Check for typos, ensure key is from Google AI Studio
- **Permission denied**: Verify key has image generation permissions
- **Rate limits**: Implement retry logic or upgrade tier

### Canvas Not Expanding
- **Check dimensions**: Ensure new dimensions differ from original
- **Verify MAX_DIM**: Dimensions might be capped at 4096px
- **Browser limitations**: Some browsers limit canvas size

### Image Quality Issues
- **Prompt specificity**: Add more detailed descriptions
- **Model limitations**: Some scenes expand better than others
- **Multiple generations**: Try generating several times for best results