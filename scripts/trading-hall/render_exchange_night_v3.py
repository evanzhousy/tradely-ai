"""Normalize and render the eye-level night exchange in a separate Blender process."""
import bpy, json, sys, time
from pathlib import Path
OUT = Path('/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/trading-hall/exchange-night-v3')
SCENE = 'Tradely_Exchange_Human_Night_v3'
mode = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'draft'
s = bpy.data.scenes[SCENE]
bpy.context.window.scene = s
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == 'METAL'
s.cycles.device = 'GPU' if any(d.use for d in prefs.devices) else 'CPU'
cameras = sorted((o for o in s.objects if o.type == 'CAMERA'), key=lambda o: o.name)
s.render.resolution_x, s.render.resolution_y = (1280, 674) if mode == 'draft' else (1800, 948)
s.cycles.samples = 40 if mode == 'draft' else 96
s.camera = cameras[0]
if mode == 'final':
    for other in list(bpy.data.scenes):
        if other != s:
            bpy.data.scenes.remove(other)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                area.spaces.active.region_3d.view_perspective = 'CAMERA'
                area.spaces.active.shading.type = 'MATERIAL'
                area.spaces.active.shading.use_scene_lights = True
                area.spaces.active.shading.use_scene_world = True
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'exchange-human-night-v3.blend'))
report = {'status': 'running', 'mode': mode, 'started': time.time(), 'completed': [],
          'device': s.cycles.device, 'samples': s.cycles.samples,
          'resolution': [s.render.resolution_x, s.render.resolution_y]}
def record():
    (OUT / ('render-' + mode + '-status.json')).write_text(json.dumps(report, indent=2))
record()
try:
    for camera in cameras:
        report['current'] = camera.name
        record()
        s.camera = camera
        s.render.filepath = str(OUT / 'renders' / (camera.name[4:] + ('-draft' if mode == 'draft' else '') + '.png'))
        bpy.ops.render.render(write_still=True)
        report['completed'].append(s.render.filepath)
        record()
    report.update(status='complete', finished=time.time())
    record()
except Exception as e:
    report.update(status='failed', error=str(e))
    record()
    raise
