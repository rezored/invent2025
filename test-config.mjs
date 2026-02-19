import config from './astro.config.mjs';
console.log(JSON.stringify(config, (key, value) => typeof value === 'function' ? '[Function]' : value, 2));
