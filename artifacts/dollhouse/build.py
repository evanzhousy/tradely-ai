import bpy, math, random
from mathutils import Vector
from pathlib import Path

BASE=Path('/Users/evansmacbookpro/Desktop/Projects/tradely')
OUT=BASE/'artifacts/dollhouse'
scene=bpy.data.scenes.new('Pink Dream Dollhouse');bpy.context.window.scene=scene
root=bpy.data.objects.new('Dollhouse',None);scene.collection.objects.link(root)
groups={}
for name in ['Structure','Bedroom','Living','Bathroom','Kitchen','Dining','Garage','SlidePool','Elevator','Decor']:
 c=bpy.data.collections.new('DH '+name);scene.collection.children.link(c);groups[name]=c
C=groups['Structure'];random.seed(72)
def mat(n,col,rough=.34,metal=0):
 m=bpy.data.materials.new('DH '+n);m.use_nodes=True;m.diffuse_color=(*col,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 maps=list((OUT/'textures/plastic').glob('*NormalGL*'))
 if maps and not metal:
  tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(maps[0]),check_existing=True);tex.image.colorspace_settings.name='Non-Color';normal=m.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.13;m.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs[0],p.inputs['Normal'])
 return m
pink=mat('Hot pink plastic',(.85,.012,.28));pale=mat('Rose pink plastic',(.94,.31,.57));white=mat('Ivory plastic',(.92,.92,.86));purple=mat('Lavender plastic',(.41,.14,.65));yellow=mat('Golden yellow plastic',(.93,.69,.08));orange=mat('Peach seat',(.98,.43,.20));teal=mat('Aqua plastic',(.09,.61,.65));gray=mat('Silver metal',(.5,.56,.56),.3,.65);dark=mat('Black screens',(.018,.013,.025));green=mat('Plant green',(.08,.45,.08),.6);brown=mat('Toy dog tan',(.54,.24,.055));cloth=mat('Pink dotted textile',(.92,.48,.64),.85)
glass=mat('Clear aqua panels',(.30,.74,.79),.16);p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.72;p.inputs['IOR'].default_value=1.36;p.inputs['Alpha'].default_value=.48;glass.diffuse_color=(.3,.74,.79,.48);glass.surface_render_method='DITHERED'
def link(o,n,m=None):
 for c in list(o.users_collection):c.objects.unlink(o)
 C.objects.link(o);o.name='DH '+n;o.parent=root
 if m:o.data.materials.append(m)
 return o
def box(n,loc,size,m,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=link(bpy.context.object,n,m);o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:mod=o.modifiers.new('Molded edges','BEVEL');mod.width=bevel;mod.segments=3
 return o
def ball(n,loc,size,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=1,location=loc);o=link(bpy.context.object,n,m);o.scale=size
 for p in o.data.polygons:p.use_smooth=True
 return o
def rod(n,a,b,r,m,r2=None):
 a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=r,radius2=r if r2 is None else r2,depth=(b-a).length,location=(a+b)/2);o=link(bpy.context.object,n,m);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def mesh(n,verts,faces,m):
 data=bpy.data.meshes.new(n);data.from_pydata(verts,[],faces);data.update();o=bpy.data.objects.new('DH '+n,data);C.objects.link(o);o.parent=root;o.data.materials.append(m);return o
