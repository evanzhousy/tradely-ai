import bpy
from pathlib import Path
BASE=Path('/Users/evansmacbookpro/Desktop/Projects/tradely')
root=bpy.data.objects['Dollhouse'];white=bpy.data.materials['DH Ivory plastic']
o=bpy.data.objects['DH Garage magenta tracks'];o.location.z=.245;o.data.materials.clear();o.data.materials.append(white);o.name='DH White garage parking pad'
bright=white.copy();bright.name='DH Bright window frames';p=bright.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(.9,.9,.86,1);p.inputs['Emission Strength'].default_value=.22
for o in root.children:
 if 'window' in o.name.lower() and o.type=='MESH':
  o.data.materials.clear();o.data.materials.append(bright);o.scale.x*=1.25;o.scale.y*=1.25
 if o.type!='MESH' or o.get('texture_quadrant')!=0:continue
 uv=o.data.uv_layers.active
 lo=[min(v.co[k] for v in o.data.vertices) for k in range(3)];hi=[max(v.co[k] for v in o.data.vertices) for k in range(3)]
 for face in o.data.polygons:
  skip=max(range(3),key=lambda k:abs(face.normal[k]));axes=[k for k in range(3) if k!=skip];length=max(hi[k]-lo[k] for k in axes)
  for i in face.loop_indices:
   v=o.data.vertices[o.data.loops[i].vertex_index].co;uv.data[i].uv=(.025+.32*(v[axes[0]]-lo[axes[0]])/length,.525+.32*(v[axes[1]]-lo[axes[1]])/length)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'artifacts/dollhouse/dollhouse.blend'))
print('Round pattern proportions and parking pad corrected')
