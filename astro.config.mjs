import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
    integrations: [tailwind()],
    i18n: {
        defaultLocale: "bg",
        locales: ["bg", "en"],
        routing: {
            prefixDefaultLocale: false
        }
    },
    build: {
        format: 'file'
    }
});
