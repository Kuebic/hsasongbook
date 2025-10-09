# TypeScript Migration Resources - URLs & Documentation

**Quick access to all documentation and resources for the TypeScript migration.**

---

## Official Documentation

### React 19

| Resource | URL | Description |
|----------|-----|-------------|
| React 19 Release | https://react.dev/blog/2024/12/05/react-19 | Official React 19 release announcement |
| React 19 Upgrade Guide | https://react.dev/blog/2024/04/25/react-19-upgrade-guide | Migration guide from React 18 to 19 |
| TypeScript with React | https://react.dev/learn/typescript | Official React TypeScript documentation |
| useRef Reference | https://react.dev/reference/react/useRef | React 19 useRef documentation |
| createContext Reference | https://react.dev/reference/react/createContext | React 19 Context API documentation |
| forwardRef Reference | https://react.dev/reference/react/forwardRef | forwardRef documentation (mostly deprecated in React 19) |

### TypeScript

| Resource | URL | Description |
|----------|-----|-------------|
| TypeScript Handbook | https://www.typescriptlang.org/docs/ | Official TypeScript documentation |
| TypeScript Playground | https://www.typescriptlang.org/play | Interactive TypeScript editor |
| tsconfig Reference | https://www.typescriptlang.org/tsconfig | Complete tsconfig.json reference |

### React + TypeScript Community

| Resource | URL | Description |
|----------|-----|-------------|
| React TypeScript Cheatsheet | https://react-typescript-cheatsheet.netlify.app/ | Comprehensive React + TS patterns |
| Total TypeScript | https://www.totaltypescript.com/ | Advanced TypeScript resources |
| Event Types Guide | https://www.totaltypescript.com/event-types-in-react-and-typescript | React event typing reference |

---

## Library-Specific Documentation

### React Router v7

| Resource | URL | Description |
|----------|-----|-------------|
| Official Documentation | https://reactrouter.com/ | React Router v7 homepage |
| Upgrading from v6 | https://reactrouter.com/upgrading/v6 | Migration guide |
| Type Safety | https://reactrouter.com/start/framework/routing | Routing with TypeScript |
| Routing Guide | https://reactrouter.com/start/framework/routing | Route modules and types |

**Installed Version:** `react-router-dom@^7.9.1`

### Radix UI

| Resource | URL | Description |
|----------|-----|-------------|
| Radix Primitives Docs | https://www.radix-ui.com/primitives | Main documentation |
| Introduction | https://www.radix-ui.com/primitives/docs/overview/introduction | Getting started |
| Composition Guide | https://www.radix-ui.com/primitives/docs/guides/composition | asChild pattern |
| Getting Started | https://www.radix-ui.com/primitives/docs/overview/getting-started | Installation and usage |

**Installed Packages:**
- `@radix-ui/react-dropdown-menu@^2.1.16`
- `@radix-ui/react-label@^2.1.7`
- `@radix-ui/react-slot@^1.2.3`

### CodeMirror v6

| Resource | URL | Description |
|----------|-----|-------------|
| Official Site | https://codemirror.net/ | CodeMirror 6 homepage |
| System Guide | https://codemirror.net/docs/guide/ | Architecture overview |
| API Reference | https://codemirror.net/docs/ref/ | Full API documentation |
| @uiw/react-codemirror | https://uiwjs.github.io/react-codemirror/ | React wrapper (recommended) |
| GitHub | https://github.com/uiwjs/react-codemirror | React wrapper source |

**Installed Packages:**
- `@codemirror/autocomplete@^6.18.7`
- `@codemirror/commands@^6.8.1`
- `@codemirror/language@^6.11.3`
- `@codemirror/state@^6.5.2`
- `@codemirror/view@^6.38.3`
- `@uiw/react-codemirror@^4.25.2`

### ChordSheetJS

| Resource | URL | Description |
|----------|-----|-------------|
| GitHub Repository | https://github.com/martijnversluis/ChordSheetJS | Main repository |
| npm Package | https://www.npmjs.com/package/chordsheetjs | npm page |
| Type Definitions | https://www.npmjs.com/package/@types/chordsheetjs | DefinitelyTyped types |
| DefinitelyTyped Source | https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/chordsheetjs | Type source code |

**Installed Package:** `chordsheetjs@^12.3.1`

**Installation for Types:**
```bash
npm install --save-dev @types/chordsheetjs
```

### idb (IndexedDB Wrapper)

