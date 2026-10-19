const fs=require('fs');const d=require('minecraft-data')('1.8.9');
const out={version:'1.8.9',source:'PrismarineJS/minecraft-data',items:d.itemsArray,recipes:Object.values(d.recipes).flat(),foods:d.foodsArray,blocks:d.blocksArray};
fs.writeFileSync('public/catalog.json',JSON.stringify(out));

console.log(out.items.length+' item IDs, '+out.recipes.length+' recipe records exported');
