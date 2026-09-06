"""Original seamless charcoal carpet PBR maps and scoped Blender floor update."""
import bpy
import numpy as np
from pathlib import Path

ROOT = Path('/Users/evansmacbookpro/Desktop/Projects/tradely')
TEXTURES = ROOT / 'artifacts/trading-hall/exchange-night-v3/textures/carpet'
MATERIAL = 'EX3_CharcoalCarpetPBR'

def textures():
    TEXTURES.mkdir(parents=True, exist_ok=True)
    size = 1024
    rng = np.random.default_rng(20260906)
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    grain = rng.random((size, size), dtype=np.float32)
    # Periodic short loop fibers: a half-metre tile, with millimetre-scale pile.
    phase = np.sin(x * (2 * np.pi * 128 / size))
    loops = .5 + .5 * np.cos(y * (2 * np.pi * 160 / size) + phase * .22)
    yarn = (grain + np.roll(grain, 1, axis=1) + np.roll(grain, -1, axis=1)) / 3
    pile = .52 * yarn + .28 * loops + .20 * grain
    fleck = rng.random((size, size), dtype=np.float32) > .975
    luminance = .195 + (pile - .5) * .075 + fleck * .035
    color = np.stack([luminance * .95, luminance, luminance * 1.04], axis=-1)
    roughness = np.clip(.96 + (grain - .5) * .065, .90, .995)
    dx = (np.roll(pile, -1, axis=1) - np.roll(pile, 1, axis=1)) * .38
    dy = (np.roll(pile, -1, axis=0) - np.roll(pile, 1, axis=0)) * .38
    normal = np.stack([-dx, -dy, np.ones_like(dx)], axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    normal = normal * .5 + .5
    maps = {}
    for name, data, space in [('color', color, 'sRGB'), ('roughness', np.repeat(roughness[..., None], 3, axis=-1), 'Non-Color'), ('normal', normal, 'Non-Color')]:
        filename = 'charcoal_carpet_' + name + '.png'
        image = bpy.data.images.get(filename) or bpy.data.images.new(filename, size, size)
        image.colorspace_settings.name = space
        rgba = np.concatenate([data, np.ones((size, size, 1), dtype=np.float32)], axis=-1).astype(np.float32)
        image.pixels.foreach_set(rgba.ravel())
        image.filepath_raw = str(TEXTURES / filename)
        image.file_format = 'PNG'
        image.save()
        image.source = 'FILE'
        image.reload()
        image.pack()
        maps[name] = image
    return maps

def apply():
    scene = bpy.data.scenes['Tradely_Exchange_Human_Night_v3']
    maps = textures()
    material = bpy.data.materials.get(MATERIAL) or bpy.data.materials.new(MATERIAL)
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Roughness'].default_value = 1
    shader.inputs['Metallic'].default_value = 0
    shader.inputs['Specular IOR Level'].default_value = .15
    shader.inputs['Sheen Weight'].default_value = .12
    shader.inputs['Sheen Roughness'].default_value = .95
    links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    for name, socket in [('color', 'Base Color'), ('roughness', 'Roughness')]:
        tex = nodes.new('ShaderNodeTexImage')
        tex.image = maps[name]
        links.new(tex.outputs['Color'], shader.inputs[socket])
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = maps['normal']
    normal = nodes.new('ShaderNodeNormalMap')
    normal.inputs['Strength'].default_value = .7
    links.new(tex.outputs['Color'], normal.inputs['Color'])
    links.new(normal.outputs['Normal'], shader.inputs['Normal'])
    changed = []
    for name in ['EX3_Floor', 'EX3_Front floor extension']:
        obj = scene.objects[name]
        if obj.get('floor_finish') != 'charcoal-carpet':
            obj.data = obj.data.copy()
        obj.material_slots[0].link = 'OBJECT'
        obj.material_slots[0].material = material
        uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
        for loop in obj.data.loops:
            vertex = obj.matrix_world @ obj.data.vertices[loop.vertex_index].co
            uv.data[loop.index].uv = (vertex.x * 2, vertex.y * 2)
        obj['floor_finish'] = 'charcoal-carpet'
        changed.append(obj.name)
    joints = scene.objects.get('EX3_Oak plank joints')
    if joints:
        joints.hide_render = True
        joints.hide_viewport = True
    scene['floor_finish'] = 'Seamless charcoal low-pile carpet, original color/normal/roughness maps, 0.5 m repeat.'
    bpy.context.window.scene = scene
    print({'material': material.name, 'floorObjects': changed, 'woodJointsHidden': bool(joints and joints.hide_render), 'maps': list(maps)})

if __name__ == '__main__':
    apply()
