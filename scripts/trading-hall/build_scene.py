"""Original, reference-led exchange hall. Run phases through Blender MCP.
Coordinates: Blender Z up, entrance at Y=-17. Exported GLB uses Three.js Y up.
"""
import bpy, math, json, random
from mathutils import Vector
from pathlib import Path
ROOT = Path('/Users/evansmacbookpro/Desktop/Projects/tradely')
OUT = ROOT / 'apps/web/public/models/trading-hall'
ART = ROOT / 'artifacts/trading-hall'
SCENE = 'Tradely_Exchange_Hall_v1'
PREFIX = 'TH_'

def use_scene():
    scene = bpy.data.scenes.get(SCENE)
    if not scene: raise RuntimeError('Run setup first')
    bpy.context.window.scene = scene
    return scene

def mat(name): return bpy.data.materials[PREFIX+name]

def material(name, color, roughness=.5, metallic=0, emission=0):
    m = bpy.data.materials.new(PREFIX+name)
    m.diffuse_color=(*color,1)
    m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=roughness
    p.inputs['Metallic'].default_value=metallic
    if emission:
        p.inputs['Emission Color'].default_value=(*color,1)
        p.inputs['Emission Strength'].default_value=emission
    return m

def mesh(name, verts, faces, material_name):
    data=bpy.data.meshes.new(PREFIX+name)
    data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(PREFIX+name,data)
    use_scene().collection.objects.link(obj)
    data.materials.append(mat(material_name))
    return obj

def box(name, loc, size, material_name, bevel=0.02):
    x,y,z=[v/2 for v in size]
    o=mesh(name,[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],material_name)
    o.location=loc
    if bevel:
        b=o.modifiers.new('Crafted edge highlights','BEVEL');b.width=bevel;b.segments=2
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o

def cylinder(name,a,b,r,material_name,segments=12):
    a,b=Vector(a),Vector(b);length=(b-a).length
    verts=[]
    for z in [-length/2,length/2]:
        for i in range(segments):
            angle=i*math.tau/segments;verts.append((r*math.cos(angle),r*math.sin(angle),z))
    faces=[tuple(reversed(range(segments))),tuple(range(segments,segments*2))]
    faces += [(i,(i+1)%segments,(i+1)%segments+segments,i+segments) for i in range(segments)]
    o=mesh(name,verts,faces,material_name);o.location=(a+b)/2;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    for p in o.data.polygons: p.use_smooth=True
    return o

def text(name,body,loc,size,material_name='Bronze',rotation=(math.pi/2,0,0)):
    d=bpy.data.curves.new(PREFIX+name,'FONT');d.body=body;d.align_x='CENTER';d.size=size;d.extrude=.002;d.bevel_depth=.001
    o=bpy.data.objects.new(PREFIX+name,d);use_scene().collection.objects.link(o);o.location=loc;o.rotation_euler=rotation;d.materials.append(mat(material_name));return o

