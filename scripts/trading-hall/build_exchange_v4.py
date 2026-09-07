"""Original Blender-built voxel-inspired exchange. Background process only.
Imagegen albedos remain local; no downloaded geometry is used.
"""
import bpy, math, random, json
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/trading-hall/exchange-v4'
TEX = OUT / 'textures/modern'
SCENE = 'Exchange_Modern_V4'
P = 'EX4_'
RNG = random.Random(4106)
POSTS = [((-6.2,-6.2),4.0,'GTS',False),((5.8,-6.6),4.2,'NYSE',True),((0,3),3.7,'NYSE',True),((-8,5.2),3.25,'GTS',True),((8,5.6),3.25,'NYSE',True),((-5.4,13),3.1,'ICE',True),((4.9,13.2),3.1,'NYSE',True)]
CAMERAS = [('00-entry',(0,-15.8,1.7),(0,3,2.65),45),('01-workstation',(0,-8,1.7),(2.2,-2.2,2.2),50),('02-central',(2.7,-2.9,1.7),(4,11,2.35),48)]
COUNTS = {}
MAT = {}
MAPS = {}

def group(name):
    full=P+name
    c=bpy.data.collections.get(full)
    if c is None:
        c=bpy.data.collections.new(full);bpy.context.scene.collection.children.link(c)
    return c

def mesh(name,vertices,faces,material,category='Architecture',uvs=None):
    data=bpy.data.meshes.new(P+name);data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(P+name,data);group(category).objects.link(obj)
    data.materials.append(MAT[material]);obj['asset_family']=name;obj['bake_group']=category
    layer=data.uv_layers.new(name='UVMap')
    if uvs:
        for loop in data.loops:layer.data[loop.index].uv=uvs[loop.vertex_index]
    else:
        scale=2 if material.startswith('Carpet') else .5
        for poly in data.polygons:
            axis=max(range(3),key=lambda i:abs(poly.normal[i]))
            for i in poly.loop_indices:
                v=data.vertices[data.loops[i].vertex_index].co
                layer.data[i].uv=((v.y,v.z) if axis==0 else (v.x,v.z) if axis==1 else (v.x,v.y))
                layer.data[i].uv*=scale
    COUNTS[name]=COUNTS.get(name,0)+1
    return obj

FACES=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
def cube_vertices(loc,size,angle=0):
    x,y,z=[v/2 for v in size];c,s=math.cos(angle),math.sin(angle)
    return [(loc[0]+a*c-b*s,loc[1]+a*s+b*c,loc[2]+d) for a,b,d in [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]]

def box(name,loc,size,material,category='Architecture',angle=0):
    return mesh(name,cube_vertices(loc,size,angle),FACES,material,category)

def segment(name,a,b,width,material,category='Architecture'):
    direction=Vector(b)-Vector(a);center=(Vector(a)+Vector(b))/2
    q=direction.to_track_quat('Z','Y');half=direction.length/2
    vs=[tuple(q@Vector(v)+center) for v in cube_vertices((0,0,0),(width,width,half*2))]
    return mesh(name,vs,FACES,material,category)

def annulus(name,center,inner,outer,z0,z1,material,n=24,category='Posts',gap=True):
    vs=[];fs=[]
    for i in range(n):
        if gap and i==n//4:continue
        a=math.tau*(i-.5)/n;b=math.tau*(i+.5)/n;offset=len(vs)
        for z in [z0,z1]:
            for r,t in [(inner,a),(outer,a),(outer,b),(inner,b)]:vs.append((center[0]+r*math.cos(t),center[1]+r*math.sin(t),z))
        fs.extend([tuple(offset+j for j in f) for f in FACES])
    return mesh(name,vs,fs,material,category)

def point(center,r,a,z):return (center[0]+r*math.cos(a),center[1]+r*math.sin(a),z)

def display(name,loc,angle,w,h,material,tile=0,category='Posts'):
    c,s=math.cos(angle),math.sin(angle)
    vs=[(loc[0]+x*c,loc[1]+x*s,loc[2]+z) for x,z in [(-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)]]
    if material.startswith('Markets'):
        col,row=tile%4,tile//4
        uv=[((col+u)/4,1-(row+1-v)/4) for u,v in [(0,0),(1,0),(1,1),(0,1)]]
    else:uv=[(0,0),(1,0),(1,1),(0,1)]
    o=mesh(name,vs,[(0,1,2,3)],material,category,uv);o['screen_role']='market' if material.startswith('Markets') else 'tower'
    return o

