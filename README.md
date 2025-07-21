# Metakai Filter Suite

A device-agnostic, browser-based image manipulation playground that reimagines classic 1990s Photoshop plug-ins for today's web stack. Apply real-time, tactile visual effects directly on phones, tablets, and desktop computers.

## Features

### Core Filters (MVP)
- **Liquify**: Warp and distort images with liquid-like effects (smear, twirl, pinch, swell)
- **Convolve**: Apply mathematical filters for sharpening, blurring, edge detection, and emboss effects
- **Gel Paint**: Paint with realistic 3D materials that interact with light (planned)

### Technical Highlights
- ⚡ Real-time WebGL processing with 60fps performance
- 📱 Progressive Web App (PWA) - installable and works offline
- 🎨 Responsive design supporting mobile, tablet, and desktop
- 🌓 Dark/light theme with system preference detection
- ♿ WCAG 2.2 AA accessibility compliant
- 🧪 Comprehensive testing with 95%+ coverage goal

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | Component-based UI with type safety |
| **Build Tool** | Vite 7 | Ultra-fast development and bundling |
| **Rendering** | PIXI.js 8 + WebGL 2 | High-performance graphics rendering |
| **State** | Zustand | Lightweight state management |
| **Styling** | Tailwind CSS | Utility-first styling framework |
| **Testing** | Vitest + Cypress + Testing Library | Unit, integration, and E2E testing |
| **PWA** | Service Worker + Web App Manifest | Offline support and installability |

### Performance Targets
- First paint < 1.5s on mid-range mobile (4G)
- Steady 60fps interaction with 2048×2048 images
- Bundle size < 250kB gzipped
- Input-to-glass latency ≤ 100ms

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd metakai-filter-suite
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint code quality checks |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Generate test coverage report |
| `npm run cypress:open` | Open Cypress for interactive E2E testing |
| `npm run cypress:run` | Run Cypress tests headlessly |

## Usage

1. **Upload an image** using the "Upload Image" button (supports JPEG, PNG, WebP, AVIF ≤ 12MB)
2. **Select a filter** from the toolbar (Liquify, Convolve, Gel Paint)
3. **Adjust controls** in the right panel to customize the effect
4. **Apply the filter** and use undo/redo as needed
5. **Export your result** (feature in development)

### Navigation Controls
- **Pan**: Click and drag on the canvas to move the image
- **Zoom**: Use mouse wheel or pinch gestures on touch devices
- **Zoom buttons**: Use the zoom controls in the bottom-right corner
- **Reset view**: Click the reset button to return to original position

### Supported Image Formats
- JPEG, PNG, WebP, AVIF
- Maximum file size: 12MB
- Auto-orientation based on EXIF data

#### iPhone/HEIC Support
HEIC/HEIF images from iPhones are not natively supported by web browsers. To use photos from your iPhone:
1. Change your iPhone camera settings to capture in JPEG format (Settings → Camera → Formats → Most Compatible)
2. Export as JPEG from the Photos app before uploading
3. Use an online HEIC to JPEG converter
4. The app will detect HEIC files and provide guidance

## Project Structure

```
src/
├── components/          # React components
│   ├── workspace/       # Canvas and rendering components
│   ├── ui/             # UI components (toolbar, panels)
│   └── common/         # Shared components
├── filters/            # Filter implementations
│   ├── base/           # Base filter architecture
│   ├── liquify/        # Liquify filter + shaders
│   ├── convolve/       # Convolve filter + shaders
│   └── gel-paint/      # Gel paint filter (planned)
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── workers/            # Web Workers for off-thread processing
```

## Filter Architecture

Each filter extends the base `Filter` class and implements:
- GLSL vertex/fragment shaders for WebGL processing
- Control definitions for UI generation
- Real-time parameter updates
- Undo/redo state management

Example filter structure:
```typescript
export class LiquifyFilter extends Filter {
  getName(): string { return 'Liquify' }
  getDefaultControls(): FilterControl[] { /* ... */ }
  createFilter(): PixiFilter { /* WebGL filter setup */ }
  protected updateFilter(): void { /* Parameter updates */ }
}
```

## Browser Support

| Platform | Minimum Version |
|----------|----------------|
| **Desktop** | Chrome 90+, Edge 90+, Safari 14+, Firefox 88+ |
| **Mobile** | iOS Safari 14+, Chrome Mobile 90+ |
| **Android** | Chrome 90+ on Android 8+ |

**Required APIs:**
- WebGL 2.0
- ES2020 features
- Service Workers (for PWA)
- File API

## Development Roadmap

### Phase 2 - Advanced Filters (Next)
- [ ] Gel Paint 3D material effects
- [ ] Height-map based lighting
- [ ] Screen-space reflections

### Phase 3 - Enhanced UX
- [ ] Touch gesture support
- [ ] Brush preview overlay  
- [ ] Real-time performance monitoring
- [ ] Advanced export options

### Phase 4 - Cloud Features
- [ ] User accounts and cloud sync
- [ ] Preset sharing community
- [ ] WebGPU migration for better performance

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-filter`
3. Run tests: `npm test && npm run cypress:run`
4. Commit changes: `git commit -am 'Add amazing filter'`
5. Push to branch: `git push origin feature/amazing-filter`
6. Submit a Pull Request

### Development Guidelines
- Maintain 95%+ test coverage
- Follow existing code patterns and naming conventions
- Write TypeScript with strict type checking
- Test on multiple devices and browsers
- Optimize for 60fps performance

## Security & Privacy

- **Client-side processing**: All image data stays on your device
- **No tracking**: GDPR/CCPA compliant with no third-party trackers  
- **HTTPS only**: Secure communication with strong CSP headers
- **No data collection**: Images never leave your browser

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Inspired by the innovative filter effects from the classic KPT (Kai's Power Tools) suite while respecting intellectual property and implementing original algorithms for the modern web platform.