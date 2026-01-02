/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.{html,js}"],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "#3b82f6",
                "background-dark": "#0b1120",
                "surface-dark": "#161b22",
                "border-dark": "#30363d",
                "product-accent": "#22c55e",
                "accent": "#0ea5e9"
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"],
                "mono": ["JetBrains Mono", "monospace"],
                "body": ["Inter", "sans-serif"],
            },
            backgroundImage: {
                'noise': "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\" opacity=\"0.05\"/%3E%3C/svg%3E')",
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
}
