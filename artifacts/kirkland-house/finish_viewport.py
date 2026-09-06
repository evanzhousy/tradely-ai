import bpy
s=bpy.context.scene
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':
  area.spaces.active.overlay.show_overlays=False
  area.spaces.active.region_3d.view_camera_zoom=15
  area.spaces.active.shading.light='STUDIO'
  area.spaces.active.shading.color_type='MATERIAL'
  area.spaces.active.shading.show_shadows=True
  area.spaces.active.shading.show_cavity=True
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('Saved final viewport and scene.')
