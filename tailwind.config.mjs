import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['Space Grotesk', 'monospace'],
            },
            colors: {
                primary: '#3b82f6',
                secondary: '#a855f7',
                background: {
                    light: '#f8fafc',
                    dark: '#0f172a',
                },
                surface: {
                    light: '#ffffff',
                    dark: '#1e293b',
                },
                border: {
                    light: '#e2e8f0',
                    dark: '#334155',
                }
            }
        },
    },
    plugins: [
        typography,
    ],
}