def rim(n,pts,r,m):
 data=bpy.data.curves.new(n,'CURVE');data.dimensions='3D';data.bevel_depth=r;data.bevel_resolution=3;sp=data.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,co in zip(sp.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new('DH '+n,data);C.objects.link(o);o.parent=root;data.materials.append(m);return o
def pattern(o,quadrant):o['texture_quadrant']=quadrant
def plant(x,y,z,s=.22):
 rod('Flower pot',(x,y,z),(x,y,z+s),s*.65,yellow,s*.85)
 for i in range(8):
  a=i*2.4;leaf=ball('Plant leaf',(x+math.cos(a)*s*.6,y+math.sin(a)*s*.6,z+s*1.5),(s*.35,s*.16,s*.55),green);leaf.rotation_euler.y=math.sin(a)*.7
def books(x,y,z):
 for i,m in enumerate([pink,yellow,teal,purple]):box('Miniature book',(x+i*.065,y,z),(.05,.13,.23+random.random()*.08),m,.006)
def wallart(x,y,z,w=.5,h=.42):
 box('Picture frame',(x,y,z),(w,.035,h),pink,.008);o=box('Printed picture',(x,y-.024,z),(w-.06,.006,h-.06),cloth,0);pattern(o,0)
def window(x,y,z,w,h):
 for dx in [-w/2,w/2]:box('White window jamb',(x+dx,y,z),(.055,.085,h),white,.006)
 for dz in [-h/2,h/2]:box('White window rail',(x,y,z+dz),(w,.085,.06),white,.006)
 for dx in [-w/6,w/6]:box('Window mullion',(x+dx,y,z),(.045,.08,h),white,.004)

# Open three-storey toy structure; the right terrace projects beyond the rooms.
box('Ground pink base',(.65,0,.10),(5.9,2.0,.20),pale)
box('Middle peach terrace',(.65,0,2.18),(5.9,2.0,.16),orange)
box('Top pink floor',(-.18,0,4.25),(4.24,2.0,.16),pale)
for x,m in [(-2.22,pink),(.35,white),(1.83,white)]:
 box('Front structural column',(x,-.88,3.17),(.14,.15,6.08),m)
 box('Rear structural column',(x,.88,3.17),(.13,.13,6.08),white)
for x in [-2.22,1.83]:box('Side ground support',(x,0,1.1),(.10,1.75,2),pink)
# Back walls stop around real open windows.
box('Living lower back',(-.95,.88,2.79),(2.5,.08,1.08),pink)
window(-.96,.88,3.60,2.5,1.10)
box('Bedroom lower back',(-.95,.88,4.69),(2.5,.08,.70),pale);pattern(bpy.context.object,3)
window(-.95,.88,5.77,2.5,1.40)
o=box('Bathroom aqua tiles',(1.09,.88,3.18),(1.35,.08,1.85),teal);pattern(o,2)
o=box('Bedroom right striped wallpaper',(1.09,.88,5.28),(1.35,.08,1.94),pale);pattern(o,1)
o=box('Kitchen back wall',(-1.0,.88,1.18),(2.35,.08,1.90),pale);pattern(o,3)
box('Garage printed back',(2.57,.65,.86),(1.5,.10,1.35),purple)
box('Kitchen divider',(-.20,.03,1.13),(.14,1.68,1.92),purple)
for x in [.40,1.66]:
 o=box('Dining pink door panel',(x,-.68,1.12),(.18,1.35,1.85),pale);pattern(o,1)
mesh('Sloping roof',[(-2.4,-1,6.15),(.50,-1,6.86),(.50,1,6.86),(-2.4,1,6.15)],[(0,1,2,3)],white)
mesh('Right sloping roof',[(.5,-1,6.86),(1.98,-1,6.30),(1.98,1,6.30),(.5,1,6.86)],[(0,1,2,3)],white)
for y in [-1.01,1.01]:
 rim('Magenta roof fascia',[(-2.42,y,6.15),(.5,y,6.86),(2.0,y,6.30)],.09,pink)

C=groups['Bedroom']
box('Pink bed frame',(-.97,.07,4.60),(2.03,1.08,.35),pink,.08)
box('White mattress',(-.97,.07,4.82),(1.95,1.04,.17),white,.08)
o=box('Polka dot bedcover',(-1.03,-.03,4.92),(1.84,1.0,.07),cloth,.03);pattern(o,0)
o=box('Bedcover front drape',(-1.03,-.54,4.74),(1.85,.025,.40),cloth,.018);pattern(o,0)
for x,m in [(-.42,pink),(-.80,orange)]:box('Bedroom pillow',(x,.34,5.10),(.38,.24,.36),m,.07)
box('Left tall closet',(-2.00,.36,5.20),(.35,.87,1.75),white)
box('Closet pink open door',(-2.23,-.20,5.2),(.15,.85,1.8),pale)
rod('Closet hanging rail',(-2.16,-.02,5.92),(-1.81,-.02,5.92),.015,gray)
for i,m in enumerate([pink,purple,orange]):
 box('Hanging dress',(-2.10+i*.1,.04,5.52),(.09,.23,.6),m,.025)
rod('Chandelier stem',(-.86,0,6.56),(-.86,0,6.27),.015,gray)
for i in range(6):
 a=i*math.tau/6;rod('Chandelier arm',(-.86,0,6.30),(-.86+math.cos(a)*.21,math.sin(a)*.21,6.15),.012,gray);ball('Chandelier bulb',(-.86+math.cos(a)*.21,math.sin(a)*.21,6.15),(.035,.035,.035),white)
box('Bedroom wall screen',(-.04,.64,5.71),(.65,.07,.49),dark,.008);wallart(-.04,.59,5.71,.60,.44)
box('Top right desk',(1.09,.48,4.99),(1.2,.60,.08),white)
for x in [.60,1.58]:box('Desk leg',(x,.48,4.67),(.07,.55,.65),white)
books(.70,.59,4.62);wallart(1.1,.81,5.8)
rod('Orange chair pedestal',(1.18,-.23,4.34),(1.18,-.23,4.79),.035,orange)
ball('Orange pedestal chair seat',(1.18,-.23,4.85),(.28,.24,.075),orange)
ball('Orange chair back',(1.18,-.04,5.06),(.27,.06,.25),orange)
rod('Chair round foot',(1.18,-.23,4.33),(1.18,-.23,4.36),.25,orange)
plant(-1.2,.56,5.02,.14)

C=groups['Living']
box('Purple sofa base',(-.98,.20,2.57),(2.06,.83,.37),purple,.075)
box('Purple sofa back',(-.98,.54,2.91),(2.06,.19,.78),purple,.055)
for x in [-1.55,-.57]:box('Sofa seat',(x,.12,2.79),(.94,.68,.13),purple,.065)
for x in [-1.99,.03]:box('Sofa arm',(x,.16,2.86),(.16,.85,.59),purple,.035)
for x,m in [(-1.60,orange),(-1.07,teal),(-.49,pale)]:o=box('Sofa throw pillow',(x,.46,3.17),(.41,.14,.28),m,.025);pattern(o,0 if x<-1.2 else 2)
box('Yellow coffee table',(-.97,-.55,2.63),(.95,.45,.055),yellow)
for x in [-1.37,-.57]:
 for y in [-.71,-.39]:box('Coffee table leg',(x,y,2.42),(.045,.045,.39),yellow)
rod('Coffee cup',(-.97,-.53,2.67),(-.97,-.53,2.78),.045,white)

C=groups['Bathroom']
box('Pink vanity counter',(1.08,.35,3.10),(1.12,.75,.08),pink)
box('White vanity cupboard',(1.30,.38,2.68),(.60,.63,.81),white)
ball('Basin',(1.3,.30,3.13),(.19,.23,.035),white)
rod('Faucet',(1.30,.58,3.15),(1.30,.58,3.35),.02,gray)
box('Pink hand towel',(1.3,-.005,2.88),(.3,.022,.35),pale)
ball('Oval gold mirror frame',(1.05,.79,3.61),(.23,.045,.43),yellow)
ball('Oval mirror',(1.05,.737,3.61),(.20,.015,.40),gray)
rod('Toilet base',(.62,-.08,2.27),(.62,-.08,2.62),.15,white)
ball('Toilet bowl',(.62,-.10,2.64),(.19,.23,.09),white)
ball('Pink toilet lid',(.62,-.10,2.71),(.18,.22,.028),pale)
plant(.69,.55,3.14,.10)

C=groups['Kitchen']
box('White refrigerator',(-1.90,.46,1.08),(.49,.67,1.74),white)
box('Refrigerator open dark cavity',(-1.90,.105,1.13),(.38,.025,1.4),gray)
for z in [.55,.91,1.27,1.63]:box('Fridge shelf',(-1.9,-.01,z),(.39,.31,.025),white)
for i in range(6):rod('Tiny food bottle',(-1.99+(i%2)*.17,-.005,.61+(i//2)*.36),(-1.99+(i%2)*.17,-.005,.81+(i//2)*.36),.04,[teal,orange,pink][i%3])
box('Fridge open door',(-2.13,-.16,1.08),(.07,.55,1.70),white)
for x,m in [(-1.30,white),(-.71,pink)]:
 box('Kitchen lower unit',(x,.42,.67),(.57,.66,.98),m)
 box('Kitchen counter',(x,.42,1.19),(.59,.7,.05),white)
 for z in [.41,.68,.96]:box('Cabinet drawer pull',(x,.075,z),(.20,.025,.025),gray,.005)
box('Oven window',(-.71,.069,.58),(.40,.025,.34),dark)
for x in [-.87,-.57]:rod('Stovetop burner',(x,.40,1.23),(x,.40,1.24),.09,dark)
ball('Teal kettle',(-.69,.49,1.37),(.11,.10,.12),teal)
rim('Kettle handle',[(-.79,.49,1.38),(-.79,.49,1.57),(-.59,.49,1.57),(-.59,.49,1.38)],.015,teal)
ball('Silver sink',(-1.28,.40,1.22),(.21,.23,.018),gray)
rod('Kitchen tap',(-1.28,.65,1.22),(-1.28,.65,1.47),.018,yellow)
rod('Kitchen pendant wire',(-1.18,0,1.72),(-1.18,0,2.1),.008,yellow)
ball('Yellow pendant shade',(-1.18,0,1.73),(.22,.22,.075),yellow)

C=groups['Dining']
rod('Round white dining table',(.95,0,.92),(.95,0,.98),.43,white)
rod('Dining pedestal',(.95,0,.18),(.95,0,.92),.055,white)
for i,m in enumerate([pink,orange,pink,orange]):
 a=i*math.pi/2;x=.95+math.cos(a)*.58;y=math.sin(a)*.58
 ball('Dining molded seat',(x,y,.64),(.22,.22,.06),m)
 ball('Dining chair back',(x+math.cos(a)*.15,y+math.sin(a)*.15,.89),(.20,.075,.25),m)
 for dx in [-.12,.12]:rod('Dining chair leg',(x+dx,y,.16),(x+dx,y,.64),.022,m)
for x,y in [(.70,0),(1.17,0),(.95,.23)]:rod('Table plate',(x,y,.99),(x,y,1.003),.11,purple);rod('Tea cup',(x,y,1.0),(x,y,1.09),.039,white)

C=groups['Garage']
box('Garage magenta tracks',(2.52,0,.17),(1.38,1.74,.06),pink)
# Real miniature scooter, not a printed substitute.
for x in [2.07,3.06]:
 rod('Scooter black wheel',(x,.27,.42),(x,.43,.42),.20,dark)
 rod('Scooter silver hub',(x,.255,.42),(x,.24,.42),.12,gray)
box('Pink scooter footboard',(2.55,.35,.44),(1.05,.27,.075),pink)
ball('Scooter rear fairing',(2.12,.35,.67),(.31,.19,.22),pink)
ball('Scooter front fairing',(2.95,.35,.77),(.14,.18,.35),pink)
box('Scooter seat',(2.28,.35,.94),(.56,.30,.09),purple,.04)
rod('Scooter handle stem',(2.90,.35,.95),(2.84,.35,1.18),.025,gray)
rod('Scooter handlebars',(2.84,.12,1.18),(2.84,.58,1.18),.025,pink)
ball('Scooter headlamp',(3.02,.27,1.03),(.06,.05,.07),white)

C=groups['SlidePool']
# Shallow rectangular pool with four molded walls and water surface.
box('Pool bottom',(2.67,-.10,2.33),(1.43,1.32,.12),teal,.1)
for x in [1.94,3.40]:box('Clear pool side',(x,-.10,2.52),(.07,1.4,.37),glass,.035)
for y in [-.79,.59]:box('Clear pool end',(2.67,y,2.52),(1.45,.065,.37),glass,.03)
box('Aqua water',(2.67,-.10,2.43),(1.34,1.2,.025),glass,.04)
for z in [2.65,2.83,3.01]:box('White pool fence',(2.66,.86,z),(1.62,.045,.035),white,.004)
for x in [1.86,3.47]:box('Pool fence post',(x,.86,2.69),(.055,.055,.72),white)
# Continuous curved trough, full side lips.
p0=Vector((1.73,-.18,4.35));p1=Vector((4.40,-.10,4.10));p2=Vector((4.32,-.45,2.94));p3=Vector((3.13,-.36,2.49))
verts=[];rows=64;cross=12
for i in range(rows+1):
 t=i/rows;p=(1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t*t*p2+t**3*p3;tan=3*(1-t)**2*(p1-p0)+6*(1-t)*t*(p2-p1)+3*t*t*(p3-p2);side=Vector((-tan.y,tan.x,0)).normalized()
 for j in range(cross+1):
  u=j/cross*2-1;v=p+side*u*.34;v.z+=.22*abs(u)**4;verts.append(tuple(v))
faces=[]
for i in range(rows):
 for j in range(cross):a=i*(cross+1)+j;faces.append((a,a+1,a+cross+2,a+cross+1))
o=mesh('Purple sweeping slide trough',verts,faces,purple);mod=o.modifiers.new('Slide shell thickness','SOLIDIFY');mod.thickness=.035
for edge in [0,cross]:rim('Slide raised safety rail',[verts[i*(cross+1)+edge] for i in range(rows+1)],.026,purple)
box('Slide pink support',(3.37,.43,3.01),(.12,.15,1.65),pink)
# Turquoise front glass guard panels.
for x,z,w in [(-.96,4.49,.86),(1.21,4.49,1.02),(-.98,2.48,1.12),(.91,2.48,1.62)]:box('Balcony aqua shield',(x,-.975,z),(w,.045,.38),glass,.013)
for i in range(10):
 z=.28+i*.185;box('Right exterior ladder tread',(3.60,-.64,z),(.29,.31,.045),white,.01)
for x in [3.48,3.72]:rod('Right ladder rail',(x,-.63,.14),(x,-.63,2.18),.022,white)

C=groups['Elevator']
box('Elevator pink base',(-2.72,-.05,.13),(.82,1.12,.12),pale,.14)
box('Elevator turquoise shaft',(-2.31,.31,.90),(.12,.40,1.55),teal)
verts=[]
for z in [.22,1.36]:
 for i in range(33):a=math.pi*.05+math.pi*1.45*i/32;verts.append((-2.65+.48*math.cos(a),-.05+.48*math.sin(a),z))
o=mesh('Curved clear elevator cabin',verts,[(i,i+1,i+34,i+33) for i in range(32)],glass);o.modifiers.new('Cabin acrylic thickness','SOLIDIFY').thickness=.025
for z in [.22,.78,1.36]:rim('Elevator aqua band',[(x,y,z) for x,y,_ in verts[:33]],.025,teal)

C=groups['Decor']
plant(.04,-.80,.20,.18)
for x in [-1.77,-1.20]:rod('Pet bowl',(x,-.70,.20),(x,-.70,.27),.10,yellow)
box('Purple pet bed',(-.93,-.38,.26),(.43,.36,.15),purple,.07)
ball('Miniature dog torso',(-1.51,-.50,.38),(.13,.075,.13),brown);ball('Dog head',(-1.51,-.56,.55),(.095,.085,.10),brown)
for x in [-1.58,-1.44]:ball('Dog floppy ear',(x,-.53,.55),(.035,.065,.12),brown);rod('Dog front leg',(x,-.55,.20),(x,-.55,.36),.025,brown)
books(-1.5,.66,5.18);books(.70,.62,5.15)
for x,z in [(1.52,5.05),(-.05,5.0)]:rod('Mini lamp stem',(x,.55,z),(x,.55,z+.23),.012,yellow);rod('Mini cream lampshade',(x,.55,z+.23),(x,.55,z+.42),.095,white)

scene['reference']='User screenshot: three-storey pink open-front dollhouse. Child in product photo excluded.'
scene['modeling']='All structural parts, furniture, slide, pool, elevator, scooter and accessories modeled in Blender.'
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Dollhouse studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.8,.85,.9,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
C=groups['Structure']
bpy.ops.object.camera_add(location=(9,-18,10));cam=bpy.context.object;cam.name='Dollhouse camera';cam.rotation_euler=(Vector((.7,0,3.3))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=8.9;scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(-3,-7,11));lamp=bpy.context.object;lamp.name='Dollhouse softbox';lamp.data.energy=1600;lamp.data.size=7;lamp.rotation_euler=(Vector((0,0,3))-lamp.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(OUT/'blockout.png')
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.overlay.show_overlays=False;area.spaces.active.shading.color_type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dollhouse.blend'))
print('DOLLHOUSE BUILT',len(root.children),'modeled objects')