| Resource | URL | Description |
|----------|-----|-------------|
| GitHub Repository | https://github.com/jakearchibald/idb | Jake Archibald's idb wrapper |
| npm Package | https://www.npmjs.com/package/idb | npm page |
| API Reference | https://github.com/jakearchibald/idb#api | API documentation |

**Installed Package:** `idb@^8.0.3` (includes TypeScript types)

### vite-plugin-pwa

| Resource | URL | Description |
|----------|-----|-------------|
| Documentation | https://vite-pwa-org.netlify.app/guide/ | Official guide |
| GitHub | https://github.com/vite-pwa/vite-plugin-pwa | Source repository |
| Type Definitions | https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/types.ts | TypeScript types |
| Client Types | https://github.com/vite-pwa/vite-plugin-pwa/blob/main/client.d.ts | Client-side types |

**Installed Package:** `vite-plugin-pwa@^1.0.3` (includes TypeScript types)

### Class Variance Authority (CVA)

| Resource | URL | Description |
|----------|-----|-------------|
| Official Documentation | https://cva.style/docs | Main docs |
| Getting Started | https://cva.style/docs/getting-started/installation | Installation guide |
| Variants | https://cva.style/docs/getting-started/variants | Variant definition |
| React + Tailwind Example | https://cva.style/docs/examples/react/tailwind-css | Usage example |

**Installed Package:** `class-variance-authority@^0.7.1` (includes TypeScript types)

### Lucide React Icons

| Resource | URL | Description |
|----------|-----|-------------|
| Official Site | https://lucide.dev/ | Lucide icons homepage |
| React Guide | https://lucide.dev/guide/packages/lucide-react | React package docs |
| Icon Search | https://lucide.dev/icons/ | Browse all icons |
| GitHub | https://github.com/lucide-icons/lucide | Source repository |

**Installed Package:** `lucide-react@^0.544.0` (includes TypeScript types)

---

## Migration Tools

### React 19 Codemod

| Resource | URL | Description |
|----------|-----|-------------|
| npm Package | https://www.npmjs.com/package/types-react-codemod | Official codemod tool |
| GitHub | https://github.com/eps1lon/types-react-codemod | Source repository |

**Usage:**
```bash
npx types-react-codemod@latest preset-19 ./src
```

### TypeScript ESLint

| Resource | URL | Description |
|----------|-----|-------------|
| Official Site | https://typescript-eslint.io/ | TypeScript ESLint homepage |
| Getting Started | https://typescript-eslint.io/getting-started | Setup guide |
| Rules Reference | https://typescript-eslint.io/rules/ | All available rules |

**Installation:**
```bash
npm install --save-dev typescript-eslint
```

---

## Community Resources & Tutorials

### Articles & Guides

| Title | URL | Topic |
|-------|-----|-------|
| Every React 19 Feature Explained with TypeScript | https://dev.to/sovannaro/every-react-19-feature-explained-with-typescript-examples-2dkn | React 19 + TS |
| React 19 vs React 18 Performance | https://dev.to/manojspace/react-19-vs-react-18-performance-improvements-and-migration-guide-5h85 | Migration guide |
| New Approach to Passing Refs in React 19 | https://medium.com/@ignatovich.dm/the-new-approach-to-passing-refs-in-react-19-typescript-a5762b938b93 | Refs in React 19 |
| React with TypeScript: Advanced Techniques | https://dev.to/abdulnasirolcan/react-with-typescript-advanced-techniques-compatible-with-react-19-2cbe | Advanced patterns |
| How to use React Context with TypeScript | https://blog.logrocket.com/how-to-use-react-context-typescript/ | Context patterns |
| React Router v7 Comprehensive Guide | https://dev.to/utkvishwas/react-router-v7-a-comprehensive-guide-migration-from-v6-7d1 | Router migration |
| Building a Code Editor with CodeMirror 6 and TypeScript | https://davidmyers.dev/blog/how-to-build-a-code-editor-with-codemirror-6-and-typescript/introduction | CodeMirror tutorial |
| CVA and Tailwind CSS Guide | https://fveracoechea.com/blog/cva-and-tailwind/ | CVA patterns |

### Stack Overflow Tags

