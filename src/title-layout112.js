// Logical GUI coordinates; independent of the larger touch gameplay controls.
export function titleLayout112(width,height,requested=0){
 const automatic=Math.max(1,Math.min(Math.floor(width/320),Math.floor(height/240)));const scale=requested>0?Math.max(1,Math.min(automatic,Math.floor(requested))):automatic;
 const w=Math.ceil(width/scale),h=Math.ceil(height/scale);
 return {scale,width:w,height:h,logoX:Math.floor(w/2)-137,logoY:30,buttonX:Math.floor(w/2)-100,buttonY:Math.floor(h/4)+48};
}
export function installTitleLayout112(root=document.documentElement){
 const resize=()=>{const l=titleLayout112(innerWidth,innerHeight,Number(root.getAttribute('data-gui-scale112'))||0);root.style.setProperty('--menu-scale',l.scale);root.style.setProperty('--title-x',l.logoX+'px');root.style.setProperty('--title-buttons-x',l.buttonX+'px');root.style.setProperty('--title-buttons-y',l.buttonY+'px');root.style.setProperty('--title-language-x',(l.buttonX-24)+'px');root.style.setProperty('--title-language-y',(l.buttonY+84)+'px');};
 resize();root.addEventListener('gui-scale112',resize);window.addEventListener('resize',resize);return resize;
}
