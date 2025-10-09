# TypeScript Quick Reference - HSA Songbook

A condensed reference guide for quick lookups during TypeScript migration.

---

## React 19 Breaking Changes Summary

| Feature | React 18 | React 19 |
|---------|----------|----------|
| **forwardRef** | Required for ref forwarding | Not needed - ref is a regular prop |
| **useRef** | Returns MutableRefObject or RefObject | Always returns RefObject (mutable) |
| **Context Provider** | `<Context.Provider>` | `<Context>` directly |
| **useContext** | Only option | `useContext` or new `use` API |
| **PropTypes** | Supported | Removed (use TypeScript) |
| **defaultProps** | Supported | Removed for function components |

---

## Essential Type Imports

```typescript
import {
  // Component types
  ReactNode,
  ReactElement,
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,

  // Event types
  FormEvent,
  ChangeEvent,
  MouseEvent,
  KeyboardEvent,
  FocusEvent,

  // Ref types
  useRef,
  Ref,
  RefObject,

  // Context types
  createContext,
  useContext,

  // Hook types
  useState,
  useEffect,
  useReducer,

  // Other
  Dispatch,
  SetStateAction,
} from 'react';
```

---

## Common Event Types Cheat Sheet

```typescript
// Forms
FormEvent<HTMLFormElement>          // <form onSubmit={}>
ChangeEvent<HTMLInputElement>       // <input onChange={}>
ChangeEvent<HTMLTextAreaElement>    // <textarea onChange={}>
ChangeEvent<HTMLSelectElement>      // <select onChange={}>

// Mouse
MouseEvent<HTMLButtonElement>       // <button onClick={}>
MouseEvent<HTMLDivElement>          // <div onClick={}>
MouseEvent<HTMLAnchorElement>       // <a onClick={}>

// Keyboard
KeyboardEvent<HTMLInputElement>     // <input onKeyDown={}>
KeyboardEvent<HTMLTextAreaElement>  // <textarea onKeyPress={}>

// Focus
FocusEvent<HTMLInputElement>        // <input onFocus={} onBlur={}>
```

---

## Type Definition Patterns

### 1. Simple Component

```typescript
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

### 2. Extend HTML Element

```typescript
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary';
}

function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button className={variant} {...props} />;
}
```

### 3. With Ref Support (React 19)

```typescript
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

### 4. Generic Component

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}
```

---

## State Patterns

### useState

```typescript
// Inferred
const [count, setCount] = useState(0);

// Explicit
const [user, setUser] = useState<User | null>(null);

// Array
const [items, setItems] = useState<string[]>([]);

// Object
const [form, setForm] = useState<FormState>({
  email: '',
  password: '',
});
```

### useReducer

```typescript
type State = { count: number };
type Action = { type: 'increment' } | { type: 'decrement' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 });
```

---

## Ref Patterns (React 19)

```typescript
// DOM element ref
const inputRef = useRef<HTMLInputElement>(null);

// Mutable value ref (all refs are mutable in React 19!)
const countRef = useRef<number>(0);
countRef.current = 1; // ✅ Works!

// Use ref
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

---

## Context Pattern

```typescript
// 1. Define types
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggle: () => void;
}

// 2. Create context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// 3. Provider component
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // React 19: Use <ThemeContext> directly
  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>;
}

// 4. Custom hook
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be within ThemeProvider');
  return ctx;
}
```

---

## Library-Specific Snippets

### React Router v7

```typescript
// Loader with types
import type { LoaderFunctionArgs } from 'react-router-dom';

export async function loader({ params }: LoaderFunctionArgs) {
  const data = await fetchData(params.id!);
  return data;
}

// Component
import { useLoaderData, useNavigate, useParams } from 'react-router-dom';

export default function Page() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  return <div>{data.title}</div>;
}
```

### idb (IndexedDB)

```typescript
import { openDB, DBSchema } from 'idb';

interface MyDB extends DBSchema {
  songs: {
    key: string;
    value: { id: string; title: string };
    indexes: { 'by-title': string };
  };
}

const db = await openDB<MyDB>('my-db', 1, {
  upgrade(db) {
    const store = db.createObjectStore('songs', { keyPath: 'id' });
    store.createIndex('by-title', 'title');
  },
});

// Type-safe operations
await db.add('songs', { id: '1', title: 'Song' });
const song = await db.get('songs', '1'); // Type: { id: string; title: string } | undefined
```

### CVA (Class Variance Authority)

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const button = cva('base-class', {
  variants: {
    variant: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'sm',
  },
});

interface ButtonProps extends VariantProps<typeof button> {
  children: ReactNode;
}

function Button({ variant, size, children }: ButtonProps) {
  return <button className={button({ variant, size })}>{children}</button>;
}
```

### Lucide Icons

```typescript
import { LucideIcon, Search, ChevronDown } from 'lucide-react';

