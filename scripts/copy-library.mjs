import {cp,mkdir} from 'node:fs/promises';
await mkdir('site/dist',{recursive:true});
for(const file of ['momo-cards.es.js','momo-cards.iife.js'])await cp(`dist/${file}`,`site/dist/${file}`);
