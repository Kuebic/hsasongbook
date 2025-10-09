# React 19 + TypeScript Migration Guide for HSA Songbook

**Last Updated**: October 2025
**React Version**: 19.1.1
**TypeScript Target**: 5.x
**Current Status**: Pre-migration research

This document provides comprehensive guidance for migrating the HSA Songbook codebase from JavaScript to TypeScript with React 19 specific patterns, types, and best practices.

---

## Table of Contents

1. [React 19 Breaking Changes & New Features](#react-19-breaking-changes--new-features)
2. [TypeScript Setup](#typescript-setup)
3. [React 19 TypeScript Patterns](#react-19-typescript-patterns)
4. [Library-Specific TypeScript Patterns](#library-specific-typescript-patterns)
5. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
6. [Migration Checklist](#migration-checklist)
7. [Resources & Documentation](#resources--documentation)

---

## React 19 Breaking Changes & New Features

### 1. TypeScript Types Cleanup

React 19 has cleaned up TypeScript types based on removed APIs. Some types have been moved to more relevant packages, and others are no longer needed.

**Migration Tool Available:**
```bash
npx types-react-codemod@latest preset-19 ./path-to-app
```

### 2. useRef Changes (CRITICAL)

**Major Change**: `useRef` now requires an argument and all refs are now mutable.

**Before (React 18):**
```typescript
const ref = useRef<number>(null); // RefObject<number | null> - read-only
// Error: Cannot assign to 'current' because it is a read-only property
ref.current = 1;
```

**After (React 19):**
```typescript
const ref = useRef<number>(null); // RefObject<number | null> - mutable
ref.current = 1; // ✅ Works! All refs are now mutable
```

**Key Points:**
- `MutableRefObject` is deprecated in favor of a single `RefObject<T>` type
- The `current` property is always mutable
- `useRef<T>(null)` returns `RefObject<T | null>`
- No more confusing distinction between mutable and immutable refs

### 3. Automatic Ref Forwarding (NEW)

**Revolutionary Change**: `forwardRef` is no longer necessary for most cases!

**Before (React 18):**
```typescript
import { forwardRef, Ref } from 'react';

interface MyInputProps {
  placeholder: string;
}

const MyInput = forwardRef<HTMLInputElement, MyInputProps>(
  (props, ref) => {
    return <input ref={ref} {...props} />;
  }
);
```

**After (React 19):**
```typescript
interface MyInputProps {
  placeholder: string;
  ref?: Ref<HTMLInputElement>; // ref is just a regular prop now!
}

function MyInput(props: MyInputProps) {
  return <input {...props} />;
}

// Or even simpler with ComponentPropsWithRef:
import { ComponentPropsWithRef } from 'react';

interface MyInputProps extends ComponentPropsWithRef<'input'> {
  // Add custom props here
}

function MyInput(props: MyInputProps) {
  return <input {...props} />;
}
```

**When to Still Use forwardRef:**
- When using `useImperativeHandle` to customize exposed ref value
- When you need backward compatibility with React < 19

### 4. Context API Improvements

**New Pattern**: Render `<Context>` directly as a provider instead of `<Context.Provider>`

**Before (React 18):**
```typescript
const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Component />
    </ThemeContext.Provider>
  );
}
```

**After (React 19):**
```typescript
const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  return (
    <ThemeContext value="dark"> {/* Simpler! */}
      <Component />
    </ThemeContext>
  );
}
```

**New `use` API:**
```typescript
import { use } from 'react';

function Component() {
  const theme = use(ThemeContext); // Alternative to useContext
  return <div>Theme: {theme}</div>;
}
```

### 5. New Hooks in React 19

#### useActionState
For managing form actions and async state.

#### useFormStatus
Provides real-time insights into form submissions.

#### useOptimistic
For implementing optimistic UI updates:
```typescript
import { useOptimistic } from 'react';

function Component() {
  const [optimisticState, addOptimistic] = useOptimistic(
    currentState,
    (state, newValue) => {
      // Return optimistic state
      return [...state, newValue];
    }
  );
}
```

#### use API
Read resources in render (can be called conditionally, unlike hooks):
```typescript
import { use } from 'react';

function Component({ dataPromise }) {
  const data = use(dataPromise); // Can use promises!
  return <div>{data}</div>;
}
```

### 6. Removed/Deprecated Features

**PropTypes Removed**:
- PropTypes are removed from React package
- Using them will be silently ignored
- **Migration Required**: Switch to TypeScript

**defaultProps Removed (Function Components)**:
- Use ES6 default parameters instead
- Class components still support `defaultProps`

**Before:**
```javascript
function Button({ variant, children }) {
  return <button>{children}</button>;
}
Button.defaultProps = { variant: 'primary' };
```

**After:**
```typescript
interface ButtonProps {
  variant?: string;
  children: React.ReactNode;
}

function Button({ variant = 'primary', children }: ButtonProps) {
  return <button>{children}</button>;
}
```

### 7. JSX Namespace Changes

The global `JSX` namespace has been removed for better compatibility with other JSX libraries.

**Required Change**: Wrap module augmentation in `declare module`:

```typescript
// Before (React 18)
declare namespace JSX {
  interface IntrinsicElements {
    'custom-element': CustomElementProps;
  }
}

// After (React 19)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'custom-element': CustomElementProps;
    }
  }
}
```

---

## TypeScript Setup

### 1. Install Required Packages

```bash
# Core TypeScript support
npm install --save-dev typescript @types/node

# React type definitions (already installed in project)
# @types/react@^19.1.13
# @types/react-dom@^19.1.9

# Check if any other @types packages are needed
```

### 2. Create tsconfig.json

```json
{
  "compilerOptions": {
    // Target & Module
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    // Strict Type Checking (REQUIRED)
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    // JSX Support
    "jsx": "react-jsx",
    "jsxImportSource": "react",

    // Module Resolution
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",

    // Emit
    "noEmit": true,
    "skipLibCheck": true,

    // Interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,

    // Path Aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },

    // React Router v7 Type Generation
    "rootDirs": [".", "./.react-router/types"]
  },
  "include": [
    "src",
    ".react-router/types/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "dev-dist"
  ]
}
```

### 3. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### 4. Update ESLint Configuration

**Current**: `eslint.config.js` only handles `.js` and `.jsx` files.

**Required Changes**:
```javascript
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint' // NEW

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'src/components/ui/**', '.react-router'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked, // NEW
    ],
    files: ['**/*.{ts,tsx}'], // UPDATED
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'error', // CRITICAL
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
    },
  },
)
```

### 5. Update Vite Configuration

```javascript
// vite.config.js -> vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Configuration remains the same, just use .ts extension
})
```

---

## React 19 TypeScript Patterns

### Component Props Patterns

#### 1. Basic Component with Props

```typescript
import { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
```

#### 2. Extending HTML Element Props

```typescript
import { ComponentPropsWithoutRef } from 'react';

// Extend native button props
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary';
}

function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button {...props} className={`btn-${variant}`} />;
}

// With ref support (React 19 - automatic forwarding)
import { ComponentPropsWithRef } from 'react';

interface InputProps extends ComponentPropsWithRef<'input'> {
  label?: string;
}

function Input({ label, ...props }: InputProps) {
  return (
    <div>
      {label && <label>{label}</label>}
      <input {...props} />
    </div>
  );
}
```

#### 3. Children Patterns

```typescript
import { ReactNode, ReactElement } from 'react';

// Any valid React children
interface ContainerProps {
  children: ReactNode;
}

// Only specific component types
interface TabsProps {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
}

// Render prop pattern
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}
```

### Event Handlers

```typescript
import { FormEvent, ChangeEvent, MouseEvent, KeyboardEvent } from 'react';

interface FormComponentProps {
  onSubmit: (data: FormData) => void;
}

function FormComponent({ onSubmit }: FormComponentProps) {
  // Form submit handler
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(formData);
  };

  // Input change handler
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
  };

  // Button click handler
  const handleButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    console.log('Button clicked:', event.currentTarget);
  };

  // Keyboard handler
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Handle Enter key
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleInputChange} onKeyDown={handleKeyDown} />
      <button onClick={handleButtonClick}>Submit</button>
    </form>
  );
}
```

**Common Event Types:**
- `FormEvent<HTMLFormElement>` - Form submissions
- `ChangeEvent<HTMLInputElement>` - Input changes
- `ChangeEvent<HTMLTextAreaElement>` - Textarea changes
- `ChangeEvent<HTMLSelectElement>` - Select changes
- `MouseEvent<HTMLButtonElement>` - Button clicks
- `MouseEvent<HTMLDivElement>` - Div clicks
- `KeyboardEvent<HTMLInputElement>` - Keyboard events
- `FocusEvent<HTMLInputElement>` - Focus/blur events

### State Management

#### 1. useState with Explicit Types

```typescript
import { useState } from 'react';

// Simple types (type inference works)
const [count, setCount] = useState(0); // number
const [name, setName] = useState(''); // string

// Complex types (explicit typing recommended)
interface User {
  id: string;
  name: string;
  email: string;
}

const [user, setUser] = useState<User | null>(null);

// Array types
const [items, setItems] = useState<string[]>([]);

// Object types
interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

const [form, setForm] = useState<FormState>({
  email: '',
  password: '',
  rememberMe: false,
});
```

#### 2. useReducer with Types

```typescript
import { useReducer } from 'react';

interface State {
  count: number;
  error: string | null;
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset'; payload: number }
  | { type: 'error'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'reset':
      return { ...state, count: action.payload };
    case 'error':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, error: null });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset', payload: 0 })}>Reset</button>
    </div>
  );
}
```

#### 3. Context with TypeScript

```typescript
import { createContext, useContext, useState, ReactNode } from 'react';

// Define context shape
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Create context with undefined (will be provided by Provider)
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Provider component
interface ThemeProviderProps {
  children: ReactNode;
}

function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextValue = { theme, toggleTheme };

  // React 19: Use <ThemeContext> directly
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

// Custom hook with runtime check
function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Usage
function Component() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Current: {theme}</button>;
}
```

### Custom Hooks

```typescript
import { useState, useEffect } from 'react';

// Hook with generic type parameter
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  }, [key, value]);

  return [value, setValue] as const; // as const for tuple type
}

// Usage
function Component() {
  const [name, setName] = useLocalStorage<string>('name', '');
  const [settings, setSettings] = useLocalStorage({ theme: 'light' });
}
```

### Refs

```typescript
import { useRef, useEffect } from 'react';

function Component() {
  // DOM element ref
  const inputRef = useRef<HTMLInputElement>(null);

  // Mutable value ref (React 19 - all refs are mutable!)
  const countRef = useRef<number>(0);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();

    // Mutate ref value (works in React 19!)
    countRef.current = 1;
  }, []);

  return <input ref={inputRef} />;
}
```

---

## Library-Specific TypeScript Patterns

### React Router v7

#### Installation & Setup

```bash
# Already installed: react-router-dom@^7.9.1
```

#### Type Generation Setup

React Router v7 automatically generates types for route modules.

**Add to .gitignore:**
```
.react-router/
```

**Update tsconfig.json** (already shown in setup section):
```json
{
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"]
  },
  "include": ["src", ".react-router/types/**/*"]
}
```

#### Route Module Types

```typescript
// src/routes/song.$id.tsx
import type { LoaderFunctionArgs } from 'react-router-dom';
import { useLoaderData } from 'react-router-dom';

interface Song {
  id: string;
  title: string;
  artist: string;
}

// Loader with types
export async function loader({ params }: LoaderFunctionArgs) {
  const song = await fetchSong(params.id!);
  return song;
}

// Component using loader data
export default function SongPage() {
  const song = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{song.title}</h1>
      <p>by {song.artist}</p>
    </div>
  );
}
```

#### Navigation with Types

```typescript
import { useNavigate, useParams, Link } from 'react-router-dom';

function Component() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const handleClick = () => {
    navigate(`/songs/${params.id}`);
  };

  return (
    <>
      <Link to="/songs">Back to songs</Link>
      <button onClick={handleClick}>Navigate</button>
    </>
  );
}
```

### Radix UI (shadcn/ui)

#### Already Installed
```json
{
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-slot": "^1.2.3"
}
```

#### Type Patterns

```typescript
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

// Compose types from multiple Radix parts
type CustomDropdownProps =
  Pick<DropdownMenu.DropdownMenuProps, 'open' | 'onOpenChange'> &
  Pick<DropdownMenu.DropdownMenuItemProps, 'onSelect'> & {
    trigger: React.ReactNode;
    items: Array<{ label: string; value: string }>;
  };

function CustomDropdown({ trigger, items, ...props }: CustomDropdownProps) {
  return (
    <DropdownMenu.Root {...props}>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {items.map(item => (
          <DropdownMenu.Item key={item.value} onSelect={() => props.onSelect?.(item.value)}>
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
```

#### asChild Pattern (Polymorphic Components)

```typescript
import { Slot } from '@radix-ui/react-slot';
import { ComponentPropsWithoutRef } from 'react';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

function Button({ asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp {...props} />;
}

// Usage
<Button onClick={handleClick}>Regular button</Button>
<Button asChild>
  <a href="/link">Link styled as button</a>
</Button>
```

### CodeMirror v6

#### Already Installed
```json
{
  "@codemirror/autocomplete": "^6.18.7",
  "@codemirror/commands": "^6.8.1",
  "@codemirror/language": "^6.11.3",
  "@codemirror/state": "^6.5.2",
  "@codemirror/view": "^6.38.3",
  "@uiw/react-codemirror": "^4.25.2"
}
```

#### Using @uiw/react-codemirror (Recommended)

```typescript
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

function Editor({ value, onChange, readOnly = false }: EditorProps) {
  return (
    <CodeMirror
      value={value}
      height="400px"
      extensions={[javascript({ jsx: true })]}
      onChange={onChange}
      editable={!readOnly}
      theme="dark"
    />
  );
}
```

#### Manual Integration

```typescript
import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';

interface CodeEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
}

function CodeEditor({ initialValue, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        basicSetup,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  return <div ref={editorRef} />;
}
```

### ChordSheetJS

#### Type Definitions

```bash
# Already installed (check if @types needed)
npm install --save-dev @types/chordsheetjs
```

**Current package.json:** `"chordsheetjs": "^12.3.1"`

#### Usage with Types

```typescript
import { ChordProParser, HtmlTableFormatter, Song } from 'chordsheetjs';

interface ChordSheetViewerProps {
  chordProContent: string;
  transpose?: number;
}

function ChordSheetViewer({ chordProContent, transpose = 0 }: ChordSheetViewerProps) {
  const parser = new ChordProParser();
  const song: Song = parser.parse(chordProContent);

  // Transpose if needed
  if (transpose !== 0) {
    song.transpose(transpose);
  }

  const formatter = new HtmlTableFormatter();
  const html = formatter.format(song);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### idb (IndexedDB)

#### Type-Safe Database Schema

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define database schema
interface SongbookDB extends DBSchema {
  songs: {
    key: string;
    value: {
      id: string;
      title: string;
      artist: string;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      'by-artist': string;
      'by-title': string;
    };
  };
  arrangements: {
    key: string;
    value: {
      id: string;
      songId: string;
      key: string;
      tempo: number;
      chordProContent: string;
    };
    indexes: {
      'by-song': string;
    };
  };
}

// Open database with types
async function getDB() {
  return openDB<SongbookDB>('songbook-db', 1, {
    upgrade(db) {
      // Songs store
      const songStore = db.createObjectStore('songs', { keyPath: 'id' });
      songStore.createIndex('by-artist', 'artist');
      songStore.createIndex('by-title', 'title');

      // Arrangements store
      const arrangementStore = db.createObjectStore('arrangements', { keyPath: 'id' });
      arrangementStore.createIndex('by-song', 'songId');
    },
  });
}

// Type-safe CRUD operations
async function addSong(song: SongbookDB['songs']['value']) {
  const db = await getDB();
  await db.add('songs', song);
}

async function getSong(id: string): Promise<SongbookDB['songs']['value'] | undefined> {
  const db = await getDB();
  return db.get('songs', id);
}

async function getAllSongsByArtist(artist: string) {
  const db = await getDB();
  return db.getAllFromIndex('songs', 'by-artist', artist);
}
```

### vite-plugin-pwa

#### Type-Safe Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';

const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
  manifest: {
    name: 'HSA Songbook',
    short_name: 'Songbook',
    description: 'Progressive Web App for musicians',
    theme_color: '#ffffff',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
    ],
  },
};

export default defineConfig({
  plugins: [VitePWA(pwaOptions)],
});
```

### Class Variance Authority (CVA)

#### Type-Safe Variants

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define button variants with CVA
const buttonVariants = cva(
  // Base classes
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Extract variant props type
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// Usage with full type safety
<Button variant="destructive" size="lg">Delete</Button>
```

### Lucide React Icons

#### Type-Safe Icon Props

```typescript
import { LucideIcon, Search, ChevronDown } from 'lucide-react';

// Pass icon as prop
interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

function IconButton({ icon: Icon, label, onClick }: IconButtonProps) {
  return (
    <button onClick={onClick} aria-label={label}>
      <Icon size={20} strokeWidth={2} />
    </button>
  );
}

// Usage
<IconButton icon={Search} label="Search" onClick={handleSearch} />

// Direct usage with props
<ChevronDown
  size={24}
  color="blue"
  strokeWidth={1.5}
  className="animate-bounce"
/>
```

---

## Common Mistakes to Avoid

### 1. NEVER Use `any` Type

**❌ WRONG:**
```typescript
function processData(data: any) {
  return data.map((item: any) => item.value);
}
```

**✅ CORRECT:**
```typescript
interface DataItem {
  value: string;
}

function processData(data: DataItem[]) {
  return data.map(item => item.value);
}

// Or if type is truly unknown:
function processData(data: unknown) {
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'object' && item !== null && 'value' in item) {
        return item.value;
      }
      return null;
    });
  }
  throw new Error('Invalid data format');
}
```

### 2. Don't Define Props Inline

**❌ WRONG:**
```typescript
function Button({
  variant,
  onClick
}: {
  variant: string;
  onClick: () => void
}) {
  return <button onClick={onClick}>{variant}</button>;
}
```

**✅ CORRECT:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
}

function Button({ variant, onClick }: ButtonProps) {
  return <button onClick={onClick}>{variant}</button>;
}
```

### 3. Don't Skip Event Handler Types

**❌ WRONG:**
```typescript
const handleClick = (e) => {
  e.preventDefault();
};
```

**✅ CORRECT:**
```typescript
import { MouseEvent } from 'react';

const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
};
```

### 4. Don't Forget Return Types for Complex Functions

**❌ WRONG:**
```typescript
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**✅ CORRECT:**
```typescript
interface Item {
  price: number;
}

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### 5. Don't Use `@ts-ignore` Without Justification

**❌ WRONG:**
```typescript
// @ts-ignore
const result = riskyOperation();
```

**✅ CORRECT:**
```typescript
// Type assertion with explanation
const result = riskyOperation() as ExpectedType;

// Or better: fix the types properly
interface RiskyOperationResult {
  success: boolean;
  data: string;
}

function riskyOperation(): RiskyOperationResult {
  // Implementation
}
```

### 6. Don't Use React.FC / React.FunctionComponent

**❌ WRONG (Old Pattern):**
```typescript
const Component: React.FC<Props> = ({ children }) => {
  return <div>{children}</div>;
};
```

**✅ CORRECT (Modern Pattern):**
```typescript
interface ComponentProps {
  children: ReactNode;
}

function Component({ children }: ComponentProps) {
  return <div>{children}</div>;
}
```

### 7. Don't Forget `as const` for Tuple Returns

**❌ WRONG:**
```typescript
function useState() {
  const [value, setValue] = useState(0);
  return [value, setValue]; // Type: (number | Dispatch<SetStateAction<number>>)[]
}
```

**✅ CORRECT:**
```typescript
function useState() {
  const [value, setValue] = useState(0);
  return [value, setValue] as const; // Type: readonly [number, Dispatch<SetStateAction<number>>]
}
```

### 8. Don't Use `forwardRef` in React 19 (Unless Necessary)

**❌ OLD PATTERN (React 18):**
```typescript
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

**✅ NEW PATTERN (React 19):**
```typescript
interface InputProps extends ComponentPropsWithRef<'input'> {
  // Custom props
}

function Input(props: InputProps) {
  return <input {...props} />;
}
```

---

## Migration Checklist

### Phase 1: Setup

- [ ] Install TypeScript and @types packages
- [ ] Create tsconfig.json with strict mode enabled
- [ ] Update eslint.config.js to support TypeScript
- [ ] Add typecheck script to package.json
- [ ] Update vite.config.js to vite.config.ts
- [ ] Add .react-router/ to .gitignore (for React Router v7)

### Phase 2: Type Definitions

- [ ] Create shared types directory: `src/features/shared/types/`
- [ ] Define Song.types.ts
- [ ] Define Arrangement.types.ts
- [ ] Define Database.types.ts (IndexedDB schema)
- [ ] Define PWA.types.ts

### Phase 3: Migration Strategy

#### Feature-by-Feature Approach

1. **Start with Utilities & Helpers**
   - [ ] Migrate `src/lib/logger.js` → `src/lib/logger.ts`
   - [ ] Migrate `src/lib/utils.js` → `src/lib/utils.ts`
   - [ ] Migrate configuration files in `src/lib/config/`

2. **Migrate Shared Components**
   - [ ] Migrate `src/features/shared/utils/` (dataHelpers, etc.)
   - [ ] Migrate `src/features/shared/hooks/`
   - [ ] Migrate `src/features/shared/components/`

3. **Migrate Feature Modules** (One at a time)
   - [ ] PWA feature (`src/features/pwa/`)
   - [ ] Search feature (`src/features/search/`)
   - [ ] Songs feature (`src/features/songs/`)
   - [ ] Arrangements feature (`src/features/arrangements/`)
   - [ ] ChordPro feature (`src/features/chordpro/`)

4. **Migrate App Core**
   - [ ] Migrate `src/app/App.jsx` → `src/app/App.tsx`
   - [ ] Migrate `src/app/main.jsx` → `src/app/main.tsx`
   - [ ] Update index.html script reference if needed

5. **Migrate shadcn/ui Components** (if customized)
   - [ ] Check `src/components/ui/` for custom modifications
   - [ ] Migrate only if heavily customized (otherwise leave as-is)

### Phase 4: Verification (After Each Module)

- [ ] Run `npm run typecheck` - must pass with 0 errors
- [ ] Run `npm run lint` - must pass with 0 errors
- [ ] Run `npm run build` - must succeed
- [ ] Run `npm run preview` - test functionality
- [ ] Manual testing - ensure no regressions
- [ ] Commit changes (one feature at a time)

### Phase 5: Final Cleanup

- [ ] Remove any remaining .js/.jsx files (except scripts/)
- [ ] Ensure no `any` types remain (run eslint check)
- [ ] Update CLAUDE.md to reflect TypeScript completion
- [ ] Update README.md if applicable
- [ ] Final full build and test

---

## Resources & Documentation

### Official Documentation

#### React 19
- **React 19 Release**: https://react.dev/blog/2024/12/05/react-19
- **React 19 Upgrade Guide**: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- **TypeScript with React**: https://react.dev/learn/typescript
- **useRef Reference**: https://react.dev/reference/react/useRef
- **createContext Reference**: https://react.dev/reference/react/createContext

#### TypeScript
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **TypeScript + React Cheatsheet**: https://react-typescript-cheatsheet.netlify.app/

#### React Router v7
- **Official Documentation**: https://reactrouter.com/
- **Upgrading from v6**: https://reactrouter.com/upgrading/v6
- **Type Safety Guide**: https://reactrouter.com/start/framework/routing

#### Libraries

**Radix UI Primitives**:
- Documentation: https://www.radix-ui.com/primitives
- Composition Guide: https://www.radix-ui.com/primitives/docs/guides/composition

**CodeMirror v6**:
- Official Site: https://codemirror.net/
- React Wrapper (@uiw/react-codemirror): https://uiwjs.github.io/react-codemirror/

**ChordSheetJS**:
- GitHub: https://github.com/martijnversluis/ChordSheetJS
- npm: https://www.npmjs.com/package/chordsheetjs
- Types: https://www.npmjs.com/package/@types/chordsheetjs

**idb (IndexedDB)**:
- GitHub: https://github.com/jakearchibald/idb
- npm: https://www.npmjs.com/package/idb

**vite-plugin-pwa**:
- Documentation: https://vite-pwa-org.netlify.app/guide/
- GitHub: https://github.com/vite-pwa/vite-plugin-pwa
- Type Definitions: https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/types.ts

**Class Variance Authority**:
- Documentation: https://cva.style/docs
- npm: https://www.npmjs.com/package/class-variance-authority

**Lucide React Icons**:
- Documentation: https://lucide.dev/guide/packages/lucide-react
- Icon Search: https://lucide.dev/icons/

#### Migration Tools

**React 19 Codemod**:
```bash
npx types-react-codemod@latest preset-19 ./path-to-app
```

**Useful Type Utilities**:
- `ComponentProps<'element'>` - Get props type for HTML element
- `ComponentPropsWithRef<'element'>` - With ref support
- `ComponentPropsWithoutRef<'element'>` - Without ref
- `ReactNode` - Any valid React children
- `ReactElement` - Specific React element
- `VariantProps<typeof cvaFunction>` - Extract CVA variant props
- `LucideIcon` - Type for Lucide icon components

---

## Quick Reference Card

### Component Template
```typescript
import { ReactNode } from 'react';

interface ComponentProps {
  variant?: 'default' | 'primary';
  children: ReactNode;
  onClick?: () => void;
}

function Component({
  variant = 'default',
  children,
  onClick
}: ComponentProps) {
  return (
    <div onClick={onClick}>
      {children}
    </div>
  );
}

export default Component;
```

### Hook Template
```typescript
import { useState, useEffect } from 'react';

interface UseCustomHookOptions {
  initialValue: string;
}

function useCustomHook({ initialValue }: UseCustomHookOptions) {
  const [value, setValue] = useState<string>(initialValue);

  useEffect(() => {
    // Side effects
  }, []);

  return { value, setValue } as const;
}

export default useCustomHook;
```

### Context Template
```typescript
import { createContext, useContext, useState, ReactNode } from 'react';

interface ContextValue {
  state: string;
  update: (value: string) => void;
}

const Context = createContext<ContextValue | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export function Provider({ children }: ProviderProps) {
  const [state, setState] = useState<string>('');

  const value: ContextValue = {
    state,
    update: setState,
  };

  return <Context value={value}>{children}</Context>;
}

export function useCustomContext() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useCustomContext must be used within Provider');
  }
  return context;
}
```

---

**Last Updated**: October 2025
**Maintainer**: HSA Songbook Team
**Feedback**: Update this guide as new patterns emerge during migration