def letters(word,loc,height,angle=0,category='Posts'):
    # Architectural signs use legible extruded type; the surrounding forms
    # carry the subtle faceting without turning financial signage into pixels.
    data=bpy.data.curves.new(P+'Sign '+word,'FONT');data.body=word
    data.font=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial.ttf',check_existing=True)
    data.align_x='CENTER';data.align_y='CENTER';data.size=height*1.38
    data.extrude=.013;data.bevel_depth=.0015;data.bevel_resolution=1;data.resolution_u=4
    obj=bpy.data.objects.new(data.name,data);group(category).objects.link(obj)
    obj.location=loc;obj.rotation_euler=(math.pi/2,0,angle)
    bpy.context.view_layer.update()
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    geometry=evaluated.to_mesh()
    vertices=[tuple(obj.matrix_world@v.co) for v in geometry.vertices]
    faces=[tuple(p.vertices) for p in geometry.polygons]
    evaluated.to_mesh_clear();bpy.data.objects.remove(obj,do_unlink=True)
    return mesh('Exchange lettering '+word,vertices,faces,'Lettering',category)

def material(name,color,rough=.8,metal=0,emission=0):
    m=bpy.data.materials.new(P+name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    MAT[name]=m;return m

def textured(name,source,tint=(1,1,1),rough=.8,metal=0,emission=0):
    m=material(name,tint,rough,metal);m['color_factor']=[*tint,1]
    nodes,links=m.node_tree.nodes,m.node_tree.links;p=nodes.get('Principled BSDF')
    img=bpy.data.images.load(str(source),check_existing=True);img.pack()
    tex=nodes.new('ShaderNodeTexImage');tex.image=img
    multiply=nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1;multiply.inputs[2].default_value=(*tint,1)
    links.new(tex.outputs['Color'],multiply.inputs[1]);links.new(multiply.outputs[0],p.inputs['Base Color'])
    if emission:links.new(multiply.outputs[0],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=emission
    return m

def setup_materials():
    for family,rough,metal in [('Stone',.78,0),('Wood',.55,0),('Metal',.42,.65),('Carpet',.96,0)]:
        source=TEX/(family.lower()+'-color.png')
        image=bpy.data.images.load(str(source),check_existing=True)
        width,height=image.size;pixels=np.empty(width*height*4,dtype=np.float32);image.pixels.foreach_get(pixels)
        data=pixels.reshape(height,width,4);luma=data[:,:,:3].mean(axis=2)
        lo,hi=np.percentile(luma,[5,95]);relief=np.clip((luma-lo)/max(hi-lo,.001),0,1)
        dx=(np.roll(relief,-1,axis=1)-np.roll(relief,1,axis=1))*.5
        dy=(np.roll(relief,-1,axis=0)-np.roll(relief,1,axis=0))*.5
        normal=np.stack([-dx,-dy,np.ones_like(dx)],axis=-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
        rough_data=np.clip(rough+(relief-.5)*(.045 if family=='Carpet' else .12),.28,.995)
        MAPS[family]={}
        for kind,rgb in [('normal',normal*.5+.5),('roughness',np.repeat(rough_data[...,None],3,axis=-1))]:
            texture=bpy.data.images.new(P+family+' '+kind,width,height)
            texture.colorspace_settings.name='Non-Color'
            rgba=np.concatenate([rgb,np.ones((height,width,1),dtype=np.float32)],axis=-1).astype(np.float32)
            texture.pixels.foreach_set(rgba.ravel());texture.filepath_raw=str(TEX/(family.lower()+'-'+kind+'.png'));texture.file_format='PNG';texture.save();texture.pack()
            MAPS[family][kind]=texture
        for i,factor in enumerate([.88,.94,1.0]):
            m=textured(family+str(i),source,(factor,factor,factor),rough,metal)
            nodes,links=m.node_tree.nodes,m.node_tree.links;p=nodes.get('Principled BSDF')
            r=nodes.new('ShaderNodeTexImage');r.image=MAPS[family]['roughness'];links.new(r.outputs['Color'],p.inputs['Roughness'])
            t=nodes.new('ShaderNodeTexImage');t.image=MAPS[family]['normal'];n=nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.23 if family=='Carpet' else .07
            links.new(t.outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],p.inputs['Normal'])
    material('Brass',(.50,.45,.33),.36,.75)
    lettering=material('Lettering',(.62,.57,.43),.45,.35)
    nodes,links=lettering.node_tree.nodes,lettering.node_tree.links
    t=nodes.new('ShaderNodeTexImage');t.image=MAPS['Metal']['normal'];n=nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.10
    links.new(t.outputs['Color'],n.inputs['Color']);links.new(n.outputs[0],nodes.get('Principled BSDF').inputs['Normal'])
    material('Black',(.009,.013,.015),.88)
    material('Paper',(.32,.29,.22),.95)
    material('Folder',(.10,.13,.12),.9)
    material('Amber',(1,.82,.61),.7,0,3)
    material('WarmTrim',(1,.86,.70),.65,0,1.1)
    material('DimIndicator',(.15,.38,.3),.7,0,.6)
    glass=material('Glass',(.55,.68,.78),.12,0)
    glass.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value=1
    glass.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1.45
    # Thin architectural glazing transmits direct light without a costly caustic solve.
    nodes,links=glass.node_tree.nodes,glass.node_tree.links
    transparent=nodes.new('ShaderNodeBsdfTransparent');transparent.inputs['Color'].default_value=(.68,.79,.88,1)
    path=nodes.new('ShaderNodeLightPath');mix=nodes.new('ShaderNodeMixShader')
    links.new(path.outputs['Is Shadow Ray'],mix.inputs[0]);links.new(nodes.get('Principled BSDF').outputs['BSDF'],mix.inputs[1]);links.new(transparent.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],nodes.get('Material Output').inputs['Surface'])
    material('Exterior',(.01,.017,.025),.94)
    material('CityGlow',(.20,.34,.43),.8,0,.32)
    textured('Flag',TEX/'flag-color.png',(.88,.88,.88),.60,0,.10)
    market=ROOT/'artifacts/trading-hall/exchange-v2/textures/markets-v2.png'
    textured('Markets',market,(.78,.92,1.0),.40,0,.65)
    textured('MarketsDim',market,(.55,.72,.85),.50,0,.35)
    textured('MarketsOff',TEX/'metal-color.png',(.14,.2,.2),.5,0,0)

def architecture():
    # Carpet is an actual mesh, with a metre-scale grid useful for baked lighting.
    vs=[];fs=[]
    for iy in range(103):
        y=-20+iy*.4
        for ix in range(80):
            x=-16+ix*.4
            b=len(vs);vs.extend([(x,y,0),(x+.4,y,0),(x+.4,y+.4,0),(x,y+.4,0)]);fs.append((b,b+1,b+2,b+3))
    floor=mesh('Carpet floor',vs,fs,'Carpet0')
    floor.data.materials.append(MAT['Carpet1']);floor.data.materials.append(MAT['Carpet2'])
    for poly in floor.data.polygons:poly.material_index=RNG.choices([0,1,2],[.45,.45,.10])[0]
    for side in [-1,1]:
        box('Stone wall backing',(side*16,0,6),(.4,42,12),'Stone0')
        # Clean, precisely aligned stone panels retain subtle block-built depth.
        for z in range(16):
            for row in range(28):
                y=-19.6+row*1.45+(z%2)*.65
                box('Precision stone panel',(side*15.76,y,z*.68+.34),(.14,1.43,.664),'Stone'+str(RNG.randrange(3)))
        for y in [-15,-8,-1,6,13,19]:
            for z in range(23):
                box('Stepped pier',(side*15.42,y,z*.48+.24),(.72+(.12 if z%4==0 else 0),.96,.455),'Stone'+str(RNG.randrange(3)))
            for z,width in [(.22,1.35),(3.85,1.20),(9.8,1.45),(10.3,1.65)]:box('Pier ledge',(side*15.22,y,z),(.96,width,.24),'Stone1')
        box('Gallery ledge',(side*14.95,0,4.0),(1.55,40,.24),'Stone1')
        for y in range(-19,21):segment('Square gallery baluster',(side*14.2,y,4.12),(side*14.2,y,4.95),.045,'Metal0')
        segment('Gallery rail',(side*14.2,-19,4.98),(side*14.2,20,4.98),.065,'Metal1')
    box('Front wall',(0,-20.5,6),(32,.4,12),'Stone0')
    box('Rear lower wall',(0,20.8,1.8),(32,.4,3.6),'Stone0')
    box('Rear lintel',(0,20.8,11.4),(32,.5,1.2),'Stone1')
    for x in [-12,-8,-4,0,4,8,12]:
        box('Night glazing',(x,20.56,7.15),(3.6,.04,7.1),'Glass')
        for dx in [-1.85,-.92,0,.92,1.85]:box('Window mullion',(x+dx,20.4,7.15),(.11,.20,7.2),'Metal0')
        for z in [3.6,5.2,6.8,8.4,10.8]:box('Window crossbar',(x,20.35,z),(3.8,.22,.10),'Metal0')
        for z in range(15):box('Window stone pier',(x-2,20.45,z*.50+3.5),(.20,.56,.48),'Stone'+str(z%3))
        # Quantized rain streaks and exterior silhouettes are geometry.
        for i in range(14):
            xx=x+RNG.uniform(-1.7,1.7);zz=RNG.uniform(4,10.3)
            box('Rain on glass',(xx,20.49,zz),(.007,.009,RNG.uniform(.07,.32)),'CityGlow')
    for i in range(26):
        x=-25+i*2.0;z=RNG.uniform(5,15)
        box('Block city silhouette',(x,30+RNG.uniform(0,5),z/2),(RNG.uniform(1.2,2.3),3,z),'Exterior','Exterior')
        for j in range(int(z)):
            if RNG.random()<.55:box('Distant city window',(x+RNG.choice([-.4,.1,.4]),28.43,j+.4),(.16,.02,.25),'CityGlow','Exterior')
    box('Ceiling',(0,0,12.1),(32,42,.3),'Stone0')
    for y in [-16,-9,-2,5,12,19]:
        box('Main ceiling beam',(0,y,10.6),(32,.40,.65),'Metal0')
        for x in [-12,-6,0,6,12]:
            segment('Conduit hanger',(x,y,9.9),(x,y,11.9),.028,'Metal0')
    for x in [-12,-6,0,6,12]:
        box('Ceiling cross beam',(x,0,11.4),(.30,41,.32),'Metal0')
        segment('Square utility conduit',(x,-19,9.9),(x,20,9.9),.095,'Metal1')
    for y in [-12,-5,2,9,16]:segment('Transverse pipe',(-15.3,y,9.15),(15.3,y,9.15),.12,'Metal1')
    for x in [-10,0,10]:
        box('Entry door inset',(x,-20.24,1.7),(3.4,.13,3.4),'Metal0')
        letters('EXCHANGE',(x,-20.10,5),.48,math.pi,'Architecture')
    for x in [-12,-7,-2,3,8,13]:
        box('Perimeter display frame',(x,20.1,3.0),(2.85,.18,.87),'Metal1')
        display('Perimeter market display',(x,19.99,3.0),0,2.7,.75,'MarketsDim',int(x+12)%16,'Architecture')

def lamp(loc,angle,category='Props'):
    x,y,z=loc;c,s=math.cos(angle),math.sin(angle)
    def at(a,b,h):return (x+a*c-b*s,y+a*s+b*c,z+h)
    box('Task lamp foot',at(0,0,.03),(.22,.22,.06),'Metal1',category,angle)
    segment('Task lamp upright',at(0,0,.05),at(0,0,.49),.055,'Metal0',category)
    segment('Task lamp arm',at(0,0,.49),at(0,-.14,.62),.055,'Metal0',category)
    box('Lamp hood',at(0,-.16,.65),(.26,.22,.09),'Metal1',category,angle)
    box('Warm lamp core',at(0,-.16,.57),(.16,.14,.08),'Amber',category,angle)
    light('Task practical',at(0,-.18,.52),at(0,-.28,.05),12,(1,.86,.70),.17,.13)

def keyboard(loc,angle):
    box('Block keyboard',loc,(.46,.19,.035),'Metal0','Props',angle)
    c,s=math.cos(angle),math.sin(angle)
    for row in range(3):
        for col in range(10):
            x=(col-4.5)*.039;y=(row-1)*.044
            p=(loc[0]+x*c-y*s,loc[1]+x*s+y*c,loc[2]+.025)
            box('Keyboard key',p,(.031,.033,.013),'Metal2' if col%5 else 'Stone1','Props',angle)

def chair(loc,angle):
    x,y,z=loc;c,s=math.cos(angle),math.sin(angle)
    def at(a,b,h):return (x+a*c-b*s,y+a*s+b*c,z+h)
    box('Chair seat',at(0,0,.47),(.52,.48,.085),'Carpet1','Props',angle)
    box('Chair back frame',at(0,.20,.86),(.52,.075,.60),'Metal0','Props',angle)
    for row in range(5):
        box('Chair back upholstery',at(0,.148,.65+row*.098),(.45,.055,.085),'Carpet0','Props',angle)
    for side in [-1,1]:
        segment('Chair frame',at(side*.23,.18,.3),at(side*.23,.18,1.12),.038,'Metal1','Props')
        box('Chair armrest',at(side*.31,0,.7),(.07,.37,.05),'Metal1','Props',angle)
        segment('Chair arm support',at(side*.23,-.08,.47),at(side*.31,-.08,.70),.03,'Metal1','Props')
    segment('Chair stem',at(0,0,.10),at(0,0,.43),.075,'Metal0','Props')
    for i in range(5):
        a=i*math.tau/5
        segment('Chair foot',at(0,0,.1),at(math.cos(a)*.32,math.sin(a)*.32,.08),.04,'Metal0','Props')
        box('Chair caster',at(math.cos(a)*.32,math.sin(a)*.32,.05),(.08,.07,.08),'Black','Props',angle+a)

def tower(center,post_id):
    box('Tower core',(*center,6.08),(2.08,2.08,5.94),'Metal0','Towers')
    for side in range(4):
        a=side*math.pi/2;angle=a+math.pi/2
        loc=point(center,1.055,a,6.2)
        # Real stepped relief tiles carry portions of a single generated graphic.
        vertices=[];faces=[];uv=[];w=1.98;h=5.38;nx=8;ny=22
        for j in range(ny):
            for i in range(nx):
                u0,u1=i/nx,(i+1)/nx;v0,v1=j/ny,(j+1)/ny
                depth=.002*((i+j)%2);b=len(vertices)
                for xx,zz in [((u0-.5)*w,(v0-.5)*h),((u1-.5)*w,(v0-.5)*h),((u1-.5)*w,(v1-.5)*h),((u0-.5)*w,(v1-.5)*h)]:
                    vertices.append((loc[0]+xx*math.cos(angle)+depth*math.cos(a),loc[1]+xx*math.sin(angle)+depth*math.sin(a),loc[2]+zz))
                faces.append((b,b+1,b+2,b+3));uv.extend([(u0,v0),(u1,v0),(u1,v1),(u0,v1)])
        mesh('Tower display surface',vertices,faces,'Stone1' if post_id==1 else 'Flag','Towers',uv)
        if post_id==1:
            letters('NYSE',point(center,1.10,a,5.4),.50,angle,'Towers')
            for i in range(6):
                xx=(i-2.5)*.24
                position=(loc[0]+xx*math.cos(angle)+.055*math.cos(a),loc[1]+xx*math.sin(angle)+.055*math.sin(a),6.70)
                box('Voxel exchange bars',position,(.16,.035,1.45),'Lettering','Towers',angle)
        for dz in [-2.77,2.77]:box('Tower frame band',point(center,1.04,a,6.2+dz),(2.14,.11,.10),'Metal1','Towers',angle)
        for xx in [-1.04,1.04]:
            box('Tower vertical frame',(loc[0]+xx*math.cos(angle),loc[1]+xx*math.sin(angle),6.2),(.07,.10,5.65),'Metal1','Towers',angle)
        if side==3:letters('NYSE',point(center,1.1,a,3.30),.24,angle,'Towers')
    for i in range(4):
        a=i*math.pi/2
        light('Tower uplight',point(center,1.3,a,3.12),point(center,1.1,a,6.0),12,(1,.88,.72),.4,.16)

def posts():
    for post_id,(center,r,label,has_tower) in enumerate(POSTS):
        n=24 if r>=3.7 else 20
        annulus('Stepped toe rail',center,r-.4,r+.03,.04,.16,'Metal0',n)
        annulus('Toe champagne edge',center,r-.02,r+.035,.16,.19,'Brass',n)
        annulus('Recessed toe diffuser',center,r+.034,r+.041,.162,.173,'WarmTrim',n)
        annulus('Counter slab',center,r-.94,r+.28,1.0,1.10,'Metal2',n)
        annulus('Counter edge',center,r+.22,r+.31,.98,1.075,'Metal1',n)
        annulus('Upper equipment canopy',center,r-.70,r+.04,3.03,3.15,'Metal0',n)
        annulus('Canopy inner guard',center,r-.75,r-.68,3.14,3.23,'Metal1',n)
        annulus('Canopy outside rail',center,r+.05,r+.11,3.17,3.23,'Metal1',n)
        annulus('Recessed fascia diffuser',center,r+.08,r+.098,2.582,2.595,'WarmTrim',n)
        for side in range(4):
            a=side*math.pi/2
            light('Toe practical',point(center,r+.05,a,.19),point(center,r+.65,a,0),2.5,(1,.86,.70),1.6,.06)
        for i in range(n):
            if i==n//4:continue
            a=math.tau*i/n;angle=a+math.pi/2;length=2*r*math.tan(math.pi/n)*.975
            # Refined horizontal veneer panels with deliberate faceted joints.
            for row in range(3):
                box('Timber base panel',point(center,r-.04,a,.32+row*.23),(length-.014,.30,.22),'Wood'+str((i+post_id)%3),'Posts',angle)
            for row in range(2):
                box('Timber fascia panel',point(center,r-.02,a,2.70+row*.20),(length-.014,.26,.19),'Wood'+str((i+post_id)%3),'Posts',angle)
            segment('Panel stile',point(center,r+.12,a-math.pi/n,.20),point(center,r+.12,a-math.pi/n,.96),.032,'Brass','Posts')
            if i%3==0:
                box('Service access panel',point(center,r+.12,a,.62),(.24,.035,.22),'Metal1','Props',angle)
                for dz in [-.055,.055]:box('Panel fastener',point(center,r+.155,a,.62+dz),(.025,.015,.025),'Brass','Props',angle)
                segment('Canopy support',point(center,r-.73,a,1.08),point(center,r-.73,a,3.17),.075,'Metal0','Posts')
            if i%6==0:
                letters(label,point(center,r+.125,a,2.84),.22,angle)
                box('Fascia lamp hood',point(center,r+.22,a,3.25),(.20,.25,.09),'Metal1','Props',angle)
                box('Fascia lamp glow',point(center,r+.22,a,3.195),(.14,.12,.02),'Amber','Props',angle)
                light('Fascia practical',point(center,r+.24,a,3.17),point(center,r+.05,a,2.85),8,(1,.86,.70),.34,.18)
            width=length*.89
            box('Upper terminal shell',point(center,r+.09,a,2.18),(width+.10,.17,.83),'Metal0','Posts',angle)
            box('Upper terminal rim',point(center,r+.18,a,2.18),(width+.055,.035,.765),'Metal2','Posts',angle)
            panel='MarketsOff' if (i+post_id)%19==0 else 'MarketsDim' if i%4==0 else 'Markets'
            display('Upper market panel',point(center,r+.205,a,2.18),angle,width,.69,panel,(i+post_id*3)%8)
            box('Desktop terminal shell',point(center,r-.12,a,1.43),(.64,.12,.45),'Metal0','Posts',angle)
            box('Desktop terminal foot',point(center,r-.10,a,1.12),(.28,.21,.045),'Metal1','Props',angle)
            segment('Desktop terminal stand',point(center,r-.12,a,1.12),point(center,r-.12,a,1.32),.055,'Metal1','Props')
            display('Desktop market panel',point(center,r-.05,a,1.44),angle,.58,.37,panel,8+(i+post_id)%8)
            keyboard(point(center,r+.06,a,1.125),angle)
            if i%6==3:lamp(point(center,r+.14,a+.073,1.10),angle)
            if i%4==0:
                box('File folder',point(center,r-.04,a-.10,1.122),(.22,.30,.018),'Folder','Props',angle+.12)
                for sheet in range(3):box('Paper sheet',point(center,r-.04,a-.10,1.136+sheet*.003),(.19,.25,.003),'Paper','Props',angle+.1)
                box('Block telephone',point(center,r-.04,a+.08,1.17),(.20,.19,.10),'Metal1','Props',angle)
                box('Telephone receiver',point(center,r-.04,a+.08,1.24),(.25,.06,.045),'Black','Props',angle)
            if i%5==0:
                for j in range(5):
                    aa=a+j*.09
                    segment('Bundled canopy cable',point(center,r-.61,aa,3.19),point(center,1.25,aa+.08,3.20),.018,'Black','Props')
        for i in range(12):
            a=math.tau*i/12;angle=a-math.pi/2
            box('Inner terminal shell',point(center,r-1.1,a,1.45),(.59,.12,.41),'Metal0','Posts',angle)
            display('Inner market panel',point(center,r-1.17,a,1.45),angle,.53,.34,'MarketsDim',8+(i+post_id)%8)
        for a in [0,math.pi]:
            cabinet=point(center,r-.55,a,.55)
            box('Under-counter cabinet',cabinet,(.64,.48,.84),'Metal0','Props',a)
        if has_tower:tower(center,post_id)
    for loc,angle in [((-6.2,-11.3,0),0),((6.8,-12.1,0),.25),((-11.4,-6,0),math.pi/2),((11.3,-5,0),-math.pi/2),((-12.3,7,0),1.2),((12.1,8,0),-1.1),((0,8.0,0),math.pi)]:chair(loc,angle)
    chair((-2.73,-9.66,0),-.35)
    chair((2.20,-10.20,0),.35)

def light(name,loc,target,power,color,width,height):
    data=bpy.data.lights.new(P+name,'AREA');data.energy=power;data.color=color;data.shape='RECTANGLE';data.size=width;data.size_y=height
    obj=bpy.data.objects.new(data.name,data);group('Lighting').objects.link(obj);obj.location=loc;obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    obj.visible_camera=False
    obj.visible_glossy=False
    obj.visible_transmission=False
    obj['power_watts']=power;return obj

def lighting():
    for x in [-12,-8,-4,0,4,8,12]:light('Cold night window',(x,21.0,7),(x*.7,0,2),160,(.50,.67,.90),3.5,6.4)
    for x,power in [(-10,45),(10,65)]:
        box('Entry sconce housing',(x,-17.2,4.0),(.32,.23,.46),'Metal0')
        box('Entry sconce diffuser',(x,-17.06,4.0),(.21,.03,.32),'Amber')
        light('Entry practical',(x,-17.0,4),(x*.5,-5,1.7),power,(1,.88,.74),.22,.30)
    for x,y in [(x,y) for x in [-10,0,10] for y in [-12,-2,8,17]]:
        box('Suspended light housing',(x,y,8.90),(2.4,.36,.16),'Metal0')
        box('Overhead light diffuser',(x,y,8.80),(2.14,.21,.018),'Amber')
        for dx in [-1,1]:segment('Light suspension',(x+dx,y,9.02),(x+dx,y,10.7),.025,'Metal0')
        light('Overhead practical',(x,y,8.77),(x,y,0),260,(1,.88,.74),2.12,.2)
    s=bpy.context.scene;s.world=bpy.data.worlds.new(P+'Night');s.world.use_nodes=True
    bg=s.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.13,.17,.23,1);bg.inputs['Strength'].default_value=.10

