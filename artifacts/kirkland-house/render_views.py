import bpy
s=bpy.context.scene
out='/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/kirkland-house/'
for cam,filename in [('01 Front three-quarter','house-preview.png'),('02 Front elevation','front-view.png'),('03 Roof overview','roof-view.png')]:
 s.camera=bpy.data.objects[cam];s.render.filepath=out+filename;bpy.ops.render.render(write_still=True)
