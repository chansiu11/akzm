export const DEFAULT_FOV112=70;
export function normalizeFov112(value){const n=Number(value);return value===null||value===undefined||value===''||!Number.isFinite(n)?DEFAULT_FOV112:Math.max(30,Math.min(110,Math.round(n)));}
export function fovLabel112(value,language='ko_kr'){const n=normalizeFov112(value);return n===70?(language==='en_us'?'Normal':'보통'):n===110?(language==='en_us'?'Quake Pro':'최대'):String(n);}
export function applyCameraFov112(camera,value){const fov=normalizeFov112(value);if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}return fov;}
