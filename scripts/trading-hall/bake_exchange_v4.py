"""Bake Cycles diffuse illumination into two UV atlases for real-time PBR.
Reads the editable V4 file, writes a separate prepared/baked file.
"""
import bpy, bmesh, json, math, time, sys
import numpy as np
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from denoise_lightmap import denoise_lightmap

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/trading-hall/exchange-v4'
SIZE=4096
s=bpy.data.scenes['Exchange_Modern_V4'];bpy.context.window.scene=s
state={'status':'running','phase':'prepare','started':time.time(),'lightmaps':{}}
def report():
    (OUT/'bake-status.json').write_text(json.dumps(state,indent=2))
    print('BAKE_PROGRESS '+json.dumps(state),flush=True)
report()

# Lock source-image coordinates before making a second UV layer for lighting.
for material in bpy.data.materials:
    if not material.use_nodes:continue
    nodes,links=material.node_tree.nodes,material.node_tree.links
    uv=nodes.new('ShaderNodeUVMap');uv.uv_map='UVMap'
    for node in list(nodes):
        if node.type=='TEX_IMAGE':links.new(uv.outputs['UV'],node.inputs['Vector'])

skip=('Markets','Amber','WarmTrim','DimIndicator','CityGlow','Glass','Exterior')
groups={'room':[],'stations':[]}
for obj in list(s.objects):
    if obj.type!='MESH':continue
    if any(any(token in slot.material.name for token in skip) for slot in obj.material_slots if slot.material):continue
    key='room' if obj.get('bake_group')=='Architecture' else 'stations'
    groups[key].append(obj)

targets={}
for key,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()
    obj=bpy.context.object;obj.name='EX4_Bake_'+key;obj['bake_map']=key
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bm.to_mesh(obj.data);bm.free();obj.data.update()
    obj.data.uv_layers.new(name='LightmapUV')
    obj.data.uv_layers.active_index=1
    obj.data.uv_layers[1].active_render=True
    state['phase']='unwrap-'+key;report()
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.001,area_weight=.5,correct_aspect=True,scale_to_bounds=True)
    bpy.ops.object.mode_set(mode='OBJECT')
    targets[key]=obj

bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'exchange-modern-v4-prepared.blend'))
prefs=bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type='METAL';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='METAL'
s.render.engine='CYCLES';s.cycles.device='GPU';s.cycles.samples=256
s.render.bake.use_clear=True;s.render.bake.margin=12
s.render.bake.use_pass_direct=True;s.render.bake.use_pass_indirect=True;s.render.bake.use_pass_color=False
s.render.bake.target='IMAGE_TEXTURES'

try:
    for key,obj in targets.items():
        state['phase']='bake-'+key;report()
        image=bpy.data.images.new('EX4_'+key+'_lightmap',SIZE,SIZE,float_buffer=True)
        image.colorspace_settings.name='Non-Color'
        for slot in obj.material_slots:
            material=slot.material
            if not material:continue
            nodes=material.node_tree.nodes
            node=nodes.get('Lightmap bake target') or nodes.new('ShaderNodeTexImage')
            node.name='Lightmap bake target';node.image=image
            for item in nodes:item.select=False
            node.select=True;nodes.active=node
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        obj.data.uv_layers.active_index=1;obj.data.uv_layers[1].active_render=True
        bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'})
        pixels=np.empty(SIZE*SIZE*4,dtype=np.float32);image.pixels.foreach_get(pixels)
        pixels=pixels.reshape(SIZE,SIZE,4)
        rgb=np.maximum(pixels[:,:,:3],0)
        np.save(OUT/(key+'-lightmap-linear.npy'),rgb)
        state['phase']='denoise-'+key;report()
        rgb=denoise_lightmap(rgb)
        active=rgb[np.max(rgb,axis=-1)>.00001]
        if active.size==0:raise RuntimeError('Empty lightmap: '+key)
        scale=max(1.0,float(np.ceil(np.percentile(active,99.99))))
        normalized=np.clip(rgb/scale,0,1)
        # Gamma encoding preserves dark gradients; Three.js decodes this sRGB map.
        encoded=np.where(normalized<=.0031308,normalized*12.92,1.055*np.power(normalized,1/2.4)-.055)
        pixels[:,:,:3]=encoded;pixels[:,:,3]=1
        image.pixels.foreach_set(pixels.ravel())
        image.filepath_raw=str(OUT/(key+'-lightmap.png'));image.file_format='PNG';image.save()
        image.pack()
        obj['bake_intensity']=scale*math.pi
        obj.data.uv_layers.active_index=0;obj.data.uv_layers[0].active_render=True
        state['lightmaps'][key]={'file':key+'-lightmap.png','size':SIZE,'range':scale,'intensity':scale*math.pi,'max':float(rgb.max()),'mean':float(active.mean()),'coverage':float(active.shape[0]/(SIZE*SIZE)),'samples':256,'denoiser':'OIDN RT HDR high'}
        report()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'exchange-modern-v4-baked.blend'))
    state.update(status='complete',phase='complete',finished=time.time());report()
except Exception as error:
    state.update(status='failed',error=str(error));report();raise
