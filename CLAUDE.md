# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Manager
This project uses `pnpm` as the package manager.

```bash
pnpm install        # Install dependencies
pnpm dev           # Start development server
pnpm build         # Build for production (TypeScript compilation + Vite build)
pnpm lint          # Run ESLint
pnpm preview       # Preview production build
```

## Architecture Overview

This is a React + TypeScript application built with Vite that provides AI-powered image editing capabilities using Google's Gemini model through the Echo SDK.

### Key Components

- **App.tsx**: Main application shell with authentication flow using Echo SDK
- **AIComponent.tsx**: Core image editing interface with drag/drop, paste, and AI editing functionality
- **imageHelpers.ts**: Utilities for image processing, base64 conversion, and AI model integration

### Core Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4.x
- **AI Integration**: Echo React SDK for authentication and payments, Google Gemini 2.5 Flash for image editing
- **Icons**: Lucide React
- **Linting**: ESLint with TypeScript support

### Echo SDK Integration

The app integrates with Merit Systems' Echo platform for:
- User authentication (`useEcho`, `EchoSignIn`)
- Token-based payments (`EchoTokenPurchase`)
- AI model provider access (`useEchoModelProviders`)

The `VITE_ECHO_APP_ID` environment variable must be configured to point to your Echo app.

### Image Processing Flow

1. Users can upload images via drag/drop, paste, or file picker
2. Images are stored as File objects with generated object URLs
3. AI editing uses Google Gemini 2.5 Flash with multimodal capabilities
4. Results are processed and displayed with options to add back to input queue

### Mobile Considerations

The app includes iOS Safari viewport height fixes and responsive design for mobile usage.