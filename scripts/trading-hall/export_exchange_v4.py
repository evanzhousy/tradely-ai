"""Export the baked professional exchange as a batched, textured glTF asset."""
import bpy, json, hashlib, struct
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'artifacts/trading-hall/exchange-v4'
OUT=ROOT/'apps/web/public/models/trading-hall/modern-v4'
OUT.mkdir(parents=True,exist_ok=True)
s=bpy.data.scenes['Exchange_Modern_V4'];bpy.context.window.scene=s
bake=json.loads((ART/'bake-status.json').read_text())
if bake['status']!='complete':raise RuntimeError('Complete the Cycles light bake before exporting.')

# Split the baked atlas groups by surface material without changing their UVs.
for obj in [o for o in s.objects if o.type=='MESH' and o.get('bake_map')]:
    key=obj['bake_map']
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
    for piece in bpy.context.selected_objects:piece['bake_map']=key

groups={};materials={}
for obj in list(s.objects):
    if obj.type!='MESH':continue
    used={poly.material_index for poly in obj.data.polygons}
    if len(used)!=1:raise RuntimeError('Expected a single-material export batch: '+obj.name)
    mat=obj.material_slots[next(iter(used))].material
    key=obj.get('bake_map','live')
    name='EX4_'+key+'_'+mat.name.removeprefix('EX4_')
    if name not in materials:
        copied=mat.copy();copied.name=name;materials[name]=copied
        if 'Glass' in mat.name:
            # A thin transparent approximation for the real-time window pane.
            nodes=copied.node_tree.nodes;nodes.clear()
            output=nodes.new('ShaderNodeOutputMaterial');p=nodes.new('ShaderNodeBsdfPrincipled')
            p.inputs['Base Color'].default_value=(.09,.14,.20,1)
            p.inputs['Alpha'].default_value=.17;p.inputs['Metallic'].default_value=.15;p.inputs['Roughness'].default_value=.14
            copied.node_tree.links.new(p.outputs['BSDF'],output.inputs['Surface'])
    obj.data.materials.clear();obj.data.materials.append(materials[name])
    for poly in obj.data.polygons:poly.material_index=0
    if obj.data.uv_layers:
        obj.data.uv_layers.active_index=0;obj.data.uv_layers[0].active_render=True
    groups.setdefault(name,[]).append(obj)

for name,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    obj=objects[0];obj.name=name
    key=obj.get('bake_map')
    if key:
        obj['bake_intensity']=bake['lightmaps'][key]['intensity']
    obj['material_family']=name.split('_')[-1]

path=OUT/'exchange.glb'
for image in bpy.data.images:
    if 'lightmap' in image.name.lower() or 'market' in image.name.lower():continue
    width,height=image.size
    if max(width,height)>1024:
        ratio=1024/max(width,height);image.scale(max(1,round(width*ratio)),max(1,round(height*ratio)))
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_active_scene=True,
    export_image_format='WEBP',export_image_quality=90,export_cameras=False,export_lights=False,
    export_extras=True,export_apply=True,export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,export_draco_position_quantization=20,
    export_draco_normal_quantization=10,export_draco_texcoord_quantization=16)

raw=path.read_bytes();length=struct.unpack_from('<I',raw,12)[0]
gltf=json.loads(raw[20:20+length])
for material in gltf['materials']:
    source=materials[material['name']]
    factor=list(source.get('color_factor',[1,1,1,1]))
    if source.get('color_factor'):
        material['pbrMetallicRoughness']['baseColorFactor']=factor
    p=source.node_tree.nodes.get('Principled BSDF')
    if p and p.inputs['Emission Color'].is_linked:
        strength=float(p.inputs['Emission Strength'].default_value)
        material['emissiveFactor']=[component*min(strength,1) for component in factor[:3]]
        if strength>1:material.setdefault('extensions',{})['KHR_materials_emissive_strength']={'emissiveStrength':strength}
        else:material.get('extensions',{}).pop('KHR_materials_emissive_strength',None)
    if 'Glass' in material['name']:material['alphaMode']='BLEND'

encoded=json.dumps(gltf,separators=(',',':')).encode();encoded+=b' '*(-len(encoded)%4)
binary=raw[20+length:]
path.write_bytes(struct.pack('<III',0x46546C67,2,20+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+binary)
manifest={'version':4,'style':'Professional modern, subtly voxel-inspired','scene':s.name,
 'sourceBlend':'artifacts/trading-hall/exchange-v4/exchange-modern-v4.blend',
 'bakedBlend':'artifacts/trading-hall/exchange-v4/exchange-modern-v4-baked.blend',
 'concept':'artifacts/trading-hall/exchange-v4/concept-modern.png',
 'meshCount':len(gltf['meshes']),'triangles':sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives']),
 'marketScreens':380,'tradingPosts':7,'atlas':{'columns':4,'rows':4,'tiles':16},
 'generatedTextures':['stone','wood','metal','carpet','flag'],'lightmaps':bake['lightmaps'],
 'positionQuantizationBits':20,
 'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
 'lighting':'Cycles diffuse direct and indirect lighting, exported as gamma-encoded HDR-range lightmaps; real-time PBR reflections and emissive screens.',
 'modeling':'Every physical asset authored in Blender; no third-party geometry.',
 'texturePrompts':'scripts/trading-hall/v4-modern-imagegen-prompts.json'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('EXPORTED_MODERN_V4 '+json.dumps(manifest))
