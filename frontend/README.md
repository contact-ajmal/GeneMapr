# GeneMapr Frontend

Medical-grade React frontend for genomic variant interpretation.

## Stack

- **React 18** - Functional components with hooks
- **TypeScript** - Strict mode enabled
- **Vite** - Fast development and building
- **Tailwind CSS** - Utility-first styling with medical-grade design (soft blues, neutral colors)
- **TanStack Table** - Powerful table with sorting and pagination
- **TanStack Query** - Data fetching with caching
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## Project Structure

```
src/
├── api/
│   ├── client.ts           # Axios client with interceptors
│   └── variants.ts         # Variant API methods
├── components/
│   ├── ErrorBoundary.tsx   # Error boundary wrapper
│   ├── FilterPanel.tsx     # Variant filtering sidebar
│   ├── Layout.tsx          # App layout with navigation
│   ├── LoadingSpinner.tsx  # Loading indicator
│   ├── VariantDetailModal.tsx  # Variant detail modal
│   └── VariantTable.tsx    # TanStack Table with sorting
├── pages/
│   ├── DashboardPage.tsx   # Main dashboard with table
│   └── UploadPage.tsx      # VCF upload with drag & drop
├── types/
│   └── variant.ts          # TypeScript types
├── App.tsx                 # Root component with routing
├── main.tsx                # Entry point with providers
└── index.css               # Tailwind directives
```

## Features

### Upload Page (/)
- Drag & drop zone for VCF files
- File validation (.vcf, .vcf.gz only)
- Upload progress indicator
- Success/error toast notifications
- Auto-redirect to dashboard after upload
- Info cards highlighting key features

### Dashboard Page (/dashboard)
- **TanStack Table** with all variant columns
- **Sortable columns** - Click headers to sort
- **Server-side pagination** - 50 variants per page
- **Filter panel** with:
  - Gene (text search)
  - Clinical significance (dropdown)
  - Allele frequency range (min/max)
  - Risk score range (min/max)
  - Consequence type (multi-select)
- **CSV Export** button with current filters
- **Row click** to open variant detail modal

### Variant Detail Modal
- Full annotation data in organized sections
- AI-generated summary in highlighted card
- Risk score with color-coded badge:
  - 🔴 Red: High risk (75-100)
  - 🟠 Orange: Moderate risk (50-74)
  - 🟡 Yellow: Low-moderate risk (25-49)
  - 🟢 Green: Low risk (0-24)
- Clinical significance highlighting
- Raw annotations JSON viewer
- Close button and click-outside to dismiss

## Environment Variables

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:8000
```

## Development

```bash
# Install dependencies
npm install

# Run dev server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Design System

### Colors
- **Primary Blue**: `blue-600`, `blue-700` (CTAs, links)
- **Backgrounds**: `slate-50`, `white`, gradients
- **Text**: `slate-900` (headings), `slate-600` (body), `slate-500` (secondary)
- **Borders**: `slate-200`, `slate-300`
- **Status colors**:
  - Success: `green-100`, `green-800`
  - Error: `red-100`, `red-800`
  - Warning: `yellow-100`, `yellow-800`
  - Info: `blue-100`, `blue-700`

### Typography
- **Font**: Inter, system-ui
- **Headings**: Bold, `text-slate-900`
- **Body**: Regular, `text-slate-600`
- **Code**: `font-mono`, monospace backgrounds

### Components
- **Cards**: White background, rounded-lg, border, shadow-sm
- **Buttons**: Blue primary, slate secondary, rounded-md
- **Inputs**: Border, focus ring, rounded-md
- **Badges**: Rounded-full, colored backgrounds

## API Integration

All API calls go through the centralized client:

```typescript
import apiClient from './api/client'

// Automatic error handling
// Automatic base URL from env
// JSON content-type by default
```

### Available Methods

```typescript
// Upload VCF
uploadVCF(file: File): Promise<UploadResponse>

// Get variants with filters
getVariants(page: number, pageSize: number, filters?: VariantFilters): Promise<PaginatedVariants>

// Export CSV
exportVariantsCSV(filters?: VariantFilters): Promise<Blob>
```

## React Query

Configured with:
- 5 minute stale time for variant queries
- No refetch on window focus
- Single retry on failure
- Automatic caching by query key

## Accessibility

- Semantic HTML elements
- Keyboard navigation support
- ARIA labels where needed
- Focus states on interactive elements
- Error messages and loading states

## Browser Support

Modern browsers with ES2020+ support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Production Build

The Dockerfile creates a optimized production build:

```dockerfile
# Multi-stage build
# Stage 1: Build with npm
# Stage 2: Serve with nginx-like static server
```

Built assets are served from `/app/dist` on port 3000.
