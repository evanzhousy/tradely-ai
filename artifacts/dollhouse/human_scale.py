import bpy, math, json
from pathlib import Path
from mathutils import Matrix, Vector

BASE=Path('/Users/evansmacbookpro/Desktop/Projects/tradely')
OUT=BASE/'artifacts/dollhouse'
source=bpy.data.objects['Dollhouse']
scene=bpy.data.scenes.new('Dream House | Human scale')
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
root=bpy.data.objects.new('DollhouseHumanScale',None);scene.collection.objects.link(root)
copied={};collections={}
SX,SY,SZ=2.0,2.2,3/2.075
global_transform=Matrix.Translation((0,0,.2-.2*SZ)) @ Matrix.Diagonal((SX,SY,SZ,1))
floors={0:.2,1:3.2,2:6.2}

def transform(anchor,scale,level):
    target=(anchor[0]*SX,anchor[1]*SY,floors[level])
    return Matrix.Translation(target) @ Matrix.Diagonal((*scale,1)) @ Matrix.Translation(-Vector(anchor))

for original in list(source.children):
    if original.type not in {'MESH','CURVE','FONT'}:continue
    obj=original.copy();obj.data=original.data.copy();name=original.name
    category=next((c.name for c in original.users_collection if c.name.startswith('DH ')),'DH Structure')
    if category not in collections:
        c=bpy.data.collections.new('Life-size '+category);scene.collection.children.link(c);collections[category]=c
    collections[category].objects.link(obj);obj.parent=root;obj['source_asset']=name
    M=global_transform
    if category=='DH Bedroom':
        if any(k in name for k in ['bed frame','mattress','bedcover','Bedcover','pillow']):M=transform((-.97,.07,4.33),(2/1.95,1.6/1.04,1),2)
        elif any(k in name for k in ['closet','Closet','Hanging dress']):M=transform((-2,.36,4.33),(1.7,.75,1.2),2)
        elif any(k in name for k in ['desk','Desk']):M=transform((1.09,.48,4.33),(1,1, .75/.70),2)
        elif any(k in name for k in ['chair','Chair']):M=transform((1.18,-.23,4.33),(.94,.94,.45/.595),2)
        elif 'Plant' in name or 'Flower pot' in name:M=transform((-1.2,.56,4.33),(1,1,1),2)
    elif category=='DH Living':
        if any(k in name for k in ['sofa','Sofa']):M=transform((-.98,.2,2.26),(1.12,1.12,.45/.595),1)
        else:M=transform((-.97,-.55,2.26),(1.16,1.22,.43/.3975),1)
    elif category=='DH Bathroom':
        if 'Toilet' in name or 'toilet' in name:M=transform((.62,-.1,2.26),(1.15,1.35,1),1)
        else:M=transform((1.08,.35,2.26),(1.15,.85,.85/.88),1)
    elif category=='DH Kitchen':
        if any(k in name for k in ['refrigerator','Refrigerator','Fridge','food bottle']):M=transform((-1.9,.46,.2),(1.4,.97,1.05),0)
        elif 'pendant' in name:M=global_transform
        else:M=transform((-1.0,.42,.2),(2,.92,.90/1.015),0)
    elif category=='DH Dining':
        M=transform((.95,0,.2),(1.28,1.28,.75/.78),0)
        if any(k in name for k in ['seat','chair','Chair']):
            M=transform((.95,0,.2),(1.28,1.28,.45/.50),0)
    elif category=='DH Garage' and 'Scooter' in name or category=='DH Garage' and 'scooter' in name:
        M=transform((2.55,.35,.2),(1.3,1.35,1.0),0)
    elif category=='DH Decor':
        if original.location.z<2.0:M=transform((original.location.x,original.location.y,.2),(1,1,1),0)
        else:M=transform((original.location.x,original.location.y,4.33),(1,1,1),2)
    obj.matrix_world=M @ original.matrix_world
    copied[name]=obj

# Precisely set finished floor elevations, with reasonable slab thicknesses.
for name,top in [('DH Ground pink base',.2),('DH Middle peach terrace',3.2),('DH Top pink floor',6.2)]:
    o=copied[name];o.dimensions.z=.20;o.location.z=top-.10
for name,o in copied.items():
    if 'Balcony aqua shield' in name:
        floor=6.2 if name in copied and o.location.z>5 else 3.2
        o.dimensions.z=1.1;o.location.z=floor+.55
    if 'Pool fence post' in name:o.dimensions.z=1.1;o.location.z=3.75
    if 'Dining pink door panel' in name:o.dimensions.z=2.1;o.location.z=1.25

# A landscape pad grounds the larger building beside the original house.
c=collections['DH Structure']
bpy.ops.mesh.primitive_cube_add(size=1,location=(1.8,0,-.10));pad=bpy.context.object;pad.name='Life-size garden platform';pad.dimensions=(13.0,5.6,.20)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
for other in list(pad.users_collection):other.objects.unlink(pad)
c.objects.link(pad);pad.parent=root
material=bpy.data.materials.new('Dream house garden');material.diffuse_color=(.25,.36,.11,1);material.use_nodes=True;material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.25,.36,.11,1);material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.95;pad.data.materials.append(material)

bpy.context.view_layer.update()
def bounds(name):
    obj=copied[name];evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());points=[evaluated.matrix_world @ Vector(p) for p in evaluated.bound_box]
    return [min(p[k] for p in points) for k in range(3)],[max(p[k] for p in points) for k in range(3)]
def metric(prefix,floor):
    name=next(n for n in copied if n.startswith(prefix));lo,hi=bounds(name)
    return {'name':name,'width_m':round(hi[0]-lo[0],3),'depth_m':round(hi[1]-lo[1],3),'top_above_floor_m':round(hi[2]-floor,3)}
measurements={
    'units':'meters; exported at scale 1',
    'floor_elevations_m':[.2,3.2,6.2],
    'bed_mattress':metric('DH White mattress',6.2),
    'dining_table':metric('DH Round white dining table',.2),
    'dining_seat':metric('DH Dining molded seat',.2),
    'sofa_seat':metric('DH Sofa seat',3.2),
    'desk':metric('DH Top right desk',6.2),
    'kitchen_counter':metric('DH Kitchen counter',.2),
    'coffee_table':metric('DH Yellow coffee table',3.2),
}
root['human_scale']=True;root['units']='meters';root['design_note']='Adult-scale design targets, not construction or product safety certification.'
(OUT/'dimensions.json').write_text(json.dumps(measurements,indent=2))
scene.world=bpy.data.worlds.new('Life-size studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.8,.85,.9,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
bpy.ops.object.camera_add(location=(9,-30,14));camera=bpy.context.object;camera.name='Life-size dollhouse overview';camera.rotation_euler=(Vector((1.4,0,4.8))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=16;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(-4,-10,15));lamp=bpy.context.object;lamp.data.energy=2400;lamp.data.size=10;lamp.rotation_euler=(Vector((0,0,4))-lamp.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.color_type='MATERIAL';area.spaces.active.overlay.show_overlays=False
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dollhouse-life-size.blend'))
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for obj in root.children:obj.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in root.children if o.type=='MESH');bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(BASE/'apps/web/public/models/dollhouse/dollhouse.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_animations=False,export_image_format='JPEG',export_jpeg_quality=88)
print(json.dumps(measurements))
