import zipfile,json,base64,hashlib,pathlib,sys
source=pathlib.Path(sys.argv[1]);out=pathlib.Path('public/builtin-pack');out.mkdir(exist_ok=True)
textures={};models={};states={};manifest=[]
with zipfile.ZipFile(source) as z:
 for n in z.namelist():
  if not n.startswith('assets/minecraft/') or n.endswith('/'):continue
  key=n[len('assets/minecraft/'):]
  if key.startswith('textures/'):
   data=z.read(n);manifest.append({'path':key,'size':len(data),'sha256':hashlib.sha256(data).hexdigest()})
   textures[key]='data:image/png;base64,'+base64.b64encode(data).decode() if key.endswith('.png') else data.decode('utf-8')
  elif key.startswith('models/'):models[key[7:-5]]=json.loads(z.read(n))
  elif key.startswith('blockstates/'):states[key[12:-5]]=json.loads(z.read(n))
# Small JSON bundles retain every original texture byte without thousands of HTTP requests.
parts=[];batch={};size=0
for k,v in sorted(textures.items()):
 if size+len(v)>180000 and batch:
  name=f'textures-{len(parts):02}.json';(out/name).write_text(json.dumps(batch,separators=(',',':')));parts.append(name);batch={};size=0
 batch[k]=v;size+=len(v)
if batch:
 name=f'textures-{len(parts):02}.json';(out/name).write_text(json.dumps(batch,separators=(',',':')));parts.append(name)
(out/'models.json').write_text(json.dumps(models,separators=(',',':')))
(out/'blockstates.json').write_text(json.dumps(states,separators=(',',':')))
(out/'manifest.json').write_text(json.dumps({'source':'User supplied 1.8.9.jar','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'parts':parts,'textures':manifest,'modelCount':len(models),'blockstateCount':len(states)},separators=(',',':')))
print(json.dumps({'textureFiles':len(textures),'png':sum(k.endswith('.png') for k in textures),'parts':len(parts),'models':len(models),'blockstates':len(states)}))
