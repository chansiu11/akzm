#!/usr/bin/env python3
"""One-time local extraction of a user's own 1.8.9.jar texture images.

This writes private files to local-resources/ which is gitignored. Never commit
or publish the extracted Minecraft artwork in a public repository.
"""
import argparse
import json
from pathlib import Path, PurePosixPath
import shutil
from zipfile import ZipFile, BadZipFile

ROOT = Path(__file__).resolve().parents[1]
PREFIX = ('assets', 'minecraft', 'textures')

def prepare(jar: Path, output: Path) -> dict:
    if not jar.is_file():
        raise FileNotFoundError(f'JAR not found: {jar}')
    output.mkdir(parents=True, exist_ok=True)
    paths=[]
    with ZipFile(jar) as archive:
        for member in archive.infolist():
            p = PurePosixPath(member.filename)
            parts = p.parts
            if member.is_dir() or len(parts)<5 or parts[:3]!=PREFIX:
                continue
            if p.suffix.lower()!='.png' or '..' in parts or '\\' in member.filename:
                continue
            # Reject anomalously large entries to avoid accidental expansion bombs.
            if member.file_size>16*1024*1024:
                continue
            target = output.joinpath(*parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(member) as source, target.open('wb') as dest:
                shutil.copyfileobj(source,dest)
            paths.append(p.as_posix())
    if not paths:
        raise ValueError('The supplied archive has no assets/minecraft/textures/**/*.png files.')
    manifest={'format':1,'source':'local-user-supplied-jar','paths':sorted(paths)}
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return {'textures':len(paths),'block_slots':sum('assets/minecraft/textures/blocks/'+n+'.png' in paths for n in (
        'grass_top','dirt','stone','sand','log_oak','leaves_oak','planks_oak','water_still','cobblestone','coal_ore','snow','brick','bedrock','grass_side','log_oak_top','glass'))}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('jar',type=Path,help='Path to your local Minecraft 1.8.9 client JAR')
    parser.add_argument('--output',type=Path,default=ROOT/'local-resources',help='Local private output directory (default: repository/local-resources)')
    args=parser.parse_args()
    try:
        report=prepare(args.jar,args.output)
    except (FileNotFoundError,BadZipFile,ValueError) as err:
        parser.error(str(err))
    print(f"Extracted {report['textures']} texture PNGs; {report['block_slots']}/16 in-game atlas slots found. Output: {args.output}")
    print('These are copyrighted game assets. Keep this folder private; do not commit or deploy it publicly.')
