# PRD: Web‑Based Creative Filter Suite (Codename "Metakai")

## 1. Document Metadata
| Item    | Value           |
|---------|-----------------|
| Author  | (your name)     |
| Date    | 21 July 2025    |
| Version | 0.9 (Draft)     |
| Status  | Internal review |

## 2. Vision & Purpose
Deliver a device‑agnostic, browser‑based image‑manipulation playground that re‑imagines a set of classic 1990s Photoshop plug‑ins for today's web stack.  
The application will let casual creators and design professionals apply real‑time, tactile visual effects—**Liquify**, **Convolve**, and **Gel‑Paint**—to any image, directly on phones, tablets, and desktop computers.

**Success metrics**
* First‑paint < 1.5 s on a mid‑range mobile phone (cold load, 4 G)
* Steady 60 fps interaction while transforming a 2048 × 2048 image
* ≥ 95 % unit‑test coverage across core logic and shaders
* 90 th‑percentile CSAT ≥ 4.5 / 5 after first public beta

## 3. Target Audience
* **Mobile content creators** seeking quick, playful edits before posting.
* **Design students & educators** demonstrating image‑processing concepts.
* **Professional artists** nostalgic for the original plug‑ins yet needing a modern workflow.

## 4. Supported Platforms
| Device  | Baseline browser / OS            |
|---------|----------------------------------|
| Phone   | iOS 16 + (Safari / Chrome) · Android 13 + (Chrome) |
| Tablet  | iPadOS 16 + (Safari / Chrome)    |
| Desktop | Last 2 versions of Chrome, Edge, Safari, Firefox |

The app ships as an installable **Progressive Web App (PWA)**.

## 5. Feature Requirements

