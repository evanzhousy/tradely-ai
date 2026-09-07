import bpy
from pathlib import Path
BASE=Path('/Users/evansmacbookpro/Desktop/Projects/tradely')
root=bpy.data.objects['Dollhouse']
bpy.ops.object.select_all(action='DESELECT')
for o in root.children:o.hide_set(False);o.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in root.children if o.type=='MESH')
bpy.ops.object.convert(target='MESH')
root.select_set(True)
out=BASE/'apps/web/public/models/dollhouse';out.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out/'dollhouse.glb'),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_animations=False,export_image_format='JPEG',export_jpeg_quality=88)
print('Exported Blender dollhouse', (out/'dollhouse.glb').stat().st_size)
