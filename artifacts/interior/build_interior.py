import bpy, math, random
random.seed(8311)
BASE='/Users/evansmacbookpro/Desktop/Projects/tradely'
scene=bpy.data.scenes.new('8311 Interior | Reference-based study');bpy.context.window.scene=scene
coll=bpy.data.collections.new('Interior');scene.collection.children.link(coll)
def material(name,c,rough=.75,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*c,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
wall=material('Warm off-white plaster',(.78,.75,.68));white=material('Ivory upholstery and porcelain',(.9,.88,.80));trim=material('White painted trim',(.92,.91,.85));oak=material('Natural maple cabinetry',(.57,.36,.16));floor=material('Honey oak floor',(.55,.36,.19));carpet=material('Warm grey carpet',(.51,.48,.41));rug=material('Cream woven rug',(.76,.71,.60));dark=material('Espresso wood',(.08,.065,.045));black=material('Black fireplace',(.016,.018,.017));stone=material('Grey stone fireplace surround',(.26,.27,.24));gold=material('Brass details',(.48,.34,.12),.3,.65);steel=material('Brushed steel',(.48,.5,.5),.3,.8);glass=material('Window blue reflection',(.18,.32,.39),.15,.5);green=material('Forest green cushion',(.045,.13,.08));mustard=material('Mustard cushion',(.64,.43,.055));rust=material('Terracotta cushion',(.56,.11,.07));linen=material('Grey linen bedding',(.53,.51,.46));blue=material('Second bedroom navy',(.045,.1,.18));plant=material('Indoor foliage',(.065,.20,.075))
level=None
roots=[]
def box(name,x,z,y,w,d,h,mat,solid=False,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.name=name;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for c in list(o.users_collection):c.objects.unlink(o)
 coll.objects.link(o);o.parent=level;o.data.materials.append(mat)
 if bevel:m=o.modifiers.new('Soft edges','BEVEL');m.width=bevel;m.segments=2
 if solid:o['collider']=[x-w/2-.22,x+w/2+.22,z-d/2-.22,z+d/2+.22]
 return o
def sphere(name,x,z,y,w,d,h,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=1,location=(x,-z,y));o=bpy.context.object;o.name=name;o.scale=(w,d,h)
 for c in list(o.users_collection):c.objects.unlink(o)
 coll.objects.link(o);o.parent=level;o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 return o
def cylinder(name,x,z,y,r,h,mat):
 bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=h,location=(x,-z,y));o=bpy.context.object;o.name=name
 for c in list(o.users_collection):c.objects.unlink(o)
 coll.objects.link(o);o.parent=level;o.data.materials.append(mat);return o
def boundary():
 box('Foundation',0,0,-.12,10,10,.24,floor)
 # Camera-facing walls are intentionally cut away; collisions retain their footprints.
 box('Rear wall',0,-5,1.35,10,.16,2.7,wall,True)
 box('Left wall',-5,0,1.35,.16,10,2.7,wall,True)
 box('Right cutaway wall',5,0,.4,.16,10,.8,wall,True)
 for x in [-2.9,2.9]:box('Front cutaway wall',x,5,.4,4.2,.16,.8,wall,True)
 for x in [-5,5]:box('Side skirting',x,0,.10,.19,10,.16,trim)
 box('Rear skirting',0,-4.9,.1,10,.12,.16,trim)
def window(x,z,w=1.7):
 box('Window glass',x,z,1.65,w,.035,1.45,glass)
 for dx in [-w/2,w/2,0]:box('Window frame',x+dx,z+.04,1.65,.06,.09,1.55,trim)
 for h in [.9,1.98,2.4]:box('Window horizontal',x,z+.04,h,w+.1,.10,.06,trim)
def art(x,z,w=1.0):
 box('Framed artwork',x,z,1.9,w,.05,.62,gold)
 box('Abstract art canvas',x,z+.035,1.9,w-.055,.025,.56,white)
 for i in range(6):box('Abstract artwork mark',x-w*.4+i*w*.15,z+.055,1.9+random.uniform(-.15,.15),w*.12,.012,random.uniform(.12,.4),stone,False,.002)
def potted(x,z):
 cylinder('Plant pot',x,z,.24,.18,.45,white)
 for i in range(9):
  a=i*2.4;sphere('Plant leaves',x+math.cos(a)*.16,z+math.sin(a)*.16,.55+random.random()*.35,.08,.06,.24,plant)
def lamp(x,z):
 cylinder('Lamp stem',x,z,.68,.025,1.3,steel);cylinder('Lamp base',x,z,.05,.14,.06,steel)
 bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.23,radius2=.17,depth=.3,location=(x,-z,1.39));o=bpy.context.object;o.name='Cream lampshade';o.parent=level
 for c in list(o.users_collection):c.objects.unlink(o)
 coll.objects.link(o);o.data.materials.append(white)
def chair(x,z,back=True):
 box('Chair cushion',x,z,.48,.63,.64,.13,white,True)
 if back:box('Chair back',x,z-.28,.83,.65,.12,.70,white)
 for dx in [-.25,.25]:
  for dz in [-.24,.24]:box('Chair leg',x+dx,z+dz,.23,.055,.055,.46,dark)
