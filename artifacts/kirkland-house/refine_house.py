import bpy, math
from mathutils import Vector
scene=bpy.context.scene
# Restrict upper-storey siding to wall extents rather than bridging the open apron.
for o in scene.objects:
 if o.name.startswith('Right elevation lap') and o.location.z>3.08:
  o.location.y=6.0;o.dimensions.y=8.6
 if o.name.startswith(('Front door','Entry door jamb','Entry lintel','Door inset panel','Door knob','Porch lamp base')):o.location.y-=1.05
# Break front main-roof fascia at the projecting gable.
for o in list(scene.objects):
 if o.name.startswith('Main eave fascia') and abs(o.location.y-1.23)<.05:
  bpy.data.objects.remove(o,do_unlink=True)
C=bpy.data.collections['04 Trim and masonry'];trim=bpy.data.materials['Painted ivory trim']
def box(name,loc,size,ma):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for c in list(o.users_collection):c.objects.unlink(o)
 C.objects.link(o);o.data.materials.append(ma);m=o.modifiers.new('Edge highlights','BEVEL');m.width=.008;m.segments=2;return o
box('Left main fascia return',(-3.77,1.23,6),(2.26,.16,.16),trim)
box('Right main fascia return',(3.10,1.23,6),(.98,.16,.16),trim)
# Fine siding on the left entry elevation and front bedroom sides.
siding=bpy.data.materials['Warm olive cream | horizontal clapboard']
for i in range(13):
 z=3.2+i*.2
 for x in [-2.3,2.3]:box('Bedroom side siding',(x,1.28,z),(.035,.69,.024),siding)
# Use darker, less exaggerated roof texture.
roof=bpy.data.materials['Charcoal asphalt shingles'];roof.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.055,.068,.075,1)
for n in roof.node_tree.nodes:
 if n.type=='BUMP':n.inputs['Strength'].default_value=.23;n.inputs['Distance'].default_value=.02
# Detail context garage so the shared architecture reads clearly.
C=bpy.data.collections['06 Context']
for row in range(4):
 for col in range(6):box('Neighbor door panel',(-9.5+col*.76,-.2,.35+row*.57),(.61,.04,.40),trim)
# An unobtrusive fill under the recessed canopy.
C=bpy.data.collections['07 Cameras and lighting']
bpy.ops.object.light_add(type='AREA',location=(-4,-1,2.25));o=bpy.context.object;o.name='Entry daylight fill';o.data.energy=35;o.data.size=2;o.rotation_euler=(Vector((-4,1.7,1.2))-o.location).to_track_quat('-Z','Y').to_euler()
for c in list(o.users_collection):c.objects.unlink(o)
C.objects.link(o)
# Better front comparison camera: target unit centered, adjacent context at edges.
o=bpy.data.objects['02 Front elevation'];o.location=(-1,-24,6);o.rotation_euler=(Vector((-.8,1.3,3.2))-o.location).to_track_quat('-Z','Y').to_euler();o.data.ortho_scale=13.5
scene.cycles.samples=48
scene.render.filepath='/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/kirkland-house/house-preview.png'
bpy.ops.object.select_all(action='DESELECT')
scene['model_scope']='Editable exterior, facade details, approximate roof volumes, porch, garage, landscaping and optional attached-neighbor context. Existing starting scene retained.'
bpy.ops.wm.save_as_mainfile(filepath='/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/kirkland-house/8311-kirkland-house.blend')
print('Refined exterior:',len(scene.objects),'objects. Packed references:',[(im.name,bool(im.packed_file)) for im in bpy.data.images if im.packed_file])
