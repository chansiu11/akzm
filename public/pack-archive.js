// Read selected PNG entries only. Archives are processed locally, never executed.
export async function readTextureArchive(file){
 if(file.size>100*1024*1024)throw Error('100MB 이하 ZIP/JAR 파일을 선택하세요.');
 const bytes=new Uint8Array(await file.arrayBuffer()),v=new DataView(bytes.buffer),u16=p=>v.getUint16(p,true),u32=p=>v.getUint32(p,true);
 let end=-1;for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(u32(p)===0x06054b50){end=p;break;}
 if(end<0||u16(end+4)||u16(end+6))throw Error('지원하지 않는 ZIP 파일입니다.');
 let p=u32(end+16),total=0;const files=[];
 for(let i=0;i<u16(end+10);i++){
  if(p+46>bytes.length||u32(p)!==0x02014b50)throw Error('손상된 ZIP 목록입니다.');
  const flags=u16(p+8),method=u16(p+10),size=u32(p+24),packed=u32(p+20),offset=u32(p+42),len=u16(p+28),name=new TextDecoder().decode(bytes.subarray(p+46,p+46+len));p+=46+len+u16(p+30)+u16(p+32);
  if(!/(?:^|\/)textures\/(?:items|blocks|gui)\/[^/]+\.png$/i.test(name))continue;
  if(flags&1||size>350000||files.length>=2048||(total+=size)>24*1024*1024)throw Error('텍스처 용량 또는 파일 형식을 확인하세요.');
  if(offset+30>bytes.length||u32(offset)!==0x04034b50)throw Error('손상된 ZIP 항목입니다.');
  const start=offset+30+u16(offset+26)+u16(offset+28);if(start+packed>bytes.length)throw Error('불완전한 ZIP 파일입니다.');
  let data=bytes.subarray(start,start+packed);
  if(method===8){const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),parts=[];let n=0;for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>size){await reader.cancel();throw Error('압축 데이터 크기가 올바르지 않습니다.');}parts.push(value);}data=new Uint8Array(n);let at=0;for(const part of parts){data.set(part,at);at+=part.length;}}
  else if(method!==0)throw Error('지원하지 않는 ZIP 압축 방식입니다.');
  if(data.length!==size)throw Error('압축 데이터가 손상되었습니다.');
  const png=new File([data],name.split('/').pop(),{type:'image/png'});Object.defineProperty(png,'webkitRelativePath',{value:name});files.push(png);
 }
 if(!files.length)throw Error('assets/minecraft/textures 폴더가 있는 1.8 리소스팩을 선택하세요.');return files;
}