def cameras():
    s=bpy.context.scene
    for name,location,target,lens in CAMERAS:
        data=bpy.data.cameras.new(P+name);o=bpy.data.objects.new(data.name,data);group('Cameras').objects.link(o)
        o.location=location;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();data.lens=lens;data.sensor_width=70;data.clip_end=150
    s.camera=bpy.data.objects[P+CAMERAS[0][0]]
    s.render.engine='CYCLES';s.cycles.samples=64;s.cycles.use_denoising=True;s.cycles.max_bounces=8
    s.render.resolution_x=1600;s.render.resolution_y=900;s.render.resolution_percentage=100
    s.view_settings.view_transform='AgX';s.view_settings.exposure=1.0
    s.render.image_settings.file_format='PNG'

def build():
    if not bpy.app.background:raise RuntimeError('This builder must run in a separate background Blender process.')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name=SCENE
    setup_materials();architecture();posts();lighting();cameras()
    s=bpy.context.scene;s.unit_settings.system='METRIC'
    s['art_direction']='Professional modern stock exchange, subtle voxel-inspired geometry, realistic physical lighting.'
    s['geometry_provenance']='Every physical asset authored in Blender by build_exchange_v4.py; no imported third-party geometry.'
    s['texture_provenance']='Five built-in imagegen outputs; exact prompts in scripts/trading-hall/v4-modern-imagegen-prompts.json.'
    report={'scene':SCENE,'objects':len(s.objects),'families':COUNTS,'marketScreens':sum(o.get('screen_role')=='market' for o in s.objects),'generatedTextures':['stone','wood','metal','carpet','flag'],'cameras':CAMERAS}
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'scene-manifest.json').write_text(json.dumps(report,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'exchange-modern-v4.blend'))
    print('V4_BUILT '+json.dumps(report))

if __name__=='__main__':build()