// Icon as prop
interface Props {
  icon: LucideIcon;
}

function IconButton({ icon: Icon }: Props) {
  return <Icon size={20} />;
}

// Usage
<IconButton icon={Search} />
<ChevronDown size={24} strokeWidth={2} />
```

### Radix UI

```typescript
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

// Compose types
type Props =
  Pick<DropdownMenu.DropdownMenuProps, 'open'> &
  Pick<DropdownMenu.DropdownMenuItemProps, 'onSelect'>;

// asChild pattern
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

function Button({ asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp {...props} />;
}
```

---

## Common Mistakes - Quick Fixes

### ❌ Using `any`
```typescript
// WRONG
function foo(data: any) { }

// RIGHT
interface Data { value: string }
function foo(data: Data) { }

// Or if truly unknown
function foo(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}
```

### ❌ Inline Props
```typescript
// WRONG
function Btn({ text }: { text: string }) { }

// RIGHT
interface BtnProps { text: string }
function Btn({ text }: BtnProps) { }
```

### ❌ Missing Event Types
```typescript
// WRONG
const handleClick = (e) => { }

// RIGHT
const handleClick = (e: MouseEvent<HTMLButtonElement>) => { }
```

### ❌ Forgetting `as const` for Tuples
```typescript
// WRONG
return [value, setValue]; // Type: (number | function)[]

// RIGHT
return [value, setValue] as const; // Type: readonly [number, function]
```

### ❌ Using React.FC
```typescript
// WRONG (old pattern)
const Comp: React.FC<Props> = ({ children }) => { }

// RIGHT (modern)
function Comp({ children }: Props) { }
```

---

## Type Utilities You'll Use

```typescript
// HTML element props
ComponentProps<'button'>           // All button props
ComponentPropsWithRef<'input'>     // With ref support
ComponentPropsWithoutRef<'div'>    // Without ref

// React types
ReactNode                          // Any valid children
ReactElement                       // Specific element
Dispatch<SetStateAction<T>>        // setState type

// Utility types
Partial<T>                         // All properties optional
Required<T>                        // All properties required
Pick<T, 'key1' | 'key2'>          // Pick specific properties
Omit<T, 'key1' | 'key2'>          // Omit specific properties
Record<string, T>                  // Object with string keys

// CVA
VariantProps<typeof cvaFunction>   // Extract variant props

// Lucide
LucideIcon                         // Icon component type
```

---

## Migration Workflow

### For Each File:

1. **Rename**: `.jsx` → `.tsx` or `.js` → `.ts`
2. **Add Types**: Props, state, functions
3. **Check**: `npm run typecheck`
4. **Lint**: `npm run lint`
5. **Build**: `npm run build`
6. **Test**: Manual testing
7. **Commit**: One feature at a time

### Order of Migration:

1. Type definitions (`.types.ts` files)
2. Utilities and helpers
3. Hooks
4. Components (simple → complex)
5. Pages/Routes
6. App core

---

## ESLint Rules for TypeScript

```javascript
// Add to eslint.config.js
rules: {
  '@typescript-eslint/no-explicit-any': 'error',     // Ban 'any'
  '@typescript-eslint/no-unused-vars': 'warn',       // Warn on unused
  '@typescript-eslint/explicit-function-return-type': 'off',  // Allow inference
  '@typescript-eslint/explicit-module-boundary-types': 'off', // Allow inference
}
```

---

## Quick Debugging

### Type Error?
```typescript
// See what TypeScript thinks the type is
const x = someValue;
type X = typeof x; // Hover to see type

// Force type assertion (use sparingly)
const y = someValue as ExpectedType;
```

### Generic Error?
```typescript
// Add explicit type parameter
const result = myFunction<string>('value');
```

### Import Error?
```typescript
// Check if @types package is needed
npm install --save-dev @types/packagename
```

---

## tsconfig.json Quick Reference

```json
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "noUnusedLocals": true,           // Error on unused variables
    "noUnusedParameters": true,       // Error on unused parameters
    "noUncheckedIndexedAccess": true, // obj[key] might be undefined
    "jsx": "react-jsx",               // React 17+ JSX transform
    "moduleResolution": "bundler",    // Use bundler resolution
    "paths": { "@/*": ["./src/*"] },  // Path alias
    "noEmit": true,                   // Don't emit (Vite handles it)
  }
}
```

---

## Useful Commands

```bash
# Type checking
npm run typecheck

# Lint check
npm run lint

# Build check
npm run build

# React 19 codemod
npx types-react-codemod@latest preset-19 ./src

# Install @types package
npm install --save-dev @types/packagename
```

---

## Resources for Quick Lookup

- **React + TS Cheatsheet**: https://react-typescript-cheatsheet.netlify.app/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
- **React 19 Upgrade Guide**: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- **Event Types Reference**: https://www.totaltypescript.com/event-types-in-react-and-typescript

---

**Keep this file open during migration for quick reference!**