### 5.1 Core Filters (MVP)
| Codename   | Legacy inspiration | User value | Key controls |
|------------|--------------------|------------|--------------|
| **Liquify** | "Goo" liquid‑distortion filter – smear, smudge, twirl, pinch or "finger‑paint" an image to create liquid caricatures  [oai_citation:0‡disk.hr](https://www.disk.hr/softver/corel/kptcollection_brochures.pdf?utm_source=chatgpt.com) | Warp portraits and graphics in real time | Brush size · pressure · mode (smear / twirl / pinch / swell) · strength · multi‑level undo |
| **Convolve** | "Convolver" mathematics‑based filter enabling variable kernels  [oai_citation:1‡Wikipedia](https://en.wikipedia.org/wiki/Kai%27s_Power_Tools?utm_source=chatgpt.com) | Build sharpen, emboss, edge‑detect, blur and artistic effects | Kernel editor · preset gallery · intensity slider · live preview |
| **Gel‑Paint** | "Gel" 3‑D paint filter – photo‑realistic strokes that pool and refract underlying imagery  [oai_citation:2‡disk.hr](https://www.disk.hr/softver/corel/kptcollection_brochures.pdf?utm_source=chatgpt.com) | Paint metals, glass or liquids directly on the photo | Material picker · depth / viscosity · light direction · carve / twirl tools |

> **Naming policy** Production code, user‑facing copy and documentation must avoid explicit references to **Kai**, **KPT** or **MetaCreations**.

### 5.2 Image Handling
* Drag‑and‑drop or file‑picker upload (JPEG, PNG, WebP, AVIF ≤ 12 MB)
* EXIF read and auto‑orientation
* Canvas export (PNG, WebP) with adjustable quality
* Optional capture from device camera (`getUserMedia`)

### 5.3 Workspace & UX
* Responsive single‑page layout, collapsible right‑hand control panel
* Tap / drag with haptic feedback on supported devices
* Infinite‑depth undo / redo (command pattern; stored as filter‑specific deltas)
* Dark / light theme following OS preference
* Keyboard shortcuts on desktop

### 5.4 Accessibility
* WCAG 2.2 AA colour‑contrast
* Pointer alternative for each gesture
* `prefers‑reduced‑motion` respected (caps frame‑rate to 30 fps)

### 5.5 Internationalisation
English string JSON scaffolding; RTL layout‑ready.

## 6. Technical Solution

| Layer      | Stack                                       | Rationale                             |
|------------|---------------------------------------------|---------------------------------------|
| UI         | React 18 + Vite + TypeScript                | Fast dev cycle, strong typing         |
| Rendering  | **WebGL 2** via `pixi.js` or `regl`; WASM fallback | Low‑level control, mature ecosystem   |
| State      | Zustand                                     | Lightweight global store              |
| Worker     | OffscreenCanvas + Web Workers              | Keeps UI thread at 60 fps             |
| Build      | esbuild + SWC                               | Ultra‑fast transpile & bundle         |
| Testing    | Jest (unit) · Vitest (shader) · Cypress (e2e) · Playwright + Lighthouse‑CI |
| CI/CD      | GitHub Actions → Netlify Preview → Production |
| Telemetry  | Self‑hosted PostHog (anonymised events)     | Privacy‑first analytics               |

### 6.1 Filter Implementation Notes
* **Liquify** GPU displacement map; offset accumulates from brush‑stroke vector field.
* **Convolve** GLSL fragment shader multiply‑add with dynamic kernel uniform; separable optimisation for Gaussian blur.
* **Gel‑Paint** Height‑map FBO; on‑the‑fly normal‑map; screen‑space reflections; PBR lighting.

## 7. Security & Privacy
* All processing occurs client‑side — no image data leaves the device.
* HTTPS only; strong CSP + COOP/COEP headers.
* No third‑party trackers; GDPR / CCPA compliant.

## 8. Non‑Functional Requirements
| Category       | Goal                                                                   |
|----------------|------------------------------------------------------------------------|
| Performance    | ≤ 100 ms input‑to‑glass latency on mid‑range hardware                  |
| Stability      | Crash‑free sessions ≥ 99.5 %                                           |
| Bundle size    | Initial JS < 250 kB gzip; shaders + presets lazy‑loaded                |
| Battery drain  | ≤ 5 % per minute on iPhone 13 while running Liquify for 30 s           |

## 9. Testing Strategy

### 9.1 Unit & Shader Tests
* **Jest + ts‑jest** for logic
* **Vitest** + `glslify` for compile‑time shader validation

### 9.2 Integration & E2E
* **Cypress** scripted user journeys across all form‑factors
* Golden‑image snapshot diff for rendering correctness

### 9.3 Performance
* Automated Lighthouse runs in CI
* WebGL frame‑time regression alerts

### 9.4 Manual QA
Device matrix: iPhone SE (2022) · Pixel 7 · iPad Air M1 · MacBook Pro M2 · Surface Laptop 4

## 10. Analytics & Success Metrics
| Metric                   | Target (90 days post‑launch) |
|--------------------------|------------------------------|
| Weekly active users      | 15 k                         |
| Median session length    | ≥ 4 min                      |
| Export success rate      | ≥ 98 %                       |
| Core Web Vitals ‑ LCP    | < 2.5 s (p75)                |

## 11. Project Phases & Checklist

### Phase 0 — Discovery (2 w)
- [ ] Kick‑off & stakeholder alignment  
- [ ] Competitive analysis of browser‑based editors  
- [ ] Reverse‑engineer legacy filter algorithms  
- [ ] Tech‑stack validation (WebGL vs WASM)  

### Phase 1 — Architecture & Design (3 w)
- [ ] Draft UX wireframes for phone, tablet, desktop  
- [ ] Establish component library (Figma + Storybook)  
- [ ] Set up mono‑repo, CI pipeline, code‑quality gates  
- [ ] Author ADRs for rendering‑engine choice  

### Phase 2 — Core Infrastructure (4 w)
- [ ] Canvas / WebGL render‑loop skeleton  
- [ ] Modular plug‑in API spec  
- [ ] Asset loader & image I/O utilities  
- [ ] PWA service‑worker caching & install prompt  

### Phase 3 — Filter Implementation (6 w)
- [ ] Implement **Liquify** brush & UI controls  
- [ ] Implement **Convolve** kernel editor & presets  
- [ ] Implement **Gel‑Paint** height‑map painter & lighting  
- [ ] Cross‑filter undo / redo architecture  

### Phase 4 — Quality & Hardening (3 w)
- [ ] Achieve 95 % unit‑test coverage  
- [ ] Add comprehensive Cypress suites  
- [ ] Performance‑optimisation passes  
- [ ] WCAG AA accessibility audit  

### Phase 5 — Beta & Launch (2 w + rolling)
- [ ] Private beta with 50 invited users  
- [ ] Collect telemetry & bug reports  
- [ ] Prep marketing site & docs  
- [ ] Public launch on Product Hunt & social  

### Phase 6 — Post‑Launch Iteration
- [ ] Roadmap next filters (e.g. Materializer, Sky)  
- [ ] Implement user accounts & cloud preset sync  
- [ ] Evaluate WebGPU upgrade when stable  

## 12. Risks & Mitigations
| Risk                                | Likelihood | Impact | Mitigation                            |
|-------------------------------------|------------|--------|---------------------------------------|
| Mobile Safari memory limits         | Medium     | High   | Tile rendering; cap texture size      |
| WebGL context loss                  | Medium     | Medium | Auto‑restore handler                  |
| Patent / IP concerns                | Low        | High   | Use original algorithms; legal review |
| Shader portability across GPUs      | Medium     | Medium | ANGLE test harness in CI              |

## 13. Appendices

### 13.1 Glossary
* **Liquify** GPU‑based free‑form distortion tool  
* **Convolution kernel** Matrix applied to a pixel and its neighbours  
* **Height / normal map** Textures encoding elevation & surface normals for lighting