- [reactjs + typescript](https://stackoverflow.com/questions/tagged/reactjs+typescript)
- [react-hooks + typescript](https://stackoverflow.com/questions/tagged/react-hooks+typescript)
- [react-router-dom + typescript](https://stackoverflow.com/questions/tagged/react-router-dom+typescript)
- [codemirror + typescript](https://stackoverflow.com/questions/tagged/codemirror+typescript)

---

## Type Definition Packages (@types)

### Already Installed

```json
{
  "@types/node": "^24.5.2",
  "@types/react": "^19.1.13",
  "@types/react-dom": "^19.1.9"
}
```

### May Need to Install

```bash
# ChordSheetJS types
npm install --save-dev @types/chordsheetjs
```

### Type Search

| Resource | URL | Description |
|----------|-----|-------------|
| TypeSearch | https://www.typescriptlang.org/dt/search | Search for @types packages |
| DefinitelyTyped | https://github.com/DefinitelyTyped/DefinitelyTyped | Type definition source |

---

## Development Tools

### VS Code Extensions (Recommended)

| Extension | ID | Purpose |
|-----------|----|-|
| TypeScript Vue Plugin (Volar) | Vue.vscode-typescript-vue-plugin | Better TS support |
| ESLint | dbaeumer.vscode-eslint | Linting |
| Error Lens | usernamehw.errorlens | Inline errors |
| Pretty TypeScript Errors | yoavbls.pretty-ts-errors | Readable errors |

### Online Tools

| Tool | URL | Purpose |
|------|-----|---------|
| TypeScript Playground | https://www.typescriptlang.org/play | Test TypeScript code |
| TS AST Viewer | https://ts-ast-viewer.com/ | Visualize AST |
| Transform Tools | https://transform.tools/ | Code transformations |

---

## Video Resources

### YouTube Channels

| Channel | URL | Focus |
|---------|-----|-------|
| Matt Pocock (Total TypeScript) | https://www.youtube.com/@mattpocockuk | Advanced TypeScript |
| Jack Herrington | https://www.youtube.com/@jherr | React + TypeScript |
| Web Dev Simplified | https://www.youtube.com/@WebDevSimplified | React tutorials |

### Specific Videos (Search for)

- "React 19 TypeScript Migration"
- "React Router v7 TypeScript"
- "IndexedDB with TypeScript"
- "CodeMirror 6 React TypeScript"

---

## Reference Implementations

### Open Source Projects Using Similar Stack

| Project | URL | Technologies |
|---------|-----|--------------|
| shadcn/ui | https://github.com/shadcn-ui/ui | React 19 + TS + Radix |
| React Router Examples | https://github.com/remix-run/react-router/tree/main/examples | Router v7 + TS |
| CodeMirror Examples | https://github.com/codemirror/website/tree/master/site/examples | CodeMirror 6 |

---

## Troubleshooting Resources

### Common Issues & Solutions

| Issue | Resource | Solution |
|-------|----------|----------|
| React 19 Type Errors | https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/64451 | Types discussion |
| useRef TypeScript Issues | https://github.com/DefinitelyTyped/DefinitelyTyped/issues/35572 | Ref types |
| React Router v7 Types | https://github.com/remix-run/react-router/discussions | Community help |
| CodeMirror React Integration | https://discuss.codemirror.net/t/react-hooks/3409 | Forum discussion |

---

## Package Documentation Quick Links

### Currently Installed (from package.json)

**Dependencies:**
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.9.1",
  "chordsheetjs": "^12.3.1",
  "idb": "^8.0.3",
  "lucide-react": "^0.544.0",
  "class-variance-authority": "^0.7.1",
  "vite-plugin-pwa": "^1.0.3",
  "@uiw/react-codemirror": "^4.25.2",
  "@codemirror/autocomplete": "^6.18.7",
  "@codemirror/commands": "^6.8.1",
  "@codemirror/language": "^6.11.3",
  "@codemirror/state": "^6.5.2",
  "@codemirror/view": "^6.38.3",
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-slot": "^1.2.3"
}
```

**DevDependencies:**
```json
{
  "@types/node": "^24.5.2",
  "@types/react": "^19.1.13",
  "@types/react-dom": "^19.1.9",
  "typescript": "TBD - to be installed",
  "typescript-eslint": "TBD - to be installed"
}
```

---

## Quick Command Reference

### TypeScript Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build

# Preview
npm run preview

# Install TypeScript
npm install --save-dev typescript

# Install TypeScript ESLint
npm install --save-dev typescript-eslint

# Install @types packages
npm install --save-dev @types/chordsheetjs

# Run React 19 codemod
npx types-react-codemod@latest preset-19 ./src
```

---

## Bookmark This Page

Save this file for quick access during migration:
- **Local Path**: `/home/kenei/code/github/Kuebic/hsasongbook/TYPESCRIPT_RESOURCES.md`
- **GitHub**: (Add URL after pushing)

---

**Last Updated**: October 8, 2025
**Maintainer**: HSA Songbook Team
**Status**: Ready for TypeScript migration Phase 3.5
