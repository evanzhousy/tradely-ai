"""Render the modern exchange from its authored human-eye cameras."""
import bpy, json, sys, time
from pathlib import Path

OUT=Path(__file__).resolve().parents[2]/'artifacts/trading-hall/exchange-v4'
mode=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'preview'
s=bpy.data.scenes['Exchange_Modern_V4'];bpy.context.window.scene=s
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
s.cycles.device='GPU';s.cycles.use_denoising=True;s.render.use_persistent_data=True
s.cycles.samples=40 if mode=='preview' else 128
s.render.resolution_x=1600 if mode=='preview' else 1800
s.render.resolution_y=900 if mode=='preview' else 1012
names=['00-entry'] if mode=='preview' else ['00-entry','01-workstation','02-central']
state={'status':'running','mode':mode,'started':time.time(),'completed':[]}
def report():(OUT/('modern-render-'+mode+'.json')).write_text(json.dumps(state,indent=2))
report()
try:
    for name in names:
        state['camera']=name;report();s.camera=bpy.data.objects['EX4_'+name]
        s.render.filepath=str(OUT/(name+'-modern'+('-draft' if mode=='preview' else '')+'.png'))
        bpy.ops.render.render(write_still=True);state['completed'].append(s.render.filepath);report()
    state.update(status='complete',finished=time.time());report()
except Exception as e:
    state.update(status='failed',error=str(e));report();raise
