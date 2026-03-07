const fs = require('fs');

// 1. Update tailwind.config.js
let tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf8');
tailwindConfig = tailwindConfig.replace(
  'theme: {',
  \darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: 'rgb(var(--c-slate-50) / <alpha-value>)',
          100: 'rgb(var(--c-slate-100) / <alpha-value>)',
          200: 'rgb(var(--c-slate-200) / <alpha-value>)',
          300: 'rgb(var(--c-slate-300) / <alpha-value>)',
          400: 'rgb(var(--c-slate-400) / <alpha-value>)',
          500: 'rgb(var(--c-slate-500) / <alpha-value>)',
          600: 'rgb(var(--c-slate-600) / <alpha-value>)',
          700: 'rgb(var(--c-slate-700) / <alpha-value>)',
          800: 'rgb(var(--c-slate-800) / <alpha-value>)',
          900: 'rgb(var(--c-slate-900) / <alpha-value>)',
          950: 'rgb(var(--c-slate-950) / <alpha-value>)',
        }
      }
    },\
);
fs.writeFileSync('tailwind.config.js', tailwindConfig);

// 2. Update index.css
let indexCss = fs.readFileSync('src/index.css', 'utf8');
const cssVars = \
@layer base {
  :root {
    --c-slate-950: 248 250 252;
    --c-slate-900: 255 255 255;
    --c-slate-800: 241 245 249;
    --c-slate-700: 226 232 240;
    --c-slate-600: 203 213 225;
    --c-slate-500: 100 116 139;
    --c-slate-400: 71 85 105;
    --c-slate-300: 51 65 85;
    --c-slate-200: 30 41 59;
    --c-slate-100: 15 23 42;
    --c-slate-50: 2 6 23;
  }
  .dark {
    --c-slate-950: 2 6 23;
    --c-slate-900: 15 23 42;
    --c-slate-800: 30 41 59;
    --c-slate-700: 51 65 85;
    --c-slate-600: 71 85 105;
    --c-slate-500: 100 116 139;
    --c-slate-400: 148 163 184;
    --c-slate-300: 203 213 225;
    --c-slate-200: 226 232 240;
    --c-slate-100: 241 245 249;
    --c-slate-50: 248 250 252;
  }
}
\;
if (!indexCss.includes('--c-slate-950')) {
  fs.writeFileSync('src/index.css', indexCss + '\\n' + cssVars);
}
