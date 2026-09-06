import bpy, math, random
from mathutils import Vector
random.seed(8311)
OUT='/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/kirkland-house'
scene=bpy.data.scenes.new('8311 Kirkland | Photo reconstruction')
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
scene['source']='Zillow 59698516 + user front and aerial photographs'
scene['accuracy']='Exterior visual reconstruction. Dimensions, rear geometry and shared-unit limits estimated; not surveyed. No interior floorplan claimed.'
collections={}
for name in ['01 Architecture','02 Roofs','03 Windows and doors','04 Trim and masonry','05 Landscape','06 Context','07 Cameras and lighting']:
 c=bpy.data.collections.new(name);scene.collection.children.link(c);collections[name]=c
C=collections['01 Architecture']
def link(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 C.objects.link(o);return o
def mat(name,color,rough=.6,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
def noise(m,scale,strength):
 n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');t=n.new('ShaderNodeTexNoise');t.inputs['Scale'].default_value=scale;b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=strength;b.inputs['Distance'].default_value=.065;l.new(t.outputs['Fac'],b.inputs['Height']);l.new(b.outputs['Normal'],p.inputs['Normal'])
siding=mat('Warm olive cream | horizontal clapboard',(.57,.55,.40));trim=mat('Painted ivory trim',(.88,.88,.80),.42);shake=[mat('Cedar shake taupe %02d'%i,(.43+i*.012,.42+i*.012,.35+i*.012)) for i in range(6)]
roofmat=mat('Charcoal asphalt shingles',(.085,.105,.115),.88);noise(roofmat,95,.45)
glass=mat('Blue grey reflective glazing',(.075,.15,.19),.16,.45)
dark=mat('Window and door recess',(.035,.047,.046));door=mat('Espresso front door',(.11,.085,.065));asphalt=mat('Driveway asphalt',(.095,.105,.108));noise(asphalt,55,.6)
concrete=mat('Concrete path',(.54,.53,.47));noise(concrete,60,.25)
grass=mat('Lawn',(.19,.27,.09));soil=mat('Mulch',(.11,.075,.042));bark=mat('Birch pale bark',(.57,.56,.44));leaf=[mat('Shrub leaf %d'%i,(.035+i*.025,.11+i*.034,.035+i*.008)) for i in range(5)]
stone=[mat('Stack stone %d'%i,(.29+i*.045,.25+i*.04,.18+i*.035)) for i in range(6)];red=mat('Red alarm bell',(.62,.025,.032),.35);brass=mat('Address bronze',(.29,.25,.12),.3,.65)
def box(name,loc,size,m,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=link(bpy.context.object);o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if m:o.data.materials.append(m)
 if bevel:mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=2
 return o
def mesh(name,verts,faces,m):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);C.objects.link(o);o.data.materials.append(m);return o
def beam(name,a,b,width,m):
 a,b=Vector(a),Vector(b);o=box(name,(a+b)/2,(width,width,(b-a).length),m,.006);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def cyl(name,a,b,r,m,r2=None):
 a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cone_add(vertices=9,radius1=r,radius2=r if r2 is None else r2,depth=(b-a).length,location=(a+b)/2);o=link(bpy.context.object);o.name=name;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();o.data.materials.append(m);return o
# House: front is negative Y. Garage width anchors approximate scale.
box('Garage volume',(0,3,1.53),(6.4,6,3.06),siding)
box('Main two storey body',(-.65,6.0,3.0),(7.7,8.6,6.0),siding)
box('Front bedroom gable volume',(.0,2.75,4.43),(4.55,3.65,2.74),siding)
# Detailed clapboard courses on exposed surfaces
for z in [0.18+i*.205 for i in range(29)]:
 if z<3.08:box('Garage siding course',(0,-.018,z),(6.4,.045,.035),siding)
 box('Right elevation lap',(3.215,5.2,z),(.045,10.4,.03),siding)
 box('Left elevation lap',(-4.515,6,z),(.045,8.6,.03),siding)
 box('Rear elevation lap',(-.65,10.315,z),(7.7,.045,.03),siding)
# Gable triangle and individual staggered cedar tiles
mesh('Front gable infill',[(-2.275,.91,5.8),(2.275,.91,5.8),(0,.91,7.35)],[(0,1,2)],shake[2])
for row in range(16):
 z=3.22+row*.255;top=z+.25
 half=2.275 if top<=5.8 else max(0,2.275*(7.35-top)/1.55)
 x=-half
 while x<half-.02:
  w=min(.36+random.random()*.08,half-x)
  # Windows sit forward and cover siding tiles.
  box('Cedar shingle',(x+w/2,.872,z+.12),(max(.015,w-.012),.075,.244),random.choice(shake));x+=w
C=collections['02 Roofs']
def roof(name,verts,faces):
 o=mesh(name,verts,faces,roofmat);s=o.modifiers.new('Roof thickness','SOLIDIFY');s.thickness=.13;return o
# Main hipped roof, footprint influenced by supplied overhead image
roof('Main hipped roof',[(-4.9,1.25,6.02),(3.6,1.25,6.02),(3.6,10.7,6.02),(-4.9,10.7,6.02),(-.65,4.2,7.7),(-.65,7.8,7.7)],[(0,1,4),(1,2,5,4),(2,3,5),(3,0,4,5)])
# Front projecting gable roof
roof('Front gable roof',[(-2.62,.48,5.82),(0,.48,7.49),(2.62,.48,5.82),(-2.62,5.5,5.82),(0,5.5,7.49),(2.62,5.5,5.82)],[(0,1,4,3),(1,2,5,4)])
roof('Garage wraparound apron roof',[(-3.55,-.52,3.12),(3.55,-.52,3.12),(3.55,2.2,3.12),(-3.55,2.2,3.12),(-2.17,1.12,3.95),(2.17,1.12,3.95)],[(0,1,5,4),(1,2,5),(3,0,4)])
# shingle courses along visible front apron and gable slopes
for i in range(10):
 t=i/10;y=-.52+t*1.64;z=3.13+t*.83;w=7.1-t*2.76
 beam('Apron shingle horizontal seam',(-w/2,y,z),(w/2,y,z),.015,roofmat)
for sign in [-1,1]:
 for i in range(15):
  t=i/15;x=sign*2.62*(1-t);z=5.84+1.67*t
  beam('Gable roof course',(x,.48,z),(x,5.5,z),.014,roofmat)
C=collections['04 Trim and masonry']
for x in [-3.2,3.2]:box('Garage corner board',(x,-.065,1.58),(.17,.12,3.15),trim,.01)
for x in [-2.28,2.28]:box('Gable corner trim',(x,.80,4.5),(.14,.13,2.6),trim,.01)
for a,b in [((-2.66,.42,5.8),(0,.42,7.51)),((0,.42,7.51),(2.66,.42,5.8)),((-3.57,-.55,3.1),(3.57,-.55,3.1))]:beam('White fascia',a,b,.16,trim)
for a,b in [((-4.9,1.23,6),(3.6,1.23,6)),((3.6,1.23,6),(3.6,10.7,6)),((-4.9,10.7,6),(3.6,10.7,6)),((-4.9,1.23,6),(-4.9,10.7,6))]:beam('Main eave fascia',a,b,.16,trim)
# recessed front entry bay
box('Porch landing',(-4,1.4,.10),(1.75,4.1,.20),concrete,.03)
box('Entry side wall',(-4.68,1.8,1.5),(.2,3.5,3),siding)
roof('Entry canopy',[(-5.05,-.05,2.94),(-2.95,-.05,2.94),(-2.95,2.8,3.7),(-5.05,2.8,3.7)],[(0,1,2,3)])
beam('Entry roof fascia',(-5.05,-.07,2.94),(-2.95,-.07,2.94),.16,trim)
for x in [-4.87,-3.1]:
 box('Porch stone plinth',(x,.12,.48),(.54,.58,.96),stone[2],.02)
 for row in range(7):
  for j in range(2):
   box('Stacked stone veneer',(x-.25+j*.255+random.uniform(0,.02),-.185,.08+row*.126),(.245,.045,.11),random.choice(stone),.008)
 box('Stone cap',(x,.1,1.0),(.69,.71,.14),trim,.015)
 box('Porch square column',(x,.1,1.94),(.22,.23,1.78),trim,.01)
# gutter/downpipe
for x,y,z in [(3.38,-.45,3.1),(-2.39,.82,5.82),(3.45,10.4,6.0)]:
 cyl('Downspout',(x,y,.20),(x,y,z-.2),.048,trim)
 cyl('Gutter elbow',(x,y,z-.2),(x+.13,y-.08,z),.048,trim)
C=collections['03 Windows and doors']
def window(name,x,y,z,w,h,side=False):
 # assembled front-facing window, rotate complete assembly for side elevations
 start=set(C.objects)
 box(name+' recess',(x,y,z),(w+.18,.09,h+.18),dark)
 box(name+' glass',(x,y-.055,z),(w,.035,h),glass)
 for dx in [-w/2-.065,w/2+.065]:box(name+' jamb',(x+dx,y-.1,z),(.13,.16,h+.26),trim,.008)
 for dz in [-h/2-.065,h/2+.065]:box(name+' sill / lintel',(x,y-.115,z+dz),(w+.26,.18,.13),trim,.008)
 box(name+' center mullion',(x,y-.14,z),(.055,.075,h),trim)
 for dx in [-w*.25,w*.25]:
  box(name+' upper muntin',(x+dx,y-.14,z+h*.28),(w/2,.05,.025),trim)
  box(name+' top vertical',(x+dx,y-.14,z+h*.39),(.022,.05,h*.22),trim)
 if side:
  origin=Vector((x,y,z))
  for o in set(C.objects)-start:
   v=o.location-origin;o.location=origin+Vector((-v.y,v.x,v.z));o.rotation_euler.z=math.pi/2
window('Front gable window',0,.72,4.53,1.72,1.73)
window('Entry upper window',-3.43,1.60,4.7,.85,1.25)
window('Right upper window',3.27,5.7,4.65,1.65,1.5,True)
window('Right rear upper window',3.27,8.6,4.65,1.4,1.5,True)
window('Right lower window',3.27,8.1,1.68,1.8,1.5,True)
# rear windows approximate, facing reversed
window('Rear upper window',-.7,10.4,4.6,1.85,1.5)
# garage shadow and door surface
box('Garage opening shadow',(0,-.061,1.25),(5.66,.12,2.43),dark)
box('Double garage door',(0,-.155,1.23),(5.5,.10,2.35),trim,.012)
for x in [-2.86,2.86]:box('Garage side casing',(x,-.19,1.28),(.16,.19,2.57),trim,.012)
box('Garage header',(0,-.2,2.54),(5.88,.20,.18),trim,.012)
for row in range(4):
 for col in range(8):
  x=-2.43+col*.694;z=.37+row*.57
  box('Raised garage panel',(x,-.225,z),(.55,.045,.38),trim,.025)
for z in [.65,1.22,1.79]:box('Garage section joint',(0,-.217,z),(5.49,.009,.017),concrete)
for x in [-1.55,1.55]:box('Garage lift handle',(x,-.265,.35),(.13,.035,.025),dark,.005)
box('Front door',(-4.02,2.59,1.25),(.95,.12,2.28),door,.02)
for x in [-4.56,-3.48]:box('Entry door jamb',(x,2.52,1.28),(.12,.18,2.46),trim,.01)
box('Entry lintel',(-4.02,2.51,2.48),(1.18,.18,.14),trim)
for z in [.61,1.54]:
 for x in [-4.25,-3.80]:box('Door inset panel',(x,2.51,z),(.32,.04,.68),dark,.025)
cyl('Door knob',(-3.65,2.44,1.16),(-3.65,2.37,1.16),.042,brass)
# House number text and round alarm bell
bpy.ops.object.text_add(location=(0,-.29,2.66),rotation=(math.pi/2,0,0));o=link(bpy.context.object);o.name='8311 address';o.data.body='8311';o.data.align_x='CENTER';o.data.size=.22;o.data.extrude=.007;o.data.materials.append(brass)
cyl('Red gable alarm',(-1.48,.75,4.92),(-1.48,.64,4.92),.13,red)
box('Porch lamp base',(-3.48,2.38,2.0),(.15,.14,.3),dark)
# little roof vents
C=collections['02 Roofs']
for y in [6.6,8.1]:cyl('Roof plumbing vent',(1.0,y,6.5),(1.0,y,7.0),.07,dark)
# Neighbor context, deliberately simple and separately toggleable
C=collections['06 Context']
box('Attached neighbor mass',(-7.28,5.0,2.95),(5.4,10.1,5.9),siding)
roof('Neighbor gable roof',[(-10.3,-.35,5.92),(-7.5,-.35,7.32),(-4.68,-.35,5.92),(-10.3,8.8,5.92),(-7.5,8.8,7.32),(-4.68,8.8,5.92)],[(0,1,4,3),(1,2,5,4)])
box('Neighbor garage',(-7.6,-.105,1.23),(4.6,.13,2.35),trim,.02)
window('Neighbor window',-7.55,-.14,4.48,1.6,1.48)
beam('Neighbor fascia',(-10.3,-.4,5.92),(-7.5,-.4,7.32),.16,trim);beam('Neighbor fascia',(-7.5,-.4,7.32),(-4.68,-.4,5.92),.16,trim)
C=collections['05 Landscape']
box('Site base',(-2.0,2.6,-.27),(20,23,.5),concrete,.16)
box('Garden lawn',(-2,3.0,-.015),(19.7,22,.08),grass,.04)
box('8311 driveway',(0,-3.62,.045),(6.5,7.1,.13),asphalt,.035)
box('Neighbor drive',(-7.6,-3.65,.038),(4.7,7.15,.11),asphalt,.02)
box('Entry path',(-4.05,-2.3,.105),(1.08,4.8,.13),concrete,.025)
box('Right side walk',(4.0,3.5,.06),(1.04,17.2,.13),concrete,.02)
box('Front planting bed',(-3.82,-4.35,.07),(2.1,3.6,.16),soil,.20)
box('Right foundation bed',(3.9,3.7,.07),(1.0,12.0,.15),soil,.20)
# shared low-poly foliage mesh for detailed efficient shrubs
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1);temp=bpy.context.object;fol= temp.data.copy();bpy.data.objects.remove(temp,do_unlink=True)
for m in leaf:fol.materials.append(m)
for p in fol.polygons:p.material_index=random.randrange(5)
def foliage(name,loc,scale):
 o=bpy.data.objects.new(name,fol);C.objects.link(o);o.location=loc;o.scale=scale;return o
def bush(x,y,s=.65):
 for i in range(32):
  t=random.random()*math.tau;r=s*math.sqrt(random.random());z=random.uniform(.15,.7)*s
  foliage('Boxwood foliage',(x+math.cos(t)*r,y+math.sin(t)*r,.2+z),(.25,.22,.23))
for x,y,s in [(-3.55,-2.1,.60),(-4.4,-5.1,.70),(-3.5,-5.4,.64),(3.82,-.05,.55),(3.9,1.15,.55),(3.9,3,.6),(3.9,9.7,.6)]:bush(x,y,s)
# Birch at front-left; sparse crown keeps the building legible
base=Vector((-4.55,-3.65,.16));top=base+Vector((.25,.08,5.5));cyl('Birch trunk',base,top,.13,bark,.055)
for i in range(11):
 z=1.6+i*.31;a=base+Vector((.25*z/5.5,0,z));theta=i*2.4
 b=a+Vector((math.cos(theta)*random.uniform(.7,1.5),math.sin(theta)*random.uniform(.6,1.2),random.uniform(1.1,2.1)))
 cyl('Birch limb',a,b,.043,bark,.008)
 for j in range(3):
  end=b+Vector((random.uniform(-.65,.65),random.uniform(-.55,.55),random.uniform(.3,.8)))
  cyl('Birch twig',b,end,.012,bark,.002)
# Back landscaping: airy conifers
for x,y,h in [(-9,10.5,7),(-5,12.0,8.5),(.5,12.7,7.8),(5.2,10.8,7.0)]:
 cyl('Evergreen trunk',(x,y,0),(x,y,h),.14,bark,.04)
 for k in range(6):
  z=1.5+k*h*.105;r=(1-k*.12)*1.4
  bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=r,radius2=.08,depth=h*.34,location=(x,y,z+h*.16));o=link(bpy.context.object);o.name='Evergreen canopy';o.data.materials.append(leaf[k%5])
