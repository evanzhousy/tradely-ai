import bpy,json,time,sys
from pathlib import Path
OUT=Path('/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/trading-hall/exchange-v2')
SCENE='Tradely_Exchange_Documentary_v2'
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
mode=args[0] if args else 'draft'
s=bpy.data.scenes.get(SCENE) or bpy.context.scene
bpy.context.window.scene=s
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type='METAL';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='METAL'
    s.cycles.device='GPU'
except Exception:s.cycles.device='CPU'
s.render.engine='CYCLES';s.cycles.use_denoising=True
s.render.image_settings.file_format='PNG'
s.render.resolution_percentage=100
if mode=='draft':names=['00-master'];s.cycles.samples=32;s.render.resolution_x=1280;s.render.resolution_y=674
else:names=['00-master','01-reverse-balcony','02-central-aisle','03-workstation-close','04-side-overview'];s.cycles.samples=64;s.render.resolution_x=1600;s.render.resolution_y=842
s.render.use_persistent_data=True
if mode=='final':
    for other in list(bpy.data.scenes):
        if other!=s:bpy.data.scenes.remove(other)
    s.camera=bpy.data.objects['EX2_00-master']
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective='CAMERA'
                area.spaces.active.shading.type='MATERIAL'
                area.spaces.active.shading.use_scene_lights=True
                area.spaces.active.shading.use_scene_world=True
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'exchange-documentary-v2.blend'))
state={'mode':mode,'status':'running','started':time.time(),'completed':[],'device':s.cycles.device}
def record(): (OUT/('render-'+mode+'-status.json')).write_text(json.dumps(state,indent=2))
record()
try:
    for name in names:
        state['current']=name;record()
        s.camera=bpy.data.objects['EX2_'+name]
        s.render.filepath=str(OUT/'renders'/(name+('-draft' if mode=='draft' else '')+'.png'))
        bpy.ops.render.render(write_still=True)
        state['completed'].append(s.render.filepath);record()
    state['status']='complete';state['finished']=time.time();record()
except Exception as e:
    state['status']='failed';state['error']=str(e);record();raise
