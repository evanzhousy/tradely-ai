import bpy, math
from mathutils import Vector
BASE='/Users/evansmacbookpro/Desktop/Projects/tradely'
source=open(BASE+'/artifacts/interior/export_web.py').read();exec(source[:source.index("bpy.ops.object.select_all(action='DESELECT')\nfor rootname")])
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=96;s.cycles.max_bounces=5
s.render.bake.use_pass_direct=False;s.render.bake.use_pass_indirect=True;s.render.bake.use_pass_color=False;s.render.bake.margin=8
s.world=bpy.data.worlds.new('Interior bake ambient');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.7,.78,.9,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.3
lights=[]
for x,y,z,power,color,size in [(-3,3.7,2.3,240,(1,.74,.43),2.5),(2,0,2.6,180,(1,.82,.60),3),(-1,-2,3.3,130,(1,.92,.78),4)]:
 bpy.ops.object.light_add(type='AREA',location=(x,y,z));o=bpy.context.object;o.data.energy=power;o.data.color=color;o.data.size=size;o.rotation_euler=(Vector((x,0,0))-o.location).to_track_quat('-Z','Y').to_euler();lights.append(o)
for level in ['GroundFloor','UpperFloor']:
 for other in ['GroundFloor','UpperFloor']:bpy.data.objects[other+'Geometry'].hide_render=other!=level
 obj=bpy.data.objects[level+'Geometry'];obj.hide_set(False)
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.003);bpy.ops.object.mode_set(mode='OBJECT')
 image=bpy.data.images.new(level+' Indirect',width=1024,height=1024,alpha=False,float_buffer=True);image.colorspace_settings.name='Non-Color'
 for mat in obj.data.materials:
  nodes=mat.node_tree.nodes;node=nodes.new('ShaderNodeTexImage');node.image=image;nodes.active=node
 bpy.ops.object.bake(type='DIFFUSE')
 image.filepath_raw=BASE+'/apps/web/public/models/kirkland-house/'+level.lower()+'-indirect.png';image.file_format='PNG';image.save()
 print('BAKED',level,flush=True)
for level in ['GroundFloor','UpperFloor']:bpy.data.objects[level+'Geometry'].hide_render=False
bpy.ops.object.select_all(action='DESELECT')
for level in ['GroundFloor','UpperFloor']:
 root=bpy.data.objects[level];root.select_set(True)
 for o in root.children_recursive:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=BASE+'/apps/web/public/models/kirkland-house/interior.glb',export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_animations=False)
bpy.ops.wm.save_as_mainfile(filepath=BASE+'/artifacts/interior/interior-baked.blend')
