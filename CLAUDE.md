# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gemini Image Expander is a React-based web application that uses Google's Gemini AI to expand images beyond their original boundaries. It allows users to upload an image, set new canvas dimensions, and generate AI-expanded versions using the Gemini 2.5 Flash Image Preview model.

## Development Commands

### Starting Development
```bash
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

### Building & Production
```bash
npm run build    # Creates production build in dist/
npm run preview  # Preview production build locally
```

## Architecture & Key Patterns

### Core Data Flow
1. **Image Upload**: User uploads image → stored as base64 in `OriginalImage` type
2. **Canvas Expansion**: User sets new dimensions → preview shows original centered in expanded canvas
3. **AI Generation**: Canvas sent to Gemini API → returns expanded image(s)
4. **History Management**: Generated images stored in local state array for comparison

### API Integration
- **Gemini Service** (`services/geminiService.ts`): Handles all Gemini API interactions
- **API Key Management**: Stored in localStorage, managed via `ApiKeyManager` component
- **Model Used**: `gemini-2.5-flash-image-preview` with image generation capabilities
- **Environment Variable**: `GEMINI_API_KEY` can be set in `.env.local` for development

### State Management
- **Context API**: App-level context for API key and theme management
- **Local State**: Component-level state for image editing and generation history
- **localStorage Keys**:
  - `gemini-api-key`: User's Gemini API key
  - `theme`: Current theme preference (dark/light)

### Component Structure
```
App.tsx (main container with context provider)
├── ImageUploader (initial upload interface)
├── ImageEditor (main editing interface)
│   ├── Canvas preview with grid overlay
│   ├── Dimension controls (sliders + inputs)
│   ├── Aspect ratio presets
│   └── Prompt input + generate button
├── GeneratedImageHistory (sidebar with generated images)
├── ApiKeyManager (API key input/management)
└── ThemeToggle (dark/light mode switcher)
```

### Key Technical Details

#### Image Processing
- **Canvas Creation** (`utils/imageUtils.ts`): Creates transparent canvas with original image centered
- **Max Dimensions**: 4096x4096 pixels (MAX_DIM constant)
- **Format**: All images handled as base64 PNG data URLs

#### Error Handling
- API key validation before requests
- Graceful error messages for API failures
- Block reason detection from Gemini responses
- User-friendly error display in UI

#### UI Components
- Custom UI components in `components/ui/` (Button, Input, Slider, etc.)
- Tailwind CSS for styling with dark/light theme support
- Responsive design with mobile-friendly controls

## Type Definitions

### Core Types (`types.ts`)
```typescript
interface OriginalImage {
  src: string;      // base64 data URL
  width: number;    // original width
  height: number;   // original height
}

interface GeneratedImage {
  id: string;       // crypto.randomUUID()
  src: string;      // base64 data URL
}
```

## Common Development Tasks

### Testing with Different Models
To switch Gemini models, modify line 25 in `services/geminiService.ts`:
```typescript
model: 'gemini-2.5-flash-image-preview',  // Change model here
```

### Adding New Aspect Ratio Presets
Add new cases in `ImageEditor.tsx` `setAspectRatio` function (lines 68-115)

### Modifying Default Prompt
Update the default prompt in `ImageEditor.tsx` line 47

### Adjusting Max Canvas Size
Change `MAX_DIM` constant in `ImageEditor.tsx` line 18

## Important Context from Google AI Studio

- Originally developed as a Google AI Studio app
- View in AI Studio: https://ai.studio/apps/drive/16U35FkfIFuPaaFzKS3oQu6BoZ0MlXSlP
- GitHub repository: https://github.com/all-in-a-i/Gemini-Image-Expander
- Uses Gemini's experimental image generation features with `responseModalities: [Modality.IMAGE, Modality.TEXT]`