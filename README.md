# Property Listings Portal (React + Tailwind + Supabase)

This repository is a starter scaffold for a property listings portal using:
- React (Vite) + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage)
- React Router, React Query (TanStack), React Hook Form + Zod

Quick start

1. Create a Supabase project.
2. Create a `property-images` storage bucket (public recommended). See `SUPABASE_STORAGE.md`.
3. Run the SQL migration in `supabase/migrations/001_init.sql` in the Supabase SQL editor.
4. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Install and run:

```bash
npm install
npm run dev
```

Notes
- The project includes a `tailwind.config.js` with theme tokens for colors, fonts, spacing, and radii.
- The `src/lib/supabase.ts` file initializes the Supabase client using `VITE_` env vars.
- Basic page scaffolds are in `src/pages`. Implement components and auth flows as next steps.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
