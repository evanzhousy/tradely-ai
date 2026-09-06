"""Export the approved night scene as batched, textured glTF for the Hero.
Run in a background Blender process with exchange-human-night-v3.blend open.
The editable .blend is never overwritten by this optimization pass.
"""
import bpy, hashlib, json, struct
from pathlib import Path

ROOT = Path('/Users/evansmacbookpro/Desktop/Projects/tradely')
OUT = ROOT / 'apps/web/public/models/trading-hall/night-v3'
OUT.mkdir(parents=True, exist_ok=True)
source = bpy.data.scenes['Tradely_Exchange_Human_Night_v3']
bpy.context.window.scene = source
for obj in source.objects:
    if obj.type == 'FONT':
        obj.data.resolution_u = 2
    for modifier in list(obj.modifiers):
        if modifier.type == 'BEVEL':
            if min(obj.dimensions) < .04:
                obj.modifiers.remove(modifier)
            else:
                modifier.segments = 1
deps = bpy.context.evaluated_depsgraph_get()
export_scene = bpy.data.scenes.new('EX3_Runtime_export')
groups = {}
visible_count = 0
for obj in list(source.objects):
    if obj.type not in {'MESH', 'FONT', 'CURVE'} or obj.hide_render:
        continue
    if any(c.hide_render for c in obj.users_collection):
        continue
    evaluated = obj.evaluated_get(deps)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=deps)
    if not mesh or not mesh.polygons:
        continue
    mesh.transform(obj.matrix_world)
    materials = [slot.material for slot in obj.material_slots]
    mesh.materials.clear()
    for mat in materials:
        mesh.materials.append(mat)
    clone = bpy.data.objects.new('Runtime_' + obj.name, mesh)
    export_scene.collection.objects.link(clone)
    material = materials[0] if materials else None
    groups.setdefault(material.name if material else 'unassigned', []).append(clone)
    visible_count += 1

bpy.context.window.scene = export_scene
for name, objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    objects[0].name = name
    objects[0]['asset_role'] = 'market-displays' if name == 'EX3_Markets' else 'architecture'

# Explicit glTF-compatible PBR chains. Blender noise/mix nodes do not serialize
# as arbitrary GLSL; the runtime receives real color/roughness/normal maps.
for name, tint in [('EX3_OakPBR', (.80, .56, .26, 1)), ('EX3_FasciaPBR', (.30, .19, .10, 1))]:
    mat = bpy.data.materials[name]
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    diffuse = next(n for n in nodes if n.type == 'TEX_IMAGE' and 'Diffuse' in n.image.name)
    # glTF exporter recognizes image multiplied by a constant as baseColorFactor.
    mix = next(n for n in nodes if n.type == 'MIX_RGB')
    mix.inputs[2].default_value = tint
    for node in nodes:
        if node.type == 'TEX_IMAGE' and ('Rough' in node.image.name or 'nor_gl' in node.image.name):
            node.image.colorspace_settings.name = 'Non-Color'
    bsdf.inputs['Metallic'].default_value = 0

path = OUT / 'exchange.glb'
bpy.ops.export_scene.gltf(
    filepath=str(path), export_format='GLB', use_active_scene=True,
    export_image_format='WEBP', export_image_quality=88,
    export_cameras=False, export_lights=False, export_extras=True, export_apply=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=14,
)
# Preserve the source's Multiply-node tints as glTF baseColorFactor. Blender's
# image gathering retains the maps but omits this factor for that node graph.
raw = path.read_bytes()
json_length = struct.unpack_from('<I', raw, 12)[0]
document = json.loads(raw[20:20 + json_length])
for material in document['materials']:
    tint = {'EX3_OakPBR': [.80, .56, .26, 1], 'EX3_FasciaPBR': [.30, .19, .10, 1]}.get(material['name'])
    if tint:
        material['pbrMetallicRoughness']['baseColorFactor'] = tint
encoded = json.dumps(document, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
binary_chunk = raw[20 + json_length:]
path.write_bytes(struct.pack('<III', 0x46546C67, 2, 20 + len(encoded) + len(binary_chunk))
                 + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + binary_chunk)
manifest = {
    'version': 3, 'scene': source.name, 'file': 'exchange.glb',
    'sourceBlend': 'artifacts/trading-hall/exchange-night-v3/exchange-human-night-v3.blend',
    'sourceObjects': visible_count, 'meshes': len(export_scene.objects),
    'triangles': sum(len(o.data.loop_triangles) for o in export_scene.objects),
    'marketScreens': sum(o.get('screen_role') == 'market' for o in source.objects),
    'towerDisplayFaces': sum(o.get('screen_role') in ['flag', 'nyse'] for o in source.objects),
    'tradingPosts': 7, 'atlas': {'columns': 4, 'rows': 4, 'tiles': 16},
    'materials': list(groups), 'bytes': path.stat().st_size,
    'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
    'coordinateSystem': 'glTF Y-up; Blender (x,y,z) becomes (x,z,-y)',
    'openingCamera': {'position': [0, 1.70, 15.8], 'target': [0, 2.15, -3]},
    'lighting': 'Night practical lights reconstructed in Three.js; PBR materials exported from Blender.',
    'sourceCameras': {o.name: {'position': [o.location.x, o.location.z, -o.location.y],
                            'lensMm': o.data.lens, 'sensorMm': o.data.sensor_width}
                      for o in source.objects if o.type == 'CAMERA'},
    'textureSources': [{'id': 'natural_walnut_veneer', 'url': 'https://polyhaven.com/a/natural_walnut_veneer', 'license': 'CC0'}],
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2))
print('EXCHANGE_EXPORT ' + json.dumps(manifest))
