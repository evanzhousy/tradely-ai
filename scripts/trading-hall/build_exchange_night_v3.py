"""Create a separate eye-level night scene from the preserved documentary V2."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector

ROOT = Path('/Users/evansmacbookpro/Desktop/Projects/tradely')
OUT = ROOT / 'artifacts/trading-hall/exchange-night-v3'
SCENE = 'Tradely_Exchange_Human_Night_v3'
PREFIX = 'EX3_'
CAMERAS = [
    ('00-entry-human', (0, -15.8, 1.70), (0, 3, 2.15), 45),
    ('01-west-aisle', (-11.4, -10.8, 1.68), (-2, 4, 2.15), 50),
    ('02-central-crossing', (4.2, -.2, 1.70), (4.0, 9.0, 2.20), 48),
    ('03-workstation-human', (0, -8.0, 1.67), (2.2, -2.2, 2.20), 55),
    ('04-rear-walkway', (1.0, 18.1, 1.70), (-1, 4, 2.40), 48),
]
POSTS = [((-6.2, -6.2), 4.0), ((5.8, -6.6), 4.2), ((0, 3), 3.7),
         ((-8, 5.2), 3.25), ((8, 5.6), 3.25), ((-5.4, 13), 3.1), ((4.9, 13.2), 3.1)]

def clone_scene():
    if bpy.data.scenes.get(SCENE):
        raise RuntimeError('Night scene exists; resume its lighting/camera phase.')
    base = bpy.data.scenes['Tradely_Exchange_Documentary_v2']
    s = bpy.data.scenes.new(SCENE)
    s.unit_settings.system = 'METRIC'
    s.world = base.world.copy()
    s.world.name = PREFIX + 'Night environment'
    mapping, materials = {}, {}

    def clone_collection(src, parent):
        dest = bpy.data.collections.new(src.name.replace('EX2_', PREFIX, 1))
        parent.children.link(dest)
        dest.hide_render, dest.hide_viewport = src.hide_render, src.hide_viewport
        for original in src.objects:
            if original.type in {'CAMERA', 'LIGHT'}:
                continue
            if original not in mapping:
                obj = original.copy()
                obj.name = original.name.replace('EX2_', PREFIX, 1)
                obj['source_object'] = original.name
                # Geometry remains shared and immutable. Object-linked material
                # copies isolate all night shader edits from the original scene.
                for slot in obj.material_slots:
                    source_mat = slot.material
                    if not source_mat:
                        continue
                    if source_mat not in materials:
                        materials[source_mat] = source_mat.copy()
                        materials[source_mat].name = source_mat.name.replace('EX2_', PREFIX, 1)
                    slot.link = 'OBJECT'
                    slot.material = materials[source_mat]
                mapping[original] = obj
            dest.objects.link(mapping[original])
        for child in src.children:
            clone_collection(child, dest)

    for c in base.collection.children:
        clone_collection(c, s.collection)
    for original, obj in mapping.items():
        if original.parent:
            obj.parent = mapping.get(original.parent)
    bpy.context.window.scene = s
    s['reference'] = base.get('reference', '')
    s['units_note'] = base.get('units_note', '')
    s['background_figures'] = base.get('background_figures', '')
    s['direction'] = 'Standing human eye level, after dark, practical overhead and workstation lighting.'
    s['phases'] = 'isolated_night_scene'
    print('Created night scene with', len(s.objects), 'preserved geometry objects.')

def scene():
    s = bpy.data.scenes[SCENE]
    bpy.context.window.scene = s
    return s

def area(group, name, loc, target, power, color, width, height):
    d = bpy.data.lights.new(PREFIX + name, 'AREA')
    d.energy, d.color, d.shape, d.size, d.size_y = power, color, 'RECTANGLE', width, height
    o = bpy.data.objects.new(d.name, d)
    group.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
    return o

def lighting_and_cameras():
    s = scene()
    if s.get('night_lighting_ready'):
        raise RuntimeError('Night lighting already built.')
    g = bpy.data.collections.new(PREFIX + 'Night lighting and human cameras')
    s.collection.children.link(g)
    world = s.world.node_tree.nodes.get('Background')
    world.inputs['Color'].default_value = (.025, .035, .055, 1)
    world.inputs['Strength'].default_value = .008
    for name, strength in [('Fixture', 4.0), ('Markets', 1.5), ('Flag', 1.05), ('NYSE', 1.05)]:
        p = bpy.data.materials[PREFIX + name].node_tree.nodes.get('Principled BSDF')
        p.inputs['Emission Strength'].default_value = strength
        if name == 'Fixture':
            p.inputs['Emission Color'].default_value = (1, .90, .80, 1)
    # Every key light is aligned with an existing visible ceiling luminaire.
    for y in [-12, -5, 2, 9, 16]:
        for x in [-12, -6, 0, 6, 12]:
            area(g, 'Ceiling practical', (x, y, 8.81), (x, y, 0), 135, (1, .90, .80), 1.92, .22)
    # Small under-canopy task lights illuminate actual worktops without luminous
    # decorative rings. Their housings sit behind the upper monitor row.
    for post, (center, radius) in enumerate(POSTS):
        for i in range(8):
            a = i * math.tau / 8
            x, y = center[0] + (radius - .12) * math.cos(a), center[1] + (radius - .12) * math.sin(a)
            o = area(g, 'Desk practical %02d' % post, (x, y, 2.54), (x, y, 1.0), 5.5, (1, .89, .76), .66, .07)
            o.rotation_euler.z = a + math.pi / 2
    for name, location, target, lens in CAMERAS:
        data = bpy.data.cameras.new(PREFIX + name)
        cam = bpy.data.objects.new(data.name, data)
        g.objects.link(cam)
        cam.location = location
        cam.rotation_euler = (Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler()
        data.lens, data.sensor_width, data.clip_start, data.clip_end = lens, 70, .05, 150
        cam['eye_height_m'] = location[2]
        cam['view_intent'] = 'standing human viewpoint; no balcony or elevated overview'
    s.camera = bpy.data.objects[PREFIX + CAMERAS[0][0]]
    s.render.engine = 'CYCLES'
    s.cycles.samples, s.cycles.use_denoising = 96, True
    s.cycles.max_bounces, s.cycles.diffuse_bounces, s.cycles.glossy_bounces = 8, 4, 4
    s.cycles.transmission_bounces = 6
    s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = 1800, 948, 100
    s.render.image_settings.file_format = 'PNG'
    s.render.film_transparent = False
    s.render.use_persistent_data = True
    s.view_settings.view_transform = 'AgX'
    s.view_settings.exposure = .3
    s['night_lighting_ready'] = True
    s['phases'] += ' practical_night_lighting five_human_cameras'
    print('Five eye-level cameras; no daylight lights, dark exterior, 81 practical lights.')

def save():
    s = scene()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'renders').mkdir(exist_ok=True)
    bpy.data.libraries.write(str(OUT / 'exchange-human-night-v3.blend'), {s}, fake_user=True)
    print('Saved isolated night scene library to', OUT)

def carpet_floor():
    import runpy
    runpy.run_path(str(ROOT / 'scripts/trading-hall/apply_carpet_floor.py'))['apply']()
