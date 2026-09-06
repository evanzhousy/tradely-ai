import bpy, math, random
from mathutils import Vector
random.seed(19)
OUT='/Users/evansmacbookpro/Desktop/Projects/tradely'
scene=bpy.data.scenes.new('彩色房车鸟巢 | Caravan birdhouse');bpy.context.window.scene=scene
col=bpy.data.collections.new('Birdhouse');scene.collection.children.link(col)
def move(o,name,m=None):
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.name=name
 if m:o.data.materials.append(m)
 return o
def mat(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.83;return m
turq=mat('Hand painted turquoise',(.07,.58,.54));pink=mat('Rose pink paint',(.8,.12,.32));yellow=mat('Lemon yellow paint',(.83,.69,.025));purple=mat('Lavender door',(.37,.28,.66));white=mat('Ivory painted rim',(.89,.9,.77));wood=mat('Unpainted wood inside',(.27,.16,.055));rope=mat('Twisted jute',(.36,.29,.18));dark=mat('Interior shadow',(.07,.04,.012))
def box(n,loc,size,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=move(bpy.context.object,n,m);o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return o
def mesh(n,verts,faces,m):
 me=bpy.data.meshes.new(n);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(n,me);col.objects.link(o);o.data.materials.append(m);return o
def cylinder(n,a,b,r,m):
 a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=(b-a).length,location=(a+b)/2);o=move(bpy.context.object,n,m);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def path(n,pts,r,m):
 cu=bpy.data.curves.new(n,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=3;sp=cu.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,co in zip(sp.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(n,cu);col.objects.link(o);cu.materials.append(m);return o
outline=[]
for cx,cz,start in [(.36,.73,0),(-.36,.73,90),(-.36,.31,180),(.36,.31,270)]:
 for i in range(13):
  a=math.radians(start+i*90/12);outline.append((cx+.22*math.cos(a),cz+.22*math.sin(a)))
def plate(n,y,depth,m):
 verts=[(x,y,z) for x,z in outline]+[(x,y+depth,z) for x,z in outline];N=len(outline)
 return mesh(n,verts,[tuple(range(N-1,-1,-1)),tuple(range(N,2*N))]+[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)],m)
front=plate('Turquoise front wooden panel',-.22,.04,turq);back=plate('Pink rear wooden panel',.21,.035,pink)
N=len(outline)
for i in range(N):
 j=(i+1)%N;x,z=outline[i];xx,zz=outline[j]
 mesh('Curved outer shell',[(x,-.18,z),(xx,-.18,zz),(xx,.21,zz),(x,.21,z)],[(0,1,2,3)],yellow if x>.53 else turq)
for y in [-.226,.249]:path('White edge piping',[(x,y,z) for x,z in outline]+[(outline[0][0],y,outline[0][1])],.01,white)
# Actual openings cut through the wood, with a dark cavity behind them.
def cut(obj,cutter):
 bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('Opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
door=box('Lavender entry panel',(.22,-.256,.40),(.33,.055,.55),purple)
for o in [front,door]:cut(o,cylinder('Round entry cutter',(.22,-.5,.56),(.22,.08,.56),.121,wood))
for x in [-.37,-.18]:
 cut(front,box('Window cutter',(x,-.23,.64),(.14,.22,.17),wood))
 for dx in [-.079,.079]:box('Yellow window vertical',(x+dx,-.249,.64),(.02,.02,.205),yellow)
 for dz in [-.094,.094]:box('Yellow window horizontal',(x,-.249,.64+dz),(.17,.02,.02),yellow)
box('Window sill',(-.275,-.25,.511),(.4,.04,.04),yellow)
path('Wood entry inner rim',[(.22+.122*math.cos(i*math.tau/64),-.29,.56+.122*math.sin(i*math.tau/64)) for i in range(65)],.009,wood)
cylinder('Purple bird perch',(.22,-.27,.29),(.22,-.51,.24),.03,purple)
box('Dark internal rear lining',(0,.185,.48),(.8,.015,.6),dark)
cylinder('White caravan wheel',(-.34,-.22,.20),(-.34,-.29,.20),.112,white)
cylinder('Yellow wheel hub',(-.34,-.29,.20),(-.34,-.3,.20),.065,yellow)
cylinder('Yellow right peg',(.56,.1,.27),(.66,.1,.27),.029,yellow)
# Painted decorations across the visible face.
for x in [-.47,-.29,-.09,.13,.34,.47]:
 z=.81 if abs(x)<.4 else .76
 mesh('Pink bunting triangle',[(x-.042,-.265,z),(x+.042,-.265,z),(x+.012,-.265,z-.065)],[(0,1,2)],pink)
path('Bunting cord',[(-.5,-.266,.78),(0,-.266,.84),(.5,-.266,.78)],.004,wood)
for x in [-.48,.46]:
 mesh('Hand painted pink motif',[(x-.04,-.265,.53),(x+.04,-.265,.50),(x+.04,-.265,.42),(x-.045,-.265,.45)],[(0,1,2,3)],pink)
 box('Yellow painted stripe',(x,-.264,.345),(.13,.007,.018),yellow)
for i in range(12):
 x=random.uniform(-.35,.35);y=random.uniform(-.15,.17)
 cylinder('Yellow roof paint dot',(x,y,.949),(x,y,.956),random.uniform(.008,.016),yellow)
# Two intertwined rope strands rising to a hanging loop.
for phase in [0,math.pi]:
 path('Jute rope strand',[(.012*math.cos(i*.48+phase),.012*math.sin(i*.48+phase),.95+i*.009) for i in range(110)],.007,rope)
path('Hanging rope loop',[(.07*math.sin(i*math.tau/48),0,1.985+.07*math.cos(i*math.tau/48)) for i in range(49)],.01,rope)
scene['reference']='User supplied painted caravan birdhouse photograph; hidden structure approximated.'
scene['description']='Hollow turquoise caravan, pink rear, yellow walls, lavender round entrance and perch, windows, wheel and jute hanger.'
# Save an editable dedicated asset file, preserving the existing house scenes.
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/artifacts/birdhouse/caravan-birdhouse.blend')
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects:o.select_set(True)
bpy.context.view_layer.objects.active=front;bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=OUT+'/apps/web/public/models/kirkland-house/birdhouse.glb',export_format='GLB',use_selection=True,export_apply=True,export_animations=False)
print('Birdhouse saved and exported:',len(col.objects),'parts')
