import bpy
for rootname in ['GroundFloor','UpperFloor']:
 root=bpy.data.objects[rootname];root.hide_set(False)
 for child in root.children_recursive:child.hide_set(False)
 objects=[o for o in root.children_recursive if o.type=='MESH']
 root['colliders']=[list(o['collider']) for o in objects if 'collider' in o]
 for o in list(objects):
  if o.get('collisionOnly'):objects.remove(o);bpy.data.objects.remove(o,do_unlink=True)
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join()
 merged=bpy.context.object;merged.name=rootname+'Geometry'
 for key in ['collider','collisionOnly']:
  if key in merged:del merged[key]
bpy.ops.object.select_all(action='DESELECT')
for rootname in ['GroundFloor','UpperFloor']:
 root=bpy.data.objects[rootname];root.select_set(True)
 for o in root.children_recursive:o.select_set(True)
bpy.ops.export_scene.gltf(filepath='/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/public/models/kirkland-house/interior.glb',export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_animations=False)
