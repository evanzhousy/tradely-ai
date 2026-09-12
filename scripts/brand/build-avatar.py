"""Rebuild the logo-derived owl: Blender --background --python scripts/brand/build-avatar.py."""
from pathlib import Path
import bpy
import bmesh

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'apps/web/public/models/tradely-avatar'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)


def material(name, color, roughness=.72):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    return mat


yellow = material('Warm logo yellow', (1, .66, .045))
wing_brown = material('Warm brown wings', (.19, .065, .022))
ivory = material('Connected ivory facial discs', (.98, .97, .92))
ink = material('Ink pupils', (.012, .014, .013))
amber = material('Amber beak and feet', (.60, .22, .018))


def sphere(name, location, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=24, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def tapered(name, location, scale, mat, top_radius, bottom_radius):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=bottom_radius,
                                  radius2=top_radius, depth=1, location=location)
    obj = bpy.context.object
    obj.name = name
    bevel = obj.modifiers.new('Soft rounded edges', 'BEVEL')
    bevel.width = .12
    bevel.segments = 4
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.scale = scale
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


# Broad, compact owl silhouette. Short feather tufts distinguish it from an egg.
body = sphere('OwlBody', (0, 0, -.02), (.84, .56, .88), yellow)
# Split the existing silhouette at an overlapping neck seam so only the head turns.
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
head_shell = body.copy()
head_shell.data = body.data.copy()
head_shell.name = 'OwlHeadShell'
bpy.context.collection.objects.link(head_shell)
for obj, height, remove_lower in [(body, .07, False), (head_shell, -.07, True)]:
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    bmesh.ops.bisect_plane(mesh, geom=list(mesh.verts) + list(mesh.edges) + list(mesh.faces),
                          plane_co=(0, 0, height), plane_no=(0, 0, 1),
                          clear_inner=remove_lower, clear_outer=not remove_lower)
    bmesh.ops.holes_fill(mesh, edges=[edge for edge in mesh.edges if edge.is_boundary], sides=0)
    bmesh.ops.recalc_face_normals(mesh, faces=list(mesh.faces))
    mesh.to_mesh(obj.data)
    mesh.free()
for side, x in [('Left', -.57), ('Right', .57)]:
    tuft = tapered(side + 'CrownTuft', (x, .01, .74), (.34, .30, .46), yellow, .10, .75)
    tuft.rotation_euler[1] = -.25 if x < 0 else .25
    wing = sphere(side + 'FoldedWing', (x * 1.22, -.10, -.36), (.21, .34, .49), wing_brown)
    wing.rotation_euler[1] = -.22 if x < 0 else .22
    for index in range(3):
        sphere(side + 'Toe' + str(index), (x * .57 + (index - 1) * .085, -.17, -.88),
               (.059, .18, .068), amber)

# Large touching facial discs retain the asymmetric, curious logo expression.
sphere('FacialDiscLeft', (-.31, -.485, .29), (.435, .135, .43), ivory)
sphere('FacialDiscRight', (.30, -.49, .24), (.435, .135, .42), ivory)
sphere('PupilLeft', (-.265, -.615, .30), (.106, .046, .122), ink)
sphere('PupilRight', (.345, -.62, .25), (.106, .046, .122), ink)
# Downward-pointing short beak: separate, editable geometry, between the eye discs.
tapered('ShortOwlBeak', (0, -.639, .025), (.16, .18, .25), amber, .72, .035)

# Author the pivot in the asset, rather than reconstructing a head in the web player.
head = bpy.data.objects.new('HeadPivot', None)
bpy.context.collection.objects.link(head)
head.location = (0, 0, -.02)
bpy.context.view_layer.update()
for obj in list(bpy.context.scene.objects):
    if obj.name in {'OwlHeadShell', 'LeftCrownTuft', 'RightCrownTuft',
                    'FacialDiscLeft', 'FacialDiscRight', 'PupilLeft', 'PupilRight', 'ShortOwlBeak'}:
        obj.parent = head
        obj.matrix_parent_inverse = head.matrix_world.inverted()

# Blender Z-up exports to glTF Y-up; -Y face exports toward the player's camera.
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'docs/brand/tradely-avatar.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT / 'tradely-avatar.glb'), export_format='GLB')
