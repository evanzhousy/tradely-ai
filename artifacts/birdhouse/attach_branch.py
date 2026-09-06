import bpy
from mathutils import Vector
c=bpy.data.collections['Birdhouse'];a=Vector((-.56,.47,2.04));b=Vector((.075,-.05,2.05))
bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=.028,radius2=.016,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.name='Tree support branch';o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
for cc in list(o.users_collection):cc.objects.unlink(o)
c.objects.link(o);o.data.materials.append(bpy.data.materials['Twisted jute'])
bpy.ops.wm.save_as_mainfile(filepath='/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/birdhouse/caravan-birdhouse.blend')
bpy.ops.object.select_all(action='DESELECT')
for o in c.objects:o.select_set(True)
bpy.context.view_layer.objects.active=next(iter(c.objects));bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath='/Users/evansmacbookpro/Desktop/Projects/tradely/apps/web/public/models/kirkland-house/birdhouse.glb',export_format='GLB',use_selection=True,export_animations=False)
print('Attached branch and exported')
