# Node Modules Documentation
## Frontend Dependencies - Work Simulation Platform

**Generated on:** July 5, 2025  
**Project:** work-sim-platform-frontend@1.0.0  
**Node.js Version:** Latest  
**Package Manager:** npm

---

## 📦 Direct Dependencies (41 packages)

### UI & Design System
- **@radix-ui/react-avatar@1.1.10** - Avatar component for user profile pictures
- **@radix-ui/react-checkbox@1.3.2** - Accessible checkbox component
- **@radix-ui/react-dialog@1.1.14** - Modal and dialog components
- **@radix-ui/react-dropdown-menu@2.1.15** - Dropdown menu component
- **@radix-ui/react-label@2.1.7** - Form label component
- **@radix-ui/react-progress@1.1.7** - Progress bar component
- **@radix-ui/react-select@2.2.5** - Select dropdown component
- **@radix-ui/react-separator@1.1.7** - Visual separator component
- **@radix-ui/react-slider@1.3.5** - Range slider component
- **@radix-ui/react-switch@1.2.5** - Toggle switch component
- **@radix-ui/react-tabs@1.1.12** - Tab navigation component
- **@radix-ui/react-toast@1.2.14** - Toast notification component
- **@radix-ui/react-tooltip@1.2.7** - Tooltip component
- **lucide-react@0.294.0** - Beautiful icon library with 1000+ icons

### Styling & CSS
- **tailwindcss@3.4.17** - Utility-first CSS framework
- **autoprefixer@10.4.21** - CSS vendor prefix automation
- **postcss@8.5.6** - CSS transformation tool (overridden version)
- **tailwind-merge@3.3.1** - Utility for merging Tailwind CSS classes
- **class-variance-authority@0.7.1** - Type-safe variant API for component styling
- **clsx@2.1.1** - Conditional className utility

### React & Core Framework
- **react@18.3.1** - Core React library
- **react-dom@18.3.1** - React DOM rendering
- **react-scripts@5.0.1** - Create React App build tools
- **react-router-dom@6.30.1** - Client-side routing for React
- **typescript@4.9.5** - TypeScript language support

### Animation & Motion
- **framer-motion@12.23.0** - Production-ready motion library for React

### State Management & Data Fetching
- **@tanstack/react-query@5.81.5** - Powerful data synchronization for React
- **axios@1.10.0** - Promise-based HTTP client

### Form Management
- **react-hook-form@7.59.0** - Performant forms with easy validation
- **@hookform/resolvers@5.1.1** - Validation resolvers for react-hook-form
- **zod@3.25.74** - TypeScript-first schema validation

### Drag & Drop
- **@dnd-kit/core@6.3.1** - Modern drag and drop toolkit core
- **@dnd-kit/sortable@10.0.0** - Sortable preset for @dnd-kit
- **@dnd-kit/utilities@3.2.2** - Utility functions for @dnd-kit

### Charts & Data Visualization
- **recharts@3.0.2** - Composable charting library for React

### Utilities
- **date-fns@2.30.0** - Modern JavaScript date utility library
- **react-hot-toast@2.5.2** - Lightweight toast notifications

### Development Dependencies
- **@types/jest@29.5.14** - TypeScript definitions for Jest
- **@types/node@20.19.4** - TypeScript definitions for Node.js
- **@types/react@18.3.23** - TypeScript definitions for React
- **@types/react-dom@18.3.7** - TypeScript definitions for React DOM

---

## 🔧 Package Overrides

The following packages have version overrides for security or compatibility:

```json
"overrides": {
  "nth-check": "^2.1.1",
  "webpack-dev-server": "^4.15.2", 
  "svgo": "^3.0.0",
  "postcss": "^8.4.33",
  "resolve-url-loader": "^5.0.0",
  "@pmmmwh/react-refresh-webpack-plugin": "^0.5.15"
}
```

---

## 📊 Package Categories Summary

| Category | Count | Purpose |
|----------|-------|---------|
| Radix UI Components | 13 | Accessible, unstyled UI primitives |
| Styling & CSS | 6 | Tailwind CSS and related utilities |
| React Core | 5 | React framework and tooling |
| TypeScript Types | 4 | Type definitions for development |
| DnD Kit | 3 | Drag and drop functionality |
| Form Management | 3 | Form handling and validation |
| Animation | 1 | Framer Motion for animations |
| Data Fetching | 2 | API calls and state management |
| Charts | 1 | Data visualization |
| Utilities | 3 | Date handling, toasts, icons |

**Total Direct Dependencies:** 41 packages

---

## 🎯 Key Features Enabled

### Modern UI Design System
- **Radix UI**: Accessible, unstyled components as foundation
- **Tailwind CSS**: Utility-first styling approach
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Consistent iconography

### Developer Experience
- **TypeScript**: Type safety and better IDE support
- **React Hook Form + Zod**: Type-safe form validation
- **React Query**: Efficient data fetching and caching
- **Hot Reloading**: Fast development iteration

### User Experience
- **Responsive Design**: Mobile-first approach with Tailwind
- **Accessibility**: WCAG-compliant components from Radix UI
- **Performance**: Optimized bundle with tree-shaking
- **Animations**: Polished micro-interactions

### Functionality
- **Drag & Drop**: Interactive UI with @dnd-kit
- **Charts**: Data visualization with Recharts
- **Routing**: Client-side navigation
- **Notifications**: Toast messages for user feedback

---

## 📈 Package Sizes (Estimated)

| Package | Estimated Size | Purpose |
|---------|----------------|---------|
| react | ~40KB | Core framework |
| framer-motion | ~120KB | Animation library |
| @tanstack/react-query | ~80KB | Data fetching |
| tailwindcss | ~15KB (runtime) | Styling utilities |
| recharts | ~180KB | Chart components |
| lucide-react | ~50KB | Icon library |
| react-hook-form | ~25KB | Form management |
| axios | ~15KB | HTTP client |

*Note: Sizes are gzipped estimates and may vary based on tree-shaking*

---

## 🔍 Installation Commands

To recreate this environment:

```bash
# Install all dependencies
npm install

# Or install specific categories
npm install @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-tabs
npm install tailwindcss autoprefixer postcss
npm install framer-motion lucide-react
npm install @tanstack/react-query axios
npm install react-hook-form @hookform/resolvers zod
```

---

## 📝 Notes

- All packages are pinned to specific versions for reproducible builds
- Security overrides are in place for known vulnerabilities
- The project uses React 18 with Concurrent Features
- TypeScript strict mode is enabled for better type safety
- All UI components follow accessibility best practices

---

**Last Updated:** July 5, 2025  
**Generated by:** Project documentation script
