"""Documentary exchange reconstruction. Execute named phases through Blender MCP.
The master reference fixes the layout; all cameras share the same physical scene.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
ROOT=Path('/Users/evansmacbookpro/Desktop/Projects/tradely')
OUT=ROOT/'artifacts/trading-hall/exchange-v2'
SCENE='Tradely_Exchange_Documentary_v2'
P='EX2_'
POSTS=[('GTS foreground',(-6.2,-6.2),4.0,None),('NYSE foreground',(5.8,-6.6),4.2,'nyse'),('Central flag',(0,3.0),3.7,'flag'),('West flag',(-8.0,5.2),3.25,'flag'),('East flag',(8.0,5.6),3.25,'nyse'),('Northwest',(-5.4,13.0),3.1,'flag'),('Northeast',(4.9,13.2),3.1,'flag')]

def scene():
    s=bpy.data.scenes.get(SCENE)
    if not s:raise RuntimeError('Run setup first')
    bpy.context.window.scene=s
    return s

def collection(name):
    name=P+name
    c=bpy.data.collections.get(name)
    if not c:c=bpy.data.collections.new(name);scene().collection.children.link(c)
    return c

def mat(name):return bpy.data.materials[P+name]
def mesh(name,vertices,faces,material,group='Architecture',uv=None):
    d=bpy.data.meshes.new(P+name);d.from_pydata(vertices,[],faces);d.update()
    o=bpy.data.objects.new(P+name,d);collection(group).objects.link(o);d.materials.append(mat(material))
    if uv:
        layer=d.uv_layers.new(name='UVMap')
        for loop in d.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
    return o

def box(name,loc,size,material,group='Architecture',bevel=.008):
    x,y,z=[v*.5 for v in size]
    o=mesh(name,[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],material,group)
    o.location=loc
    if bevel:
        b=o.modifiers.new('Manufactured edge','BEVEL');b.width=bevel;b.segments=2
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def cylinder(name,a,b,r,material,group='Architecture',sides=12):
    a,b=Vector(a),Vector(b);length=(b-a).length
    vs=[(r*math.cos(i*math.tau/sides),r*math.sin(i*math.tau/sides),z) for z in [-length/2,length/2] for i in range(sides)]
    fs=[tuple(reversed(range(sides))),tuple(range(sides,sides*2))]+[(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
    o=mesh(name,vs,fs,material,group);o.location=(a+b)/2;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    for f in o.data.polygons:f.use_smooth=True
    return o

def ring(name,center,inner,outer,z0,z1,material,group,gap=24,segments=144,top_scale=1):
    # A true annular volume with a service opening toward +Y.
    start=math.radians(90+gap/2);extent=math.tau-math.radians(gap)
    vs=[]
    for i in range(segments+1):
        a=start+extent*i/segments
        for radius,z in [(inner,z0),(outer,z0),(inner*top_scale,z1),(outer*top_scale,z1)]:vs.append((center[0]+radius*math.cos(a),center[1]+radius*math.sin(a),z))
    fs=[]
    for i in range(segments):
        a=i*4;b=a+4
        fs += [(a,b,b+1,a+1),(a+2,a+3,b+3,b+2),(a+1,b+1,b+3,a+3),(a,a+2,b+2,b)]
    fs += [(0,1,3,2),(segments*4,segments*4+2,segments*4+3,segments*4+1)]
    o=mesh(name,vs,fs,material,group)
    for i,f in enumerate(o.data.polygons):f.use_smooth=(i%4 in [2,3] and i<len(fs)-2)
    bevel=o.modifiers.new('Ring edge finish','BEVEL');bevel.width=.012;bevel.segments=2
    o.modifiers.new('Weighted ring normals','WEIGHTED_NORMAL')
    return o

def tube_arc(name,center,r,z,material,group,start=0,end=math.tau,thickness=.035):
    c=bpy.data.curves.new(P+name,'CURVE');c.dimensions='3D';c.bevel_depth=thickness;c.bevel_resolution=2
    line=c.splines.new('POLY');steps=96;line.points.add(steps)
    for i,pt in enumerate(line.points):
        a=start+(end-start)*i/steps;pt.co=(center[0]+r*math.cos(a),center[1]+r*math.sin(a),z,1)
    o=bpy.data.objects.new(P+name,c);collection(group).objects.link(o);c.materials.append(mat(material));return o

def text(name,body,loc,size,material='Label',group='Architecture',angle=0):
    c=bpy.data.curves.new(P+name,'FONT');c.body=body;c.align_x='CENTER';c.size=size;c.extrude=.0007
    o=bpy.data.objects.new(P+name,c);collection(group).objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,angle);c.materials.append(mat(material));return o

def material(name,color,rough=.5,metal=0,emission=0):
    m=bpy.data.materials.new(P+name);m.use_nodes=True;m.diffuse_color=(*color,1)
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    return m

def textured(name,file,emission=0):
    m=material(name,(.7,.7,.7),.45);n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
    t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(OUT/'textures'/file),check_existing=True);t.image.pack();l.new(t.outputs['Color'],p.inputs['Base Color'])
    if emission:l.new(t.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=emission
    return m

def grain(m,c1,c2,scale=(1,25,3),rough=.45):
    n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
    tex=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=scale;l.new(tex.outputs['Generated'],mapping.inputs[0])
    noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=5;noise.inputs['Detail'].default_value=3;noise.inputs['Roughness'].default_value=.7;l.new(mapping.outputs['Vector'],noise.inputs['Vector'])
    ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.22;ramp.color_ramp.elements[0].color=(*c1,1);ramp.color_ramp.elements[1].position=.8;ramp.color_ramp.elements[1].color=(*c2,1);l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Base Color'])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.0015;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal']);p.inputs['Roughness'].default_value=rough

def setup():
    if bpy.data.scenes.get(SCENE):raise RuntimeError('Scene already exists; resume phases instead of replacing it.')
    s=bpy.data.scenes.new(SCENE);bpy.context.window.scene=s;s.unit_settings.system='METRIC'
    for args in [('Stone',(.52,.46,.35),.78,0),('StoneDark',(.29,.27,.22),.8,0),('Oak',(.47,.27,.09),.44,0),('Fascia',(.19,.12,.07),.46,0),('PaintedMetal',(.036,.043,.047),.47,.4),('Equipment',(.015,.019,.023),.42,.12),('Tray',(.11,.12,.115),.64,.25),('Steel',(.23,.21,.17),.4,.65),('Keys',(.11,.125,.135),.67,0),('Paper',(.64,.66,.62),.85,0),('Label',(.76,.79,.77),.6,0),('Glass',(.7,.82,.9),.07,0),('Fixture',(.8,.82,.77),.4,0,3),('Navy',(.018,.035,.065),.8,0),('NavyAlt',(.027,.048,.077),.85,0),('Trousers',(.022,.026,.035),.8,0),('Hair',(.033,.024,.019),.8,0),('Skin',(.47,.29,.19),.6,0),('SkinDark',(.20,.103,.055),.62,0),('Shirt',(.60,.67,.70),.8,0)]:material(*args)
    grain(mat('Oak'),(.28,.13,.038),(.61,.37,.13),(1,30,2),.43)
    grain(mat('Fascia'),(.075,.045,.025),(.27,.17,.093),(1,3,28),.48)
    textured('Markets','markets.png',.9);textured('Flag','flag.png',.85);textured('NYSE','nyse.png',.85)
    glass=mat('Glass').node_tree.nodes.get('Principled BSDF');glass.inputs['Transmission Weight'].default_value=1;glass.inputs['IOR'].default_value=1.46
    s.world=bpy.data.worlds.new(P+'Daylight');s.world.use_nodes=True;w=s.world.node_tree.nodes.get('Background');w.inputs[0].default_value=(.62,.73,.89,1);w.inputs[1].default_value=.35
    s['phases']='setup';s['reference']='hall-documentary-imax-v2 and the four generated camera references';s['units_note']='Approximate proportions reconstructed from photos, not a measured survey.'
    print('Created independent documentary exchange scene.')

def architecture():
    s=scene();g='Architecture'
    box('Floor',(0,2.5,-.14),(32,37,.28),'Oak',g,0)
    # Narrow oak strips with staggered joints, grouped as one thin geometry mesh.
    vs=[];fs=[]
    for row in range(260):
        x=-15.6+row*.12;b=len(vs);vs += [(x,-16,.002),(x+.0018,-16,.002),(x+.0018,21,.002),(x,21,.002)];fs.append((b,b+1,b+2,b+3))
        for j in range(23):
            y=-16+j*1.65+(row%3)*.55;b=len(vs);vs += [(x,y,.002),(x+.12,y,.002),(x+.12,y+.0018,.002),(x,y+.0018,.002)];fs.append((b,b+1,b+2,b+3))
    mesh('Oak plank joints',vs,fs,'Fascia',g)
    box('Left historic wall',(-16,2.5,6),(.5,37,12),'Stone',g,.025)
    box('Right historic wall',(16,2.5,6),(.5,37,12),'Stone',g,.025)
    box('Rear lower wall',(0,20.6,2),(32,.55,4),'Stone',g,.025)
    box('Rear upper entablature',(0,20.6,11.65),(32,.55,1.0),'Stone',g,.025)
    box('Ceiling',(0,2.5,12.1),(32,37,.25),'StoneDark',g,.01)
    for side in [-1,1]:
        x=side*15.7
        for y in [-13,-6,1,8,15]:
            box('Limestone pilaster',(x,y,5.9),(.65,.70,11.8),'Stone',g,.025)
            for z,w,h in [(.2,1.05,.4),(4.2,.95,.22),(10.8,1.1,.25),(11.2,1.3,.25)]:box('Classical stone molding',(x-side*.13,y,z),(.72,w,h),'Stone',g,.018)
            for dy in [-.19,0,.19]:box('Pilaster groove',(x-side*.34,y+dy,6.9),(.015,.035,7.3),'StoneDark',g,.003)
        box('Gallery ledge',(side*14.9,2.5,4.28),(1.7,37,.22),'StoneDark',g,.01)
        for y in [i*.55-15.5 for i in range(66)]:cylinder('Gallery baluster',(side*14.0,y,4.38),(side*14.0,y,5.25),.022,'PaintedMetal',g,8)
        cylinder('Gallery handrail',(side*14,-15.5,5.3),(side*14,20.2,5.3),.035,'PaintedMetal',g)
    for x in [-12,-8,-4,0,4,8,12]:
        box('Window glass',(x,20.48,7.7),(3.62,.035,6.7),'Glass',g,0)
        for dx in [-1.85,-.9,0,.9,1.85]:box('Window upright',(x+dx,20.32,7.7),(.08,.18,6.85),'PaintedMetal',g,.005)
        for z in [4.3,5.8,7.4,9.0,11.1]:box('Window crossbar',(x,20.32,z),(3.75,.18,.08),'PaintedMetal',g,.005)
        box('Window stone pier',(x-1.99,20.4,7.7),(.18,.5,6.9),'Stone',g,.01)
    for y in [-12,-5,2,9,16]:
        cylinder('Overhead pipe',(-15.4,y,9.1),(15.4,y,9.1),.11,'Steel',g,16)
        cylinder('Parallel utility pipe',(-15.4,y+.3,9.45),(15.4,y+.3,9.45),.045,'PaintedMetal',g,10)
        for x in [-12,-6,0,6,12]:
            cylinder('Ceiling hanger',(x,y,9.2),(x,y,12),.017,'Steel',g,8)
            box('Linear work light housing',(x,y,8.92),(2.15,.32,.11),'Equipment',g,.012)
            box('Linear light diffuser',(x,y,8.85),(1.92,.22,.018),'Fixture',g,.005)
    for x in [-12,-6,0,6,12]:cylinder('Longitudinal pipe',(x,-15.6,9.65),(x,20.1,9.65),.078,'Steel',g,14)
    for side in [-1,1]:
        for y,label in [(-9,'STIRRING TRUE'),(5,'NYSE'),(15,'THE EXCHANGE')]:
            b=box('Suspended wall banner',(side*15.28,y,8.2),(.055,4.4,2.3),'Equipment',g,.002)
            # Lettering faces into the room.
            t=text('Banner lettering',label,(side*15.21,y,8.1),.36,'Label',g,-side*math.pi/2)
    # Upper wall quotation boards are permanent, correctly scaled display surfaces.
    for x in [-12,-7,-2,3,8,13]:
        display('Perimeter board',(x,20.02,3.56),0,2.8,.82,int(x+12)%16,g)
    s['phases']+=' architecture';print('Architecture built:',len(s.objects),'objects')

def display(name,center,angle,width,height,index,group,material='Markets',lean=0):
    # Local horizontal axis +X; outward normal -Y. Rotation places it tangentially.
    zshift=math.sin(lean)*height*.5
    vs=[(-width/2,-zshift,-height/2),(width/2,-zshift,-height/2),(width/2,zshift,height/2),(-width/2,zshift,height/2)]
    if material=='Markets':
        c=index%4;r=(index//4)%4;uv=[((c+u)/4,1-(r+1-v)/4) for u,v in [(0,0),(1,0),(1,1),(0,1)]]
    else:uv=[(0,0),(1,0),(1,1),(0,1)]
    o=mesh(name,vs,[(0,1,2,3)],material,group,uv);o.location=center;o.rotation_euler.z=angle;o['screen_id']=index;o['screen_role']='market' if material=='Markets' else material.lower();return o

def local_position(center,r,a,z):return (center[0]+r*math.cos(a),center[1]+r*math.sin(a),z)

def posts(start=0,end=7):
    s=scene()
    for post_id in range(start,end):
        label,center,r,tower=POSTS[post_id];g='Post %02d - '%(post_id+1)+label
        ring('Pod base',center,r-.42,r,.05,.95,'Fascia',g)
        ring('Black toe kick',center,r-.30,r+.025,.04,.13,'Equipment',g)
        ring('Work surface',center,r-.88,r+.27,1.00,1.07,'Tray',g)
        tube_arc('Counter bumper',center,r+.265,1.02,'Equipment',g,thickness=.032)
        ring('Display fascia',center,r-.32,r+.11,2.58,3.04,'Fascia',g,top_scale=.975)
        ring('Upper equipment tray',center,1.28,r+.035,3.05,3.14,'Tray',g)
        for radius in [1.28,r+.08]:tube_arc('Upper safety rail',center,radius,3.22,'Steel',g,thickness=.035)
        station_count=24 if r>=3.7 else 20
        for i in range(station_count):
            a=math.tau*i/station_count
            if abs((a-math.pi/2+math.pi)%math.tau-math.pi)<.27:continue
            angle=a+math.pi/2
            loc=local_position(center,r+.13,a,2.18)
            w=2*r*math.sin(math.pi/station_count)*.93
            frame=box('Upper market bezel',loc,(w+.035,.075,.74),'Equipment',g,.013);frame.rotation_euler=(-.10,0,angle)
            display('Upper quotation screen',local_position(center,r+.175,a,2.18),angle,w,.69,(post_id*5+i)%16,g,lean=.10)
            if i%3==0:
                text('Ring sponsor', ['NYSE','GTS','ICE'][i%3 if post_id%2 else (i//3)%3],local_position(center,r+.125,a,2.73),.20,'Label',g,angle)
                cylinder('Canopy upright',local_position(center,r-.70,a,1.04),local_position(center,r-.70,a,3.1),.039,'PaintedMetal',g)
                cylinder('Radial canopy spar',local_position(center,1.25,a,3.14),local_position(center,r,a,3.14),.044,'PaintedMetal',g)
            # Desktop equipment faces the operator outside the island.
            pos=local_position(center,r-.13,a,1.42)
            body=box('Desktop monitor',pos,(.61,.066,.40),'Equipment',g,.014);body.rotation_euler.z=angle
            display('Desktop data screen',local_position(center,r-.091,a,1.424),angle,.565,.353,(post_id*7+i+4)%16,g)
            cylinder('Monitor stand',local_position(center,r-.16,a,1.07),local_position(center,r-.16,a,1.32),.022,'PaintedMetal',g)
            base=box('Monitor foot',local_position(center,r-.15,a,1.085),(.26,.20,.028),'Equipment',g,.009);base.rotation_euler.z=angle
            keyboard(local_position(center,r+.045,a,1.094),angle,g)
            if i%4==0:
                phone=box('Dealer telephone',local_position(center,r-.13,a+.074,1.14),(.20,.19,.12),'Equipment',g,.02);phone.rotation_euler.z=angle
                paper=box('Working papers',local_position(center,r-.19,a-.08,1.084),(.18,.25,.004),'Paper',g,.001);paper.rotation_euler.z=angle+.13
            if i%2==0:
                tray=box('Top radial equipment',local_position(center,r-.73,a,3.17),(.7,.5,.095),'PaintedMetal',g,.006);tray.rotation_euler.z=angle
                cylinder('Data cable',local_position(center,r-.8,a,3.21),local_position(center,1.4,a+.08,3.22),.011,'Equipment',g,6)
        for a in [0,math.pi,math.pi*1.5]:text('Base exchange lettering','NEW YORK STOCK EXCHANGE',local_position(center,r+.012,a,.46),.12,'Label',g,a+math.pi/2)
        if tower:
            box('Tower core',(center[0],center[1],4.92),(2.0,2.0,3.84),'Equipment',g,.025)
            box('Tower plinth',(center[0],center[1],3.44),(2.18,2.18,.50),'PaintedMetal',g,.02)
            for side in range(4):
                a=side*math.pi/2;angle=a+math.pi/2
                material='Flag' if tower=='flag' and side%2 else 'NYSE'
                if tower=='flag' and side==3:material='Flag'
                display('Tower display',local_position(center,1.018,a,5.1),angle,1.90,3.2,post_id,g,material)
            for dx in [-.97,.97]:
                for dy in [-.97,.97]:box('Tower seam',(center[0]+dx,center[1]+dy,5.1),(.028,.028,3.5),'PaintedMetal',g,.004)
        else:
            for a in [0,math.pi/2,math.pi,3*math.pi/2]:
                cabinet=box('Inner equipment cabinet',local_position(center,1.7,a,.7),(.75,.48,1.4),'Equipment',g,.012);cabinet.rotation_euler.z=a
        print('Built circular trading post',post_id+1,label)
    s['phases']+=f' posts{start}-{end}'

def keyboard(loc,angle,group):
    o=box('Keyboard',loc,(.42,.15,.025),'Equipment',group,.008);o.rotation_euler.z=angle
    vs=[];fs=[]
    for row in range(5):
        for col in range(12):
            x=-.192+col*.033;y=-.06+row*.026;b=len(vs);vs += [(x,y,.016),(x+.025,y,.016),(x+.025,y+.019,.016),(x,y+.019,.016)];fs.append((b,b+1,b+2,b+3))
    k=mesh('Keyboard keycaps',vs,fs,'Keys',group);k.location=loc;k.rotation_euler.z=angle

def sphere(name,loc,scale,material,group):
    key=P+'unit_sphere'
    d=bpy.data.meshes.get(key)
    if not d:
        vs=[];fs=[];segments=20;rings=14
        for j in range(rings+1):
            a=math.pi*j/rings
            for i in range(segments):
                t=math.tau*i/segments;vs.append((math.sin(a)*math.cos(t),math.sin(a)*math.sin(t),math.cos(a)))
        for j in range(rings):
            for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;fs.append((a,b,b+segments,a+segments))
        d=bpy.data.meshes.new(key);d.from_pydata(vs,[],fs);d.update()
        for f in d.polygons:f.use_smooth=True
    # Per-object materials use object-linked slots on the shared shape.
    o=bpy.data.objects.new(P+name,d);collection(group).objects.link(o);o.location=loc;o.scale=scale
    if not d.materials:d.materials.append(mat(material))
    o.material_slots[0].link='OBJECT';o.material_slots[0].material=mat(material);return o

def people():
    s=scene();g='Background traders - editable'
    placements=[(-1.3,-7.8,.3),(0.15,-7.3,2.3),(1.1,-8.3,-1.3),(-1.0,-3.4,1.3),(2.8,-1.8,-1.6),(-11,-4.2,2.4),(11,-3.5,3.0),(-4.0,5.5,1.9),(4.2,5.5,-1.2),(-2.0,9.0,.2),(2.4,10,2.7),(-10.8,10.0,.4),(10.6,12.3,-1.3),(1.1,16.8,1.4)]
    for index,(x,y,angle) in enumerate(placements):
        root=bpy.data.objects.new(P+'Trader %02d'%index,None);collection(g).objects.link(root);root.location=(x,y,0);root.rotation_euler.z=angle
        parts=[];skin='SkinDark' if index%4==0 else 'Skin';coat='Navy' if index%2 else 'NavyAlt'
        def sp(n,l,sc,m):o=sphere(n,l,sc,m,g);o.parent=root;parts.append(o);return o
        def bx(n,l,sc,m,b=.01):o=box(n,l,sc,m,g,b);o.parent=root;parts.append(o);return o
        def limb(n,a,b,r,m):
            a,b=Vector(a),Vector(b);o=sp(n,(a+b)/2,(r,r,(b-a).length*.59),m);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
        sp('Jacket',(0,0,1.24),(.25,.15,.37),coat)
        sp('Shoulders',(0,0,1.44),(.29,.145,.15),coat)
        sp('Pelvis',(0,0,.87),(.205,.125,.17),'Trousers')
        for side in [-1,1]:
            dx=side*.105;step=.08 if index%3==0 and side==1 else 0
            limb('Trouser upper leg',(dx,0,.90),(dx,-step,.51),.087,'Trousers')
            limb('Trouser lower leg',(dx,-step,.53),(dx,-step,.13),.065,'Trousers')
            sp('Shoe',(dx,-step-.055,.065),(.080,.145,.064),'Equipment')
            shoulder=(side*.25,0,1.44);elbow=(side*.30,-.08,1.13)
            wrist=(side*.14,-.27,1.07) if index%3!=2 else (side*.30,-.07,.92)
            limb('Jacket upper sleeve',shoulder,elbow,.080,coat);limb('Jacket lower sleeve',elbow,wrist,.061,coat)
            sp('Hand',wrist,(.043,.038,.068),skin)
        sp('Neck',(0,0,1.58),(.066,.063,.10),skin)
        sp('Head',(0,-.005,1.745),(.104,.092,.139),skin)
        sp('Hair',(0,.012,1.81),(.106,.091,.081),'Hair')
        sp('Nose',(0,-.091,1.745),(.021,.028,.031),skin)
        for side in [-1,1]:
            sp('Ear',(side*.103,.005,1.741),(.018,.025,.038),skin)
            sp('Eye',(side*.036,-.087,1.778),(.011,.004,.006),'Hair')
        bx('Broker badge',(-.13,-.145,1.39),(.07,.004,.06),'Paper',.001)
        if index%3!=2:bx('Handheld trading pad',(0,-.28,1.08),(.17,.10,.015),'Equipment',.005)
    s['phases']+=' background_traders';print('Added',len(placements),'editable background traders')

def lighting_cameras():
    s=scene();g='Lighting and cameras'
    def area(name,loc,target,power,color,width,height):
        d=bpy.data.lights.new(P+name,'AREA');d.energy=power;d.color=color;d.shape='RECTANGLE';d.size=width;d.size_y=height
        o=bpy.data.objects.new(P+name,d);collection(g).objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    for x in [-12,-8,-4,0,4,8,12]:area('Window daylight',(x,20.1,8.0),(x*.6,0,1.4),1500,(.80,.88,1),3.5,6)
    for y in [-11,-3,5,13]:
        for x in [-10,0,10]:area('Practical overhead',(x,y,8.7),(x,y,0),450,(1,.86,.67),2.1,1.0)
    area('Front room bounce',(0,-15,7),(0,3,2),1100,(.86,.90,1),15,6)
    # Four photographic cameras plus the master reconstruction overview.
    cams=[('00-master',(11.5,-19,9.0),(-.4,4.2,2.0),48),('01-reverse-balcony',(-12,18.5,8.6),(1,-3,2.1),48),('02-central-aisle',(0,-15.5,1.72),(0,4.0,3.5),57),('03-workstation-close',(1.0,-11.2,1.72),(5.7,-6.8,1.65),68),('04-side-overview',(-12.5,-16,10.7),(1.5,4.3,2.0),50)]
    for name,loc,target,lens in cams:
        c=bpy.data.cameras.new(P+name);o=bpy.data.objects.new(P+name,c);collection(g).objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();c.lens=lens;c.sensor_width=70;c.clip_end=150
    s.camera=bpy.data.objects[P+'00-master'];s.render.engine='CYCLES';s.cycles.samples=96;s.cycles.use_denoising=True;s.cycles.max_bounces=8;s.cycles.diffuse_bounces=4;s.cycles.glossy_bounces=4;s.cycles.transmission_bounces=6;s.cycles.transparent_max_bounces=8
    s.render.resolution_x=1800;s.render.resolution_y=948;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX';s.view_settings.exposure=.65
    s['phases']+=' lighting_cameras';print('Cycles cameras and natural mixed lighting ready')

def save():
    s=scene();OUT.mkdir(parents=True,exist_ok=True)
    bpy.data.libraries.write(str(OUT/'exchange-documentary-v2.blend'),{s},fake_user=True)
    report={'scene':SCENE,'objects':len(s.objects),'posts':[{'name':n,'center':c,'radius':r,'tower':t} for n,c,r,t in POSTS],'cameras':[o.name for o in s.objects if o.type=='CAMERA'],'marketScreens':sum(1 for o in s.objects if o.get('screen_role')=='market'),'towerFaces':sum(1 for o in s.objects if o.get('screen_role') in ['flag','nyse']),'phases':s['phases'],'renderer':'Cycles path tracing','samples':s.cycles.samples,'reference':'../references/hall-documentary-imax-v2.png','scaleNote':s['units_note']}
    (OUT/'scene-manifest.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report))

def refine_reference():
    s=scene()
    # Remove only this scene's solid prototype tray meshes.
    for o in list(s.objects):
        if o.name.startswith(P+'Upper equipment tray'):bpy.data.objects.remove(o,do_unlink=True)
    for post_id,(label,center,r,tower) in enumerate(POSTS):
        g='Post %02d - '%(post_id+1)+label
        ring('Open equipment tray',center,r-.66,r+.035,3.05,3.13,'Tray',g)
        tube_arc('Inner cable guard',center,r-.68,3.23,'PaintedMetal',g,thickness=.026)
        # Open center bays: visible working equipment below the top canopy.
        ring('Inner workstation rail',center,1.34,r-1.00,.94,1.0,'Equipment',g,gap=50)
        count=16 if r>=3.7 else 12
        for i in range(count):
            a=math.tau*i/count;angle=a-math.pi/2
            loc=local_position(center,r-1.10,a,1.39)
            monitor=box('Inner monitor case',loc,(.60,.065,.39),'Equipment',g,.012);monitor.rotation_euler.z=angle
            display('Inner market screen',local_position(center,r-1.139,a,1.395),angle,.56,.35,8+(i+post_id)%8,g)
            cylinder('Inner stand',local_position(center,r-1.1,a,1.0),loc,.023,'PaintedMetal',g)
            rack=box('Equipment rack',local_position(center,1.75,a,.49),(.43,.36,.90),'Equipment',g,.008);rack.rotation_euler.z=angle
            # Dense practical cabling and cross-members, not decorative light strips.
            for j in range(3):
                aa=a+j*.018
                cylinder('Cable bundle',local_position(center,1.4,aa,3.18+j*.017),local_position(center,r-.35,aa+.12,3.19+j*.017),.008,'Equipment',g,6)
            for j in range(3):
                tube_arc('Cable loop',center,r-.40+j*.045,3.18+j*.015,'Equipment',g,a,a+.32,thickness=.009)
        if tower:
            for o in list(collection(g).objects):
                if o.name.startswith(P+'Tower core'):o.location.z=5.37;o.dimensions.z=4.70
                elif o.name.startswith(P+'Tower display'):
                    o.location.z=5.50;o.scale.z=1.22
                elif o.name.startswith(P+'Tower seam'):o.location.z=5.48;o.scale.z=1.20
    # A less reflective industrial material palette.
    for name,color in [('Tray',(.032,.039,.043)),('Steel',(.11,.105,.091)),('PaintedMetal',(.020,.026,.030)),('Equipment',(.006,.010,.014)),('Navy',(.006,.012,.026)),('NavyAlt',(.012,.022,.038))]:
        m=mat(name);m.diffuse_color=(*color,1);m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*color,1)
    mat('Steel').node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.52
    # Reuse the already available CC0 veneer maps, with independent floor/fascia materials.
    texture_root=ROOT/'apps/web/public/models/trading-hall/textures'
    for name,tint in [('OakPBR',(.80,.56,.26)),('FasciaPBR',(.30,.19,.10))]:
        m=material(name,(.5,.4,.2),.47);nodes=m.node_tree.nodes;links=m.node_tree.links;bsdf=nodes.get('Principled BSDF')
        maps={}
        for suffix in ['Diffuse','Rough','nor_gl']:
            image=bpy.data.images.load(str(texture_root/('natural_walnut_veneer_'+suffix+'.jpg')),check_existing=True);image.pack()
            node=nodes.new('ShaderNodeTexImage');node.image=image;maps[suffix]=node
        multiply=nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1;multiply.inputs[2].default_value=(*tint,1);links.new(maps['Diffuse'].outputs['Color'],multiply.inputs[1]);links.new(multiply.outputs[0],bsdf.inputs['Base Color'])
        links.new(maps['Rough'].outputs['Color'],bsdf.inputs['Roughness'])
        norm=nodes.new('ShaderNodeNormalMap');norm.inputs['Strength'].default_value=.16;links.new(maps['nor_gl'].outputs['Color'],norm.inputs['Color']);links.new(norm.outputs[0],bsdf.inputs['Normal'])
    for o in s.objects:
        if o.type!='MESH':continue
        is_floor=o.name.split('.')[0]==P+'Floor'
        is_fascia=any(slot.material==mat('Fascia') for slot in o.material_slots)
        if not(is_floor or is_fascia):continue
        if is_floor:o.data.materials[0]=mat('OakPBR')
        elif is_fascia:o.data.materials[0]=mat('FasciaPBR')
        layer=o.data.uv_layers.new(name='UVMap') if not o.data.uv_layers else o.data.uv_layers[0]
        for poly in o.data.polygons:
            for idx in poly.loop_indices:
                v=o.matrix_world@o.data.vertices[o.data.loops[idx].vertex_index].co
                layer.data[idx].uv=(v.y*.65,v.x*7.0) if is_floor else (v.x*.20+v.y*.13,v.z*1.8)
    # Refresh every quotation panel with the denser, blue market-table atlas.
    image=bpy.data.images.load(str(OUT/'textures'/'markets-v2.png'),check_existing=False);image.pack()
    for node in mat('Markets').node_tree.nodes:
        if node.type=='TEX_IMAGE':node.image=image
    for o in s.objects:
        if o.type=='MESH' and o.name.startswith(P+'Upper quotation screen'):
            idx=int(o.get('screen_id',0))%8;c=idx%4;r=idx//4
            for loop in o.data.loops:
                u,v=[(0,0),(1,0),(1,1),(0,1)][loop.vertex_index]
                o.data.uv_layers[0].data[loop.index].uv=((c+u)/4,1-(r+1-v)/4)
        if o.type=='LIGHT':
            if o.name.startswith(P+'Window daylight'):
                o.data.energy=850;o.location.y=21.15;o.rotation_euler=(-math.pi/2,0,0)
                if hasattr(o,'visible_camera'):o.visible_camera=False
            elif o.name.startswith(P+'Practical overhead'):o.data.energy=260
            elif o.name.startswith(P+'Front room bounce'):o.data.energy=350
    s.world.node_tree.nodes.get('Background').inputs[1].default_value=.12
    s.view_settings.exposure=.15
    cam=bpy.data.objects[P+'00-master'];cam.location=(0,-17,8.8);cam.rotation_euler=(Vector((0,4,2.2))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=45
    s.render.use_persistent_data=True
    s['phases']+=' open_bays_dense_cabling_photographic_materials'
    print('Opened trading post interiors, added inner terminals/cabling, refined mixed lighting and master composition.')

def finish_reconstruction():
    s=scene();g='Architecture'
    # Close the room behind the original viewpoint so reverse shots remain interior.
    box('Front limestone wall',(0,-20.4,6),(32,.5,12),'Stone',g,.025)
    box('Front floor extension',(0,-18,-.14),(32,4,.28),'OakPBR',g,0)
    box('Front ceiling extension',(0,-18,12.1),(32,4,.25),'StoneDark',g,.01)
    for side in [-1,1]:box('Front sidewall return',(side*16,-18,6),(.5,4,12),'Stone',g,.02)
    for x in [-10,0,10]:
        box('Entry surround',(x,-20.10,1.65),(3.7,.25,3.3),'StoneDark',g,.02)
        box('Entry doors',(x,-19.94,1.51),(3.35,.07,3.02),'Equipment',g,.012)
        for side in [-1,1]:
            box('Entry door panel',(x+side*.81,-19.90,1.64),(1.43,.024,2.45),'Tray',g,.004)
            cylinder('Door handle',(x+side*.13,-19.83,1.12),(x+side*.13,-19.83,1.61),.023,'Steel',g)
    for x,label in [(-9,'THE EXCHANGE'),(0,'NYSE'),(9,'STIRRING TRUE')]:
        box('Front wall banner',(x,-20.06,8.05),(6.0,.07,2.75),'Equipment',g,.002)
        text('Front banner lettering',label,(x,-20.00,7.9),.48,'Label',g,math.pi)
    for post_id,(label,center,r,tower) in enumerate(POSTS):
        group='Post %02d - '%(post_id+1)+label
        ring('Inner raised equipment floor',center,0 if not tower else .8,r-.80,.09,.15,'Equipment',group,gap=50)
    # More tailored jacket silhouettes, rather than round proxy torsos.
    group='Background traders - editable'
    for old in list(s.objects):
        if old.name.split('.')[0]!=P+'Jacket':continue
        parent=old.parent;material_name=old.material_slots[0].material.name[len(P):]
        vs=[];fs=[];levels=[(.90,.19,.115),(1.05,.215,.13),(1.30,.23,.145),(1.47,.255,.13),(1.55,.22,.105)]
        for z,rx,ry in levels:
            for i in range(16):a=i*math.tau/16;vs.append((rx*math.cos(a),ry*math.sin(a),z))
        for row in range(len(levels)-1):
            for i in range(16):a=row*16+i;b=row*16+(i+1)%16;fs.append((a,b,b+16,a+16))
        fs+=[tuple(reversed(range(16))),tuple(range(64,80))]
        body=mesh('Tailored broker jacket',vs,fs,material_name,group);body.parent=parent
        for poly in body.data.polygons:poly.use_smooth=True
        shirt=mesh('Shirt collar insert',[(-.064,-.137,1.51),(.064,-.137,1.51),(0,-.146,1.25)],[(0,1,2)],'Shirt',group);shirt.parent=parent
        bpy.data.objects.remove(old,do_unlink=True)
    for name in ['Navy','NavyAlt','Trousers']:
        node=mat(name).node_tree.nodes.get('Principled BSDF');node.inputs['Roughness'].default_value=.94;node.inputs['Specular IOR Level'].default_value=.15
    s.render.resolution_x=1600;s.render.resolution_y=842;s.cycles.samples=64
    s['phases']+=' closed_room_tailored_background_figures'
    print('Closed reverse-view architecture and finalized the background character layer.')

def finalize_views():
    s=scene()
    for name,loc,target,lens in [('03-workstation-close',(-.15,-8.0,1.65),(2.2,-2.2,2.5),48),('04-side-overview',(-12.5,-15.5,8.1),(1.0,4.3,2.0),50)]:
        o=bpy.data.objects[P+name];o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();o.data.lens=lens
    actors=collection('Background traders - editable');actors.hide_render=True;actors.hide_viewport=True
    for o in s.objects:
        if o.name.startswith(P+'Front floor extension'):
            uv=o.data.uv_layers.new(name='UVMap') if not o.data.uv_layers else o.data.uv_layers[0]
            for loop in o.data.loops:
                v=o.matrix_world@o.data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(v.y*.65,v.x*7)
    s['background_figures']='Optional proportional models, hidden by default; not photorealistic scanned people.'
    s['phases']+=' verified_camera_views'
    s.camera=bpy.data.objects[P+'00-master']
    print('Final cameras avoid pipe occlusion. Optional scale figures retained in a hidden collection.')
