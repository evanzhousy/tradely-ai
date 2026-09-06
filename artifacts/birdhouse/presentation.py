import bpy
from mathutils import Vector
s=bpy.context.scene
bpy.ops.object.camera_add(location=(1.55,-2.8,1.7));cam=bpy.context.object;cam.name='Birdhouse presentation camera';cam.rotation_euler=(Vector((0,0,.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.45;s.camera=cam
bpy.ops.object.light_add(type='AREA',location=(-2,-3,4));l=bpy.context.object;l.data.energy=350;l.data.shape='DISK';l.data.size=3;l.rotation_euler=(Vector((0,0,.7))-l.location).to_track_quat('-Z','Y').to_euler()
s.world=bpy.data.worlds.new('Birdhouse soft studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.65,.7,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.5
s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True;s.render.resolution_x=900;s.render.resolution_y=900;s.render.resolution_percentage=100;s.render.filepath='/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/birdhouse/preview.png'
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.region_3d.view_camera_zoom=10;area.spaces.active.overlay.show_overlays=False;area.spaces.active.shading.color_type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath='/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/birdhouse/caravan-birdhouse.blend')
print('Saved presentation')
