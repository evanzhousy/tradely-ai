"""Rebuild Tradely's logo-derived study companion with Blender --background --python."""
import bpy, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'apps/web/public/models/tradely-avatar'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
def material(name, color, roughness=.65):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=roughness
    return m
yellow=material('Warm logo yellow',(1,.66,.045)); white=material('Warm ivory eyes',(.98,.97,.92)); black=material('Ink pupils',(.012,.014,.013))
def sphere(name, loc, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=24, location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o
sphere('Body',(0,0,0),(.83,.58,1.03),yellow)
sphere('LeftWing',(-.72,-.05,-.42),(.24,.30,.49),yellow).rotation_euler[1]=-.28
sphere('RightWing',(.72,-.05,-.42),(.20,.28,.45),yellow).rotation_euler[1]=.28
sphere('EyeLeft',(-.29,-.49,.33),(.34,.16,.38),white)
sphere('EyeRight',(.28,-.50,.24),(.34,.16,.37),white)
sphere('PupilLeft',(-.23,-.646,.32),(.093,.055,.105),black)
sphere('PupilRight',(.32,-.65,.22),(.093,.055,.105),black)
# Blender Z-up exports to glTF Y-up; the logo's face points toward +Z in the player.
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/brand/tradely-avatar.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'tradely-avatar.glb'),export_format='GLB')
