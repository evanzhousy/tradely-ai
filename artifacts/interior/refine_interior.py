import bpy
BASE='/Users/evansmacbookpro/Desktop/Projects/tradely'
c=bpy.data.collections['Interior']
for o in c.objects:
 if o.name.startswith(('Living room carpet','Dining carpet')):o.location.z=.055
 if o.name.startswith('Living rug'):o.location.z=.084
bpy.ops.wm.save_as_mainfile(filepath=BASE+'/artifacts/interior/interior.blend')
bpy.ops.object.select_all(action='DESELECT')
for o in c.objects:o.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in c.objects if o.type=='MESH')
bpy.ops.export_scene.gltf(filepath=BASE+'/apps/web/public/models/kirkland-house/interior.glb',export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_animations=False)
print('Floor surfaces separated and saved')
