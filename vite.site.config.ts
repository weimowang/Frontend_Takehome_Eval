import {defineConfig} from 'vite';
export default defineConfig({base:'./',build:{target:'es2022',outDir:'site',rollupOptions:{input:{showroom:'index.html',sample:'sample.html',mount:'sample-mount.html'}}}});
