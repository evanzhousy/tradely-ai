import bpy
from mathutils import Vector
s=bpy.context.scene
for o in bpy.data.objects['UpperFloor'].children_recursive:o.hide_set(True)
for o in bpy.data.objects['GroundFloor'].children_recursive:o.hide_set(False)
bpy.ops.object.camera_add(location=(12,-15,14));cam=bpy.context.object;cam.name='Interior overview camera';cam.rotation_euler=(Vector((0,0,.6))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=17;s.camera=cam
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.region_3d.view_camera_zoom=5;area.spaces.active.shading.color_type='MATERIAL';area.spaces.active.overlay.show_overlays=False
bpy.ops.wm.save_as_mainfile(filepath='/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/interior/interior.blend')
print('Editable interior saved, GroundFloor visible. Unhide UpperFloor children to inspect upstairs.')