# render presentation
C=collections['07 Cameras and lighting']
def camera(name,pos,target,lens=50,ortho=None):
 bpy.ops.object.camera_add(location=pos);o=link(bpy.context.object);o.name=name;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();o.data.lens=lens
 if ortho:o.data.type='ORTHO';o.data.ortho_scale=ortho
 return o
scene.camera=camera('01 Front three-quarter',(14,-23,12),(-1.5,2.1,2.8),48)
camera('02 Front elevation',(-.8,-25,4.8),(-.8,1,3.7),55,16)
camera('03 Roof overview',(12,-12,25),(-2,3,0),50,24)
bpy.ops.object.light_add(type='AREA',location=(1,-9,15));o=link(bpy.context.object);o.name='Large soft sky';o.data.energy=2200;o.data.shape='DISK';o.data.size=9;o.rotation_euler=(Vector((-1,3,2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='SUN',location=(4,-8,12));o=link(bpy.context.object);o.name='Afternoon sunlight';o.data.energy=2.2;o.data.angle=.12;o.rotation_euler=(math.radians(26),math.radians(-24),math.radians(-25))
world=bpy.data.worlds.new('Soft blue sky');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.68,.80,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45;scene.world=world
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=OUT+'/house-preview.png'
scene.view_settings.view_transform='AgX'
# pleasant material viewport and camera framing
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':
  area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.color_type='MATERIAL'
# Embed original references for reproducibility
for path in [OUT+'/references/front.png',OUT+'/references/roof.png']:
 im=bpy.data.images.load(path,check_existing=True);im.pack()
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/8311-kirkland-house.blend')
print('Built',len(scene.objects),'objects. Saved',bpy.data.filepath)
