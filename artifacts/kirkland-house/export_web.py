import bpy
from pathlib import Path
scene=bpy.context.scene
bpy.ops.object.select_all(action='DESELECT')
for c in list(scene.collection.children):
 objs=[o for o in c.objects if o.type in {'MESH','FONT'}]
 if not objs:continue
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0]
 bpy.ops.object.convert(target='MESH')
 bpy.ops.object.join()
 merged=bpy.context.object
 merged.name=c.name[3:]
 merged['layer']=merged.name
 bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:o.select_set(o.type=='MESH')
out=Path('/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/public/models/kirkland-house/house.glb')
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False,export_animations=False,export_apply=True)
print('Exported',out.stat().st_size,'bytes')
