# 🎨 Gemini Image Expander

> AI-powered image expansion tool using Google's Gemini 2.5 Flash model to seamlessly extend images beyond their original boundaries.

![React](https://img.shields.io/badge/React-19.1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Vite](https://img.shields.io/badge/Vite-6.2-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-cyan)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🖼️ Smart Image Expansion
- **AI-Powered Outpainting**: Expand images in any direction using Gemini's advanced image generation
- **Custom Prompts**: Add specific instructions while expanding (e.g., "make subject face camera")
- **Seamless Blending**: AI ensures expanded areas blend naturally with original content
- **High Resolution**: Support for images up to 4096x4096 pixels

### 🎯 Intuitive Controls
- **Drag & Drop Upload**: Simply drag your image or click to browse
- **Visual Canvas Preview**: See exactly how your image will be expanded with grid overlay
- **Dimension Sliders**: Fine-tune width and height with precise controls
- **Aspect Ratio Presets**: Quick presets for common formats (16:9, 9:16, 1:1, Auto)

### 🎨 Professional Interface
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Image History**: Keep track of all your generated expansions in one session
- **Real-time Preview**: See the expansion boundaries before generating
- **Responsive Design**: Works perfectly on desktop and tablet devices

## 🚀 Live Demo

[Try it on GitHub Pages](https://aaronvstory.github.io/Image-Expand/)

## 🛠️ Tech Stack

- **Frontend Framework**: React 19.1.1 with TypeScript 5.8
- **Build Tool**: Vite 6.2 with HMR (Hot Module Replacement)
- **Styling**: Tailwind CSS 4.1 with custom UI components
- **AI Integration**: Google Gemini API (gemini-2.5-flash-image-preview)
- **State Management**: React Context API with localStorage persistence
- **UI Components**: Custom Radix UI-based components

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/pnpm
- Google AI Studio API key ([Get one here](https://makersuite.google.com/app/apikey))

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/aaronvstory/Image-Expand.git
cd Image-Expand
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up your API key**

Option A: Create a `.env.local` file:
```bash
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local
```

Option B: Use the in-app API key manager (stored securely in localStorage)

4. **Start the development server**
```bash
npm run dev
# or use the Windows batch file
start.bat
```

5. **Open in browser**
Navigate to `http://localhost:5173`

## 🎮 Usage

### Basic Workflow

1. **Upload an Image**
   - Drag and drop or click to browse
   - Supports JPEG, PNG, WebP formats

2. **Set Canvas Dimensions**
   - Use sliders or input fields for precise control
   - Try aspect ratio presets for quick sizing
   - Maximum dimensions: 4096x4096 pixels

3. **Add Custom Instructions** (Optional)
   - Enter specific modifications like "add clouds to the sky"
   - Combine with expansion for creative results

4. **Generate Expansion**
   - Click "Generate Expanded Image"
   - Wait for AI processing (typically 5-15 seconds)
   - View results in the history sidebar

### Pro Tips

- **Better Results**: Use high-quality source images with clear subjects
- **Creative Prompts**: Combine expansion with style changes for unique effects
- **Multiple Attempts**: Generate several versions to get the perfect expansion
- **Aspect Ratios**: Use presets for social media formats (16:9 for YouTube, 9:16 for Stories)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_api_key_here
```

### Vite Configuration

The app is configured for optimal performance with:
- Chunk size warnings at 500KB
- Manualchunks for better code splitting
- Optimized dependencies prebundling

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🏗️ Building for Production

### Local Build
```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

### GitHub Pages Deployment

The project includes automatic GitHub Pages deployment:

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Access at `https://aaronvstory.github.io/Image-Expand/`

## 🧪 Development

### Project Structure
```
Image-Expand/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── ApiKeyManager.tsx
│   ├── ImageEditor.tsx
│   ├── ImageUploader.tsx
│   └── GeneratedImageHistory.tsx
├── services/           # API integration
│   └── geminiService.ts
├── utils/              # Helper functions
│   └── imageUtils.ts
├── App.tsx             # Main application
└── types.ts            # TypeScript definitions
```

### Key Components

- **ImageEditor**: Main editing interface with canvas preview
- **ApiKeyManager**: Secure API key management with localStorage
- **GeneratedImageHistory**: Session history of generated images
- **ImageUploader**: Drag-and-drop upload interface

### API Integration

The app uses Google's Gemini API with the `gemini-2.5-flash-image-preview` model:

```typescript
// Example API configuration
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-image-preview',
  generationConfig: {
    responseModalities: [Modality.IMAGE, Modality.TEXT]
  }
});
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI team for the powerful image generation API
- Radix UI for accessible component primitives
- Tailwind CSS for the utility-first CSS framework
- The React community for continuous inspiration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/aaronvstory/Image-Expand/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aaronvstory/Image-Expand/discussions)
- **AI Studio**: [View in AI Studio](https://ai.studio/apps/drive/16U35FkfIFuPaaFzKS3oQu6BoZ0MlXSlP)

## 🚦 Status

- ✅ Core functionality complete
- ✅ API key management with localStorage
- ✅ Dark/Light theme support
- ✅ Responsive design
- ✅ GitHub Pages ready
- 🔄 Continuous improvements and updates

---

Made with ❤️ using React, TypeScript, and Gemini AI