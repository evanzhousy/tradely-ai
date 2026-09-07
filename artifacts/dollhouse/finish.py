import bpy, math
from mathutils import Vector
from pathlib import Path
BASE=Path('/Users/evansmacbookpro/Desktop/Projects/tradely');OUT=BASE/'artifacts/dollhouse'
s=bpy.context.scene;root=bpy.data.objects['Dollhouse'];c=bpy.data.collections['DH Structure']
white=bpy.data.materials['DH Ivory plastic'];pink=bpy.data.materials['DH Hot pink plastic']
def box(n,loc,size,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name='DH '+n;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for cc in list(o.users_collection):cc.objects.unlink(o)
 c.objects.link(o);o.parent=root;o.data.materials.append(m);return o
def beam(n,a,b,w,m):
 a,b=Vector(a),Vector(b);o=box(n,(a+b)/2,(w,w,(b-a).length),m);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
for o in list(root.children):
 if o.name.startswith(('DH Magenta roof fascia','DH White window jamb','DH White window rail','DH Window mullion')):bpy.data.objects.remove(o,do_unlink=True)
for y in [-1.01,1.01]:
 a,b=Vector((-2.43,y,6.15)),Vector((.57,y,6.88));o=box('Flat magenta roof fascia',(a+b)/2,((b-a).length,.09,.20),pink);o.rotation_euler.y=-math.atan2(b.z-a.z,b.x-a.x)
a,b=Vector((.57,.94,6.88)),Vector((2.0,.94,6.3));o=box('Right rear fascia',(a+b)/2,((b-a).length,.09,.20),pink);o.rotation_euler.y=-math.atan2(b.z-a.z,b.x-a.x)
o=bpy.data.objects['DH Right sloping roof']
for v in o.data.vertices:
 if v.co.y<0:v.co.y=.1
for o in root.children:
 if o.name.startswith('DH Front structural column') and o.location.x>-.1:o.dimensions.x=.075;o.dimensions.y=.09
 if o.name.startswith('DH Dining pink door panel'):o.dimensions.x=.045;o.dimensions.y=.50;o.location.y=.37
 if o.name.startswith('DH Clear pool'):o.scale.z*=1.3
 if o.name.startswith('DH Aqua water'):o.location.z=2.47
# The window follows the sloping roof instead of poking through it.
for x in [-2.13,-1.33,-.53,.27]:
 top=6.13+(x+2.13)*.245;beam('Bedroom window upright',(x,.87,5.08),(x,.87,top),.05,white)
beam('Bedroom window sill',(-2.13,.87,5.08),(.27,.87,5.08),.065,white)
beam('Bedroom sloped window header',(-2.13,.87,6.13),(.27,.87,6.718),.065,white)
for x in [-2.12,-1.32,-.52,.28]:beam('Living window upright',(x,.87,3.32),(x,.87,4.12),.055,white)
for z in [3.32,3.72,4.12]:beam('Living window horizontal',(-2.12,.87,z),(.28,.87,z),.055,white)
# Bedcover and walls share the custom atlas with separate quadrant UV islands.
image=bpy.data.images.load(str(OUT/'textures/pattern-atlas.png'),check_existing=True)
materials={}
for o in list(root.children):
 if o.type!='MESH' or 'texture_quadrant' not in o:continue
 q=int(o['texture_quadrant'])
 if q not in materials:
  m=bpy.data.materials.new('DH Atlas '+str(q));m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.72 if q==0 else .42;tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);materials[q]=m
 o.data.materials.clear();o.data.materials.append(materials[q]);uv=o.data.uv_layers.active or o.data.uv_layers.new()
 minimum=[min(v.co[k] for v in o.data.vertices) for k in range(3)];maximum=[max(v.co[k] for v in o.data.vertices) for k in range(3)]
 for face in o.data.polygons:
  skip=max(range(3),key=lambda k:abs(face.normal[k]));axes=[k for k in range(3) if k!=skip]
  for index in face.loop_indices:
   v=o.data.vertices[o.data.loops[index].vertex_index].co
   u=(v[axes[0]]-minimum[axes[0]])/max(.0001,maximum[axes[0]]-minimum[axes[0]])
   vv=(v[axes[1]]-minimum[axes[1]])/max(.0001,maximum[axes[1]]-minimum[axes[1]])
   uv.data[index].uv=(.015+.47*u+(q%2)*.5,.015+.47*vv+(.5 if q<2 else 0))
# Saturated toy palette and a reference-like near-frontal camera.
p=pink.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.65,.002,.16,1)
glass=bpy.data.materials['DH Clear aqua panels'];p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.09,.65,.72,1);p.inputs['Transmission Weight'].default_value=.45
cam=s.camera;cam.location=(4,-24,8);cam.rotation_euler=(Vector((.65,0,3.38))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=8.55
s.render.resolution_x=1100;s.render.resolution_y=1200;s.cycles.samples=48;s.render.filepath=str(OUT/'final.png')
for im in bpy.data.images:
 if im.source=='FILE' and im.filepath and ('dollhouse' in im.filepath or 'Plastic001' in im.filepath):im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dollhouse.blend'))
print('Refined geometry, applied atlas and packed textures.')
