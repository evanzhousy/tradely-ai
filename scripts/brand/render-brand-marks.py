"""Render every website mark from the canonical owl, without maintaining a second design.
Run after build-avatar.py with Blender --background --python scripts/brand/render-brand-marks.py.
"""
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT / 'docs/brand/tradely-avatar.blend'))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.world.color = (.35, .35, .35)
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
bpy.data.objects['HeadPivot'].rotation_euler = (0, 0, 0)
bpy.ops.object.camera_add(location=(0, -5, .15))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 2.55
scene.camera = camera
for name, location, power, size in [
    ('Key', (-3, -4, 5), 420, 5),
    ('Fill', (3, -2, 2), 190, 4),
    ('Rim', (0, 3, 3), 250, 3),
]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = power
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, 0)) - light.location).to_track_quat('-Z', 'Y').to_euler()
for name, size in [
    ('tradely-mark.png', 1254),
    ('tradely-mark-128.png', 128),
    ('tradely-favicon-64.png', 64),
    ('tradely-apple-touch-icon.png', 180),
]:
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.filepath = str(ROOT / 'apps/web/public/brand' / name)
    bpy.ops.render.render(write_still=True)
