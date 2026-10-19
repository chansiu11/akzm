const fs=require('node:fs');
fs.mkdirSync('public/vendor',{recursive:true});
for(const name of ['three.module.min.js','three.core.min.js'])fs.copyFileSync('node_modules/three/build/'+name,'public/vendor/'+name);
fs.copyFileSync('node_modules/three/LICENSE','public/vendor/LICENSE.three.txt');
console.log('Static browser dependencies prepared.');