def bed(x,z,accent):
 box('Bed base',x,z,.27,1.85,2.35,.44,white,True,.09)
 box('Mattress',x,z,.57,1.9,2.38,.23,white,False,.10)
 box('Tufted headboard',x,z-1.15,.92,1.96,.16,1.3,white,False,.07)
 box('Folded duvet',x,z+.25,.73,1.93,1.7,.13,linen,False,.07)
 for dx in [-.48,.48]:box('Bed pillow',x+dx,z-.72,.79,.78,.45,.20,white,False,.10)
 box('Accent pillow',x,z-.43,.85,.50,.32,.2,accent,False,.08)
 for dx in [-1.3,1.3]:
  box('Dark bedside table',x+dx,z-.80,.3,.52,.55,.6,dark,True)
  cylinder('Bedside lamp stem',x+dx,z-.8,.86,.025,.5,steel)
  cylinder('Bedside shade',x+dx,z-.8,1.17,.20,.27,white)
def vanity(x,z,w=1.65):
 box('Maple vanity',x,z,.45,w,.58,.9,oak,True)
 box('Vanity stone top',x,z,.94,w+.06,.65,.10,stone)
 for dx in [-w*.25,w*.25]:
  sphere('Porcelain basin',x+dx,z,.995,.24,.20,.04,white)
  cylinder('Faucet',x+dx,z-.20,1.10,.025,.24,steel)
 box('Vanity mirror',x,z-.34,1.64,w,.045,1.0,glass)
 for i in range(5):sphere('Vanity light bulb',x-w*.4+i*w*.2,z-.30,2.26,.052,.05,.05,white)
def toilet(x,z):
 box('Toilet tank',x,z-.18,.62,.42,.20,.63,white,True,.055)
 sphere('Toilet bowl',x,z+.10,.39,.27,.36,.22,white)
 cylinder('Toilet base',x,z,.21,.16,.40,white)
def levelRoot(name):
 global level
 level=bpy.data.objects.new(name,None);coll.objects.link(level);roots.append(level);return level
levelRoot('GroundFloor');boundary()
box('Living room carpet',-2.6,-.5,.016,4.65,7.6,.025,carpet)
box('Dining carpet',2.6,-1,.016,4.65,3.6,.026,carpet)
# floorboards across entry and kitchen, based on the photo's oak finish
for ix in range(25):
 x=-4.85+ix*.4
 for iz in range(10):
  z=-4.5+iz
  if x>0 and z<-2.5 or z>2:box('Oak floorboard',x,z,.021,.394,.985,.015,floor,False,.002)
# Sofa against the left wall, white lounge chairs, round timber coffee table
box('White sofa base',-4.05,-.25,.43,1.10,2.7,.52,white,True,.10)
box('Sofa back',-4.52,-.25,.88,.23,2.75,.9,white,False,.08)
for z in [-1.15,-.25,.65]:box('Sofa seat',-3.99,z,.74,.92,.82,.17,white,False,.10)
for z in [-1.57,1.07]:box('Sofa arm',-4.01,z,.75,1.14,.18,.58,white,False,.06)
for i,m in enumerate([green,mustard,mustard,green]):box('Living cushion',-4.24,-1.22+i*.62,.99,.28,.44,.45,m,False,.075)
box('Living rug',-2.9,-.10,.046,2.8,3.5,.025,rug)
cylinder('Round coffee tabletop',-2.85,-.25,.47,.53,.08,oak);box('Coffee table collision',-2.85,-.25,.24,.84,.84,.4,dark,True)
# Slim legs rather than solid tabletop support
bpy.context.object.hide_render=True
for dx in [-.29,.29]:
 for dz in [-.29,.29]:box('Coffee table thin leg',-2.85+dx,-.25+dz,.22,.025,.025,.43,black)
chair(-2.1,1.40);chair(-2.15,-2)
box('Terracotta chair pillow',-2.1,1.15,.85,.4,.13,.33,rust,False,.05)
# White console and half-height entry partition.
box('Entry half wall',-1.3,2.7,.55,2.4,.16,1.1,wall,True)
box('Entry half wall cap',-1.3,2.7,1.13,2.5,.23,.09,trim)
box('White console top',-1.35,3.03,.79,1.7,.35,.07,white,True)
for x in [-2.1,-.6]:box('Console legs',x,3.03,.4,.05,.32,.8,white)
cylinder('Entry vase',-1.4,3.03,.97,.1,.3,white)
# Fireplace on rear living wall, stone surround and artwork
box('Stone fireplace',-2.65,-4.73,.65,1.65,.40,1.3,stone,True)
box('Fireplace opening',-2.65,-4.50,.56,1.2,.05,.8,black)
for i in range(5):box('Fire log',-3.05+i*.2,-4.44,.25,.16,.1,.10,dark)
art(-2.65,-4.64,1.75);window(-4.05,-4.85,1.2)
potted(-4.5,-3.6);lamp(-4.5,1.9)
# Kitchen rear-right: maple cabinets, granite counter, white appliances.
for x in [1.3,2.1,2.9,3.7]:
 box('Kitchen lower cabinet',x,-4.55,.46,.78,.78,.92,oak,True)
 box('Granite countertop',x,-4.55,.95,.8,.84,.08,stone)
 box('Kitchen wall cabinet',x,-4.77,1.99,.78,.38,.88,oak)
 cylinder('Cabinet knob',x,-4.10,.72,.02,.028,steel)
