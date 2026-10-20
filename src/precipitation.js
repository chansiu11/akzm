// Biome and open-sky filter for the local weather preview, not a faithful 1.8.9 weather model.
export function precipitationType(world,x,y,z,weather){
 if(weather==='clear')return 'none';
 const bx=Math.floor(x),bz=Math.floor(z);
 if(y<=world.columnTop(bx,bz))return 'none';
 const biome=world.biome(bx,bz);
 if(biome==='desert')return 'none';
 return biome==='snowy'?'snow':'rain';
}
