import { defineConfig } from 'vite';
export default defineConfig({build:{copyPublicDir:false,lib:{entry:'src/index.ts',name:'MomoCards',formats:['es','iife'],fileName:format=>`momo-cards.${format}.js`}}});