def screen(name,center,width,height,index,kind='market'):
    x,y,z=center
    o=mesh(name,[(x-width/2,y,z-height/2),(x+width/2,y,z-height/2),(x+width/2,y,z+height/2),(x-width/2,y,z+height/2)],[(0,1,2,3)],'MarketScreens' if kind=='market' else 'TickerScreens')
    uv=o.data.uv_layers.new(name='UVMap')
    coords=[(0,0),(1,0),(1,1),(0,1)]
    for loop in o.data.loops:
        u,v=coords[loop.vertex_index]
        if kind=='market': u=(index%8+u)/8;v=1-(index//8+1-v)/8
        uv.data[loop.index].uv=(u,v)
    o['screen_index']=index;o['screen_kind']=kind
    return o

def setup():
    if bpy.data.scenes.get(SCENE):
        raise RuntimeError('Hall already exists. Resume its current phase; do not clear it.')
    scene=bpy.data.scenes.new(SCENE);bpy.context.window.scene=scene
    scene.unit_settings.system='METRIC'
    for args in [
      ('StoneFloor',(.095,.105,.105),.25,.26),('WallStone',(.16,.17,.16),.78,.05),
      ('Walnut',(.22,.10,.042),.32,.05),('Bronze',(.40,.27,.12),.29,.72),
      ('DarkMetal',(.032,.041,.043),.34,.65),('ScreenBezel',(.018,.023,.026),.28,.3),
      ('Leather',(.055,.063,.064),.64,0),('Keycaps',(.10,.11,.105),.55,0),
      ('Ceiling',(.068,.076,.071),.72,.1),('Plaster',(.38,.36,.30),.8,0),
      ('WarmLight',(1,.63,.25),.4,0,4),('WindowLight',(.80,.88,1),.45,0,.45),
      ('MarketScreens',(.02,.12,.17),.4,0,.7),('TickerScreens',(.80,.41,.05),.5,0,1.2)
    ]: material(*args)
    world=bpy.data.worlds.new('TH_StudioAtmosphere');scene.world=world;world.use_nodes=True
    world.node_tree.nodes.get('Background').inputs[0].default_value=(.075,.10,.14,1)
    world.node_tree.nodes.get('Background').inputs[1].default_value=.35
    scene['phases']='setup'
    print('Created independent trading hall scene; existing scenes preserved.')

def architecture():
    s=use_scene()
    box('StoneFloor',(0,0,-.12),(24,34,.24),'StoneFloor',0)
    box('BackWall',(0,15.5,4.7),(24,.5,9.4),'WallStone',.025)
    box('LeftWall',(-12,0,4.7),(.5,31,9.4),'WallStone',.025)
    box('RightWindowSill',(12,0,.46),(.55,31,.92),'WallStone')
    box('Ceiling',(0,0,9.2),(24,31,.30),'Ceiling')
    # Floor seams remain geometric at close camera distances.
    for x in range(-12,13,2): box('FloorJointX',(x,0,.004),(.012,31,.006),'DarkMetal',0)
    for y in range(-15,16,2): box('FloorJointY',(0,y,.005),(24,.012,.006),'DarkMetal',0)
    for side in [-1,1]:
        x=side*11.75
        box('Skirting',(x,0,.17),(.12,31,.3),'DarkMetal')
        box('LowerWallTrim',(x,0,1.03),(.15,31,.028),'Bronze',.006)
        box('UpperCornice',(x,0,8.5),(.26,31,.17),'Bronze')
        for y in [-13,-7,-1,5,11]:
            box('StonePier',(x,y,4.45),(.65,.6,8.9),'WallStone',.055)
            box('PierFoot',(x,y,.25),(.85,.8,.45),'DarkMetal',.04)
            for dy in [-.20,0,.20]: box('BronzeFlute',(x-side*.36,y+dy,4.6),(.045,.04,7.8),'Bronze',.008)
            box('WallSconce',(x-side*.40,y,3.15),(.10,.13,.62),'Bronze')
            box('SconceLight',(x-side*.46,y,3.15),(.02,.085,.42),'WarmLight',.003)
    for y in [-10,-4,2,8,14]:
        box('WindowBay',(11.91,y,5.35),(.035,5.24,7.6),'WindowLight',0)
        for dy in [-2.6,-1.3,0,1.3,2.6]: box('WindowMullion',(11.82,y+dy,5.3),(.13,.065,7.7),'Bronze',.009)
        for z in [1.5,4.5,6.4,8.95]: box('WindowTransom',(11.78,y,z),(.16,5.3,.075),'Bronze',.008)
    # A shallow gallery and railing on the glazed side.
    box('Mezzanine',(10.75,0,4.5),(2.1,31,.23),'DarkMetal')
    for y in [i*.5-15 for i in range(61)]: cylinder('GalleryBaluster',(9.7,y,4.5),(9.7,y,5.42),.018,'Bronze',8)
    cylinder('GalleryHandrail',(9.7,-15.1,5.44),(9.7,15.1,5.44),.045,'Bronze')
    for y in [-12,-6,0,6,12]:
        box('CeilingBeam',(0,y,8.82),(24,.18,.46),'DarkMetal')
        for x in [-8,-4,0,4,8]:
            box('DownlightFrame',(x,y,8.56),(.46,.46,.10),'DarkMetal')
            box('DownlightDiffuser',(x,y,8.5),(.32,.32,.012),'WarmLight',.006)
    for x in [i*.38-11.4 for i in range(61)]: box('AcousticFin',(x,0,9.02),(.06,30.4,.25),'Bronze' if int((x+11.4)/.38)%8==0 else 'Ceiling',.006)
    box('MarketWallFrame',(0,15.13,5.55),(17.3,.25,5.1),'Bronze',.035)
    box('MarketWallBezel',(0,14.98,5.55),(17.1,.12,4.9),'ScreenBezel',.02)
    for row in range(2):
        for col in range(3):
            idx=54+row*3+col
            screen('WallDisplay',(-5.63+col*5.63,14.9,4.33+row*2.44),5.55,2.37,idx)
    box('EntryDoorFrame',(0,15.05,1.28),(3.5,.32,2.56),'Bronze',.025)
    box('EntryDoor',(0,14.85,1.22),(3.25,.06,2.35),'DarkMetal',.012)
    for x in [-.82,.82]: box('DoorInlay',(x,14.80,1.22),(1.46,.022,2.12),'WallStone',.006)
    text('ExchangeName','T R A D E L Y',(0,14.75,2.82),.35)
    for y in [-5,5]:
        box('TickerHousing',(0,y,6.9),(8,.6,.70),'DarkMetal',.065)
        screen('TickerFront',(0,y-.315,6.9),7.8,.47,0,'ticker')
        for x in [-3.7,3.7]: cylinder('TickerSuspension',(x,y,7.22),(x,y,8.8),.018,'Bronze')
        box('TickerAccent',(0,y-.32,6.6),(7.8,.035,.02),'WarmLight',.004)
    s['phases']+=' architecture'
    print('Architecture built:',len(s.objects),'objects; 6 wall displays and 2 ticker ribbons.')

def chair(x,y):
    box('ChairSeat',(x,y,.5),(.59,.55,.13),'Leather',.07)
    box('ChairSeatShell',(x,y,.435),(.58,.54,.07),'DarkMetal',.045)
    back=box('ChairBack',(x,y+.24,.90),(.56,.11,.73),'Leather',.07);back.rotation_euler.x=-.12
    for side in [-1,1]:
        cylinder('BackFrame',(x+side*.25,y+.25,.51),(x+side*.25,y+.33,1.22),.023,'DarkMetal')
        cylinder('ArmSupport',(x+side*.30,y,.46),(x+side*.30,y,.74),.021,'DarkMetal')
        box('ChairArm',(x+side*.31,y-.05,.76),(.08,.36,.065),'Leather',.03)
    cylinder('ChairPiston',(x,y,.12),(x,y,.48),.045,'Bronze')
    for i in range(5):
        a=i*math.tau/5;cx=x+math.cos(a)*.36;cy=y+math.sin(a)*.36
        cylinder('ChairStar',(x,y,.18),(cx,cy,.09),.026,'DarkMetal')
        cylinder('ChairWheel',(cx-.035,cy,.065),(cx+.035,cy,.065),.058,'DarkMetal',10)

def keyboard(x,y,z):
    box('Keyboard',(x,y,z),(.53,.19,.034),'DarkMetal',.018)
    # One mesh per keyboard rather than one object per key.
    verts=[];faces=[]
    for row in range(5):
        for col in range(13):
            xx=x-.24+col*.037;yy=y-.072+row*.034;b=len(verts)
            verts += [(xx,yy,z+.022),(xx+.028,yy,z+.022),(xx+.028,yy+.024,z+.022),(xx,yy+.024,z+.022)]
            faces.append((b,b+1,b+2,b+3))
    mesh('KeyboardKeys',verts,faces,'Keycaps')
    box('Mousepad',(x+.42,y,z-.014),(.24,.23,.008),'Leather',.02)
    box('Mouse',(x+.43,y,z+.017),(.07,.115,.045),'Keycaps',.026)

def desks(start=0,end=6):
    s=use_scene();islands=[(-5.6,-8), (5.6,-8),(-5.6,-1),(5.6,-1),(-5.6,6),(5.6,6)]
    for island in range(start,end):
        x,y=islands[island]
        box('DeskPlinth',(x,y,.12),(5.6,2.7,.24),'DarkMetal',.08)
        box('DeskCabinet',(x,y,.50),(5.42,2.52,.80),'DarkMetal',.09)
        box('DeskGoldFoot',(x,y,.18),(5.59,2.69,.028),'Bronze',.08)
        box('DeskEdge',(x,y,.966),(5.8,2.9,.075),'Bronze',.04)
        box('WalnutDesktop',(x,y,.998),(5.76,2.86,.065),'Walnut',.04)
        for xx in [-1.8,0,1.8]:
            box('CabinetPanel',(x+xx,y-1.269,.51),(1.72,.025,.63),'WallStone',.015)
            box('CabinetPull',(x+xx,y-1.292,.76),(.33,.028,.012),'Bronze',.005)
        for station in range(3):
            xx=x+(station-1)*1.75;yy=y-.45
            box('MonitorBase',(xx,yy,1.05),(.50,.35,.05),'DarkMetal',.04)
            cylinder('MonitorPole',(xx,yy,1.07),(xx,yy,1.9),.027,'Bronze')
            for monitor,(dx,dz) in enumerate([(-.38,1.4),(.38,1.4),(0,1.94)]):
                mx=xx+dx;my=yy-.11
                cylinder('MonitorArm',(xx,yy,dz),(mx,my+.07,dz),.021,'DarkMetal')
                box('MonitorFrame',(mx,my,dz),(.75,.08,.48),'ScreenBezel',.018)
                box('MonitorBack',(mx,my+.05,dz),(.59,.025,.31),'DarkMetal',.035)
                idx=island*9+station*3+monitor
                screen('DeskDisplay',(mx,my-.042,dz+.005),.70,.427,idx)
                box('MonitorLED',(mx+.31,my-.045,dz-.222),(.022,.006,.005),'WarmLight',.001)
            keyboard(xx,y-1.05,1.06)
            chair(xx,y-2.02)
            cylinder('CoffeeCup',(xx-.62,y-1.04,1.02),(xx-.62,y-1.04,1.16),.052,'Bronze')
            box('Notepad',(xx+.66,y-1.0,1.035),(.16,.22,.012),'Plaster',.005)
            cylinder('Pen',(xx+.59,y-1.05,1.05),(xx+.60,y-.90,1.05),.006,'DarkMetal',6)
    s['phases']+=f' desks{start}-{end}'
    print('Trading stations built:',start,end,'total objects',len(s.objects))

def lighting():
    scene=use_scene()
    def area(name,loc,target,power,color,size):
        d=bpy.data.lights.new(PREFIX+name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
        o=bpy.data.objects.new(PREFIX+name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    area('WindowKey',(10,-3,8),(0,2,1),3200,(1,.77,.48),9)
    area('SoftFill',(-8,-10,5),(0,0,1),1600,(.52,.67,1),8)
    area('WallWash',(0,13,8),(0,4,2),1400,(.52,.73,1),8)
    for x in [-5.6,5.6]:
        for y in [-8,-1,6]: area('ScreenBounce',(x,y-.8,1.85),(x,y-2,.9),65,(.23,.66,1),3)
    d=bpy.data.lights.new(PREFIX+'Sun','SUN');d.energy=2.1;d.angle=.12;d.color=(1,.77,.51)
    o=bpy.data.objects.new(PREFIX+'Sun',d);scene.collection.objects.link(o);o.rotation_euler=(math.radians(28),math.radians(-32),math.radians(-68))
    cam=bpy.data.cameras.new(PREFIX+'HeroCamera');o=bpy.data.objects.new(PREFIX+'HeroCamera',cam);scene.collection.objects.link(o)
    o.location=(.4,-18,3.0);o.rotation_euler=(Vector((0,6,2.5))-o.location).to_track_quat('-Z','Y').to_euler();cam.lens=24;scene.camera=o
    scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
    scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX'
    scene.render.image_settings.file_format='PNG'
    scene['phases']+=' lighting'
    print('Lighting and reference camera ready.')

def export():
    scene=use_scene();OUT.mkdir(parents=True,exist_ok=True);ART.mkdir(parents=True,exist_ok=True)
    # Save editable, unmerged objects as a scene-only Blender library.
    bpy.data.libraries.write(str(ART/'trading-hall.blend'),{scene},fake_user=True)
    # Export only a temporary clone, leaving the editable source intact.
    # The clone shares its collection, so duplicate each object before applying modifiers.
    isolated=bpy.data.scenes.new('TH_OptimizedExport');bpy.context.window.scene=isolated
    for obj in scene.objects:
        if obj.type not in {'MESH','FONT'}: continue
        clone=obj.copy();clone.data=obj.data.copy();isolated.collection.objects.link(clone)
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.convert(target='MESH')
    groups={}
    for o in list(isolated.objects):
        if o.type=='MESH' and len(o.data.materials)==1: groups.setdefault(o.data.materials[0].name,[]).append(o)
    for name,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        objects[0].name=name
    bpy.ops.export_scene.gltf(filepath=str(OUT/'trading-hall.glb'),export_format='GLB',export_image_format='WEBP',export_image_quality=90,use_active_scene=True,export_cameras=False,export_lights=False,export_extras=True,export_apply=True)
    faces=sum(len(o.data.polygons) for o in isolated.objects if o.type=='MESH')
    (OUT/'manifest.json').write_text(json.dumps({'scene':'Tradely exchange hall','version':1,'source':'Blender MCP procedural build, guided by generated references','marketScreens':60,'tickerSurfaces':2,'deskIslands':6,'workstations':18,'meshCount':len(isolated.objects),'polygons':faces,'camera':{'position':[.4,3,18],'target':[0,2.5,-6]},'materials':list(groups),'textureFormat':'WebP quality 90','textureSources':[{'id':'natural_walnut_veneer','url':'https://polyhaven.com/a/natural_walnut_veneer','license':'CC0'},{'id':'slate_floor','url':'https://polyhaven.com/a/slate_floor','license':'CC0'}]},indent=2))
    bpy.context.window.scene=scene
    bpy.data.scenes.remove(isolated)
    print(json.dumps({'glb':str(OUT/'trading-hall.glb'),'bytes':(OUT/'trading-hall.glb').stat().st_size,'meshes':len(groups),'polygons':faces,'sourceBlend':str(ART/'trading-hall.blend')}))


def finish_details():
    scene=use_scene()
    for obj in scene.objects:
        if obj.name.startswith('TH_DeskEdge'):
            obj.location.z=.966;obj.dimensions.z=.075
        if obj.name.startswith('TH_WalnutDesktop'):
            obj.location.z=.998;obj.dimensions.z=.065
        if obj.name.startswith(('TH_DeskEdge','TH_WalnutDesktop')):
            for mod in obj.modifiers:
                if mod.type=='BEVEL':mod.width=.04
    scene['phases']+=' refined_desktop_edges'
    print('Refined desktop scale and bronze edge detail.')

def apply_pbr_assets():
    import shutil
    scene=use_scene();folder=OUT/'textures';folder.mkdir(parents=True,exist_ok=True)
    for source_name in ['natural_walnut_veneer','slate_floor']:
        source=bpy.data.materials.get(source_name)
        if not source: raise RuntimeError('Download the Poly Haven material through Blender MCP first: '+source_name)
        for node in source.node_tree.nodes:
            if node.type=='TEX_IMAGE' and node.image:
                image=node.image;destination=folder/image.name
                original=Path(bpy.path.abspath(image.filepath))
                if image.packed_file:destination.write_bytes(image.packed_file.data)
                elif original.exists() and original.resolve()!=destination.resolve():shutil.copy2(original,destination)
                else:
                    image.filepath_raw=str(destination);image.file_format='JPEG';image.save()
                image.filepath=str(destination)
                if not image.packed_file:image.pack()
    replacements={}
    for old,source in [('TH_Walnut','natural_walnut_veneer'),('TH_WallStone','slate_floor'),('TH_StoneFloor','slate_floor')]:
        target=bpy.data.materials.get(old+'_PBR')
        if not target:target=bpy.data.materials[source].copy();target.name=old+'_PBR'
        replacements[old]=target
        normal_image=bpy.data.images.get(source+'_nor_gl.jpg')
        if normal_image:
            normal_image.colorspace_settings.name='Non-Color'
            nodes=target.node_tree.nodes;links=target.node_tree.links
            image_node=next((node for node in nodes if node.type=='TEX_IMAGE' and node.image==normal_image),None)
            if image_node is None:image_node=nodes.new('ShaderNodeTexImage');image_node.image=normal_image
            normal_node=next((node for node in nodes if node.type=='NORMAL_MAP'),None)
            if normal_node is None:normal_node=nodes.new('ShaderNodeNormalMap')
            normal_node.inputs['Strength'].default_value=1.0
            bsdf=next(node for node in nodes if node.type=='BSDF_PRINCIPLED')
            links.new(image_node.outputs['Color'],normal_node.inputs['Color'])
            links.new(normal_node.outputs['Normal'],bsdf.inputs['Normal'])
    for obj in scene.objects:
        if obj.type!='MESH':continue
        for slot in obj.material_slots:
            if slot.material and slot.material.name in replacements:slot.material=replacements[slot.material.name]
        if obj.data.uv_layers:continue
        uv=obj.data.uv_layers.new(name='UVMap')
        for polygon in obj.data.polygons:
            normal=(obj.matrix_world.to_3x3()@polygon.normal).normalized()
            for index in polygon.loop_indices:
                pos=obj.matrix_world@obj.data.vertices[obj.data.loops[index].vertex_index].co
                if abs(normal.z)>.65:coords=(pos.x*.45,pos.y*.45)
                elif abs(normal.x)>.65:coords=(pos.y*.45,pos.z*.45)
                else:coords=(pos.x*.45,pos.z*.45)
                uv.data[index].uv=coords
    scene['phases']+=' pbr_assets'
    print('Applied CC0 walnut veneer and slate PBR materials with world-scale UVs; textures packed and copied to permanent project paths.')