box('Kitchen refrigerator',4.40,-4.5,1.00,.82,.86,2,white,True)
box('Fridge door seam',4.4,-4.06,1.27,.8,.015,.015,stone)
box('White range',2.50,-4.07,.5,.78,.7,1,white,True)
box('Oven window',2.5,-3.70,.51,.56,.025,.44,black)
for dx in [-.20,.20]:
 for dz in [-.18,.18]:cylinder('Range burner',2.5+dx,-4.1+dz,1.01,.09,.018,black)
box('Microwave',2.5,-4.64,1.8,.73,.4,.38,white)
box('Breakfast peninsula',2.65,-2.65,.52,2.8,.60,1.04,wall,True)
box('Breakfast granite',2.65,-2.65,1.08,2.98,.83,.09,stone)
for x in [1.7,2.5,3.3]:
 box('Metal bar stool',x,-1.9,.64,.39,.39,.07,steel,True)
 for dx in [-.15,.15]:
  for dz in [-.15,.15]:box('Stool leg',x+dx,-1.9+dz,.32,.025,.025,.64,steel)
# Dining table and chairs
box('Dark wood dining top',3.0,.2,.78,1.8,1.15,.09,dark,True)
for x in [2.25,3.75]:box('Dining trestle',x,.2,.39,.11,.85,.75,dark)
for x in [2.4,3.5]:chair(x,1.05);chair(x,-.65)
cylinder('Dining vase',3,.2,.99,.1,.32,glass)
# Powder room at the front right, doorway faces the hall
box('Powder divider',3.1,2.25,.65,3.7,.14,1.3,wall,True)
box('Powder side lower',1.22,4.4,.65,.14,1.2,1.3,wall,True)
box('Powder side upper',1.22,2.55,.65,.14,.6,1.3,wall,True)
vanity(3.9,2.65,1.35);toilet(4.1,4.1)
# Staircase visual and portal landing (level change is a deliberate scene transition).
for i in range(10):box('Oak stair tread',-3.70,4.55-i*.19,.08+i*.13,1.4,.2,.16,floor,True)
box('Stair handrail',-4.52,3.55,.9,.08,2.2,.08,trim)
# Upstairs separate level at same local coordinates; runtime enables one level at a time.
levelRoot('UpperFloor');boundary();box('Upstairs carpet',0,0,.018,9.9,9.9,.03,carpet)
# Central corridor, with openings at z=1.8 and z=-3.7.
for x in [-.9,.9]:
 for z,d in [(4.25,1.5),(-.6,3.6),(-4.75,.5)]:box('Corridor partition',x,z,.62,.13,d,1.24,wall,True)
 # Bathroom doors stay open between -4.5 and -2.4.
# Bathrooms at rear, door gaps near corridor
for sign in [-1,1]:
 box('Bathroom partition',sign*3.4,-2.2,.65,3.0,.14,1.3,wall,True)
 bed(sign*2.9,.2,linen if sign<0 else blue)
 art(sign*2.9,-1.98,1.45)
 potted(sign*4.45,2.65)
 box('Bedroom dresser',sign*3.5,3.55,.47,1.85,.46,.94,dark,True)
 box('Bathroom tile floor',sign*2.95,-3.65,.04,3.9,2.65,.06,white)
 vanity(sign*2.8,-4.55,1.9)
 toilet(sign*4.4,-3.15)
 box('Bathtub apron',sign*1.8,-3.0,.33,1.40,.85,.66,white,True,.10)
 box('Bathtub water cavity',sign*1.8,-3.0,.675,1.14,.59,.015,stone,False,.15)
 window(sign*3.0,-4.88,1.6)
 for ix in range(8):box('Tile grout',sign*2.95-1.9+ix*.5,-3.65,.077,.008,2.6,.002,stone,False,0)
# Hall exit to stairwell
box('Upstairs landing mat',0,3.6,.05,1.5,1.1,.04,rug)
# Hidden collision-only coffee box should still export but not be rendered on web.
for o in coll.objects:
 if o.name.startswith('Coffee table collision'):o['collisionOnly']=True
scene['accuracy']='Reference-based furniture and finishes. Adjacency, dimensions and staircase connections inferred; no measured floor plan supplied.'
bpy.ops.wm.save_as_mainfile(filepath=BASE+'/artifacts/interior/interior.blend')
bpy.ops.object.select_all(action='DESELECT')
for o in coll.objects:o.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in coll.objects if o.type=='MESH')
bpy.ops.object.convert(target='MESH')
for o in coll.objects:
 if o.name.startswith('Coffee table collision'):o.hide_render=False
bpy.ops.export_scene.gltf(filepath=BASE+'/apps/web/public/models/kirkland-house/interior.glb',export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_animations=False)
print('Saved interior:',len(coll.objects),'objects, two levels')
