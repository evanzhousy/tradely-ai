"""Package generated/baked image assets without changing the editable source."""
from pathlib import Path
from PIL import Image
import json, shutil, hashlib

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'artifacts/trading-hall/exchange-v4'
OUT=ROOT/'apps/web/public/models/trading-hall/modern-v4'
OUT.mkdir(parents=True,exist_ok=True)
for group in ['room','stations']:
    image=Image.open(ART/(group+'-lightmap.png')).convert('RGB')
    image.save(OUT/(group+'-lightmap.webp'),quality=97,method=6)
    image.resize((2048,2048),Image.Resampling.LANCZOS).save(OUT/(group+'-lightmap-2k.webp'),quality=95,method=6)
Image.open(ART/'00-entry-modern.png').convert('RGB').save(OUT/'poster.webp',quality=90,method=6)
decoder=ROOT/'apps/web/public/models/trading-hall/draco';decoder.mkdir(exist_ok=True)
for name in ['draco_decoder.wasm','draco_wasm_wrapper.js']:
    shutil.copy2(ROOT/'apps/web/node_modules/three/examples/jsm/libs/draco/gltf'/name,decoder/name)
manifest_path=OUT/'manifest.json';manifest=json.loads(manifest_path.read_text())
manifest['runtimeImages']={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in OUT.glob('*.webp')}
for group,spec in manifest['lightmaps'].items():
    spec.update(file=group+'-lightmap.webp',compactFile=group+'-lightmap-2k.webp',colorSpace='sRGB',channel=1)
manifest_path.write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest['runtimeImages'],indent=2))
