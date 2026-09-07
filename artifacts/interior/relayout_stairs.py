import bpy
from mathutils import Vector

BASE = "/Users/evansmacbookpro/Desktop/Projects/tradely"
collection = bpy.data.collections["Interior"]
floor = bpy.data.materials.get("Honey oak floor") or bpy.data.materials.get("Natural maple cabinetry")
trim = bpy.data.materials.get("White painted trim")

for obj in list(collection.objects):
    if obj.name.startswith(("Oak stair tread", "Stair handrail", "Stair landing")):
        bpy.data.objects.remove(obj, do_unlink=True)

def box(name, x, z, y, w, d, h, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (w, d, h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for user_collection in list(obj.users_collection):
        user_collection.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    bevel = obj.modifiers.new("Soft stair edges", "BEVEL")
    bevel.width = 0.018
    bevel.segments = 2
    obj["collider"] = [x - w / 2 - .12, x + w / 2 + .12, z - d / 2 - .12, z + d / 2 + .12]
    return obj

# A straight run follows the left wall from the public room to a clear landing.
for index in range(11):
    box(
        "Oak stair tread",
        -3.25,
        3.85 - index * .18,
        .12 + index * .14,
        1.45,
        .30,
        .16,
        floor,
    )
box("Stair landing", -3.25, 1.82, 1.58, 1.55, 1.25, .14, floor)
box("Stair landing upper", -3.25, 1.82, 1.70, 1.55, 1.25, .10, trim)
box("Stair handrail", -4.05, 2.90, 1.10, .07, 2.15, .07, trim)
box("Stair newel", -4.05, 3.94, .78, .10, .10, 1.35, trim)
box("Stair upper newel", -4.05, 1.82, 1.90, .10, .10, .65, trim)

# Keep both level roots visible for the GLB export; the web viewer toggles them.
bpy.ops.wm.save_as_mainfile(filepath=BASE + "/artifacts/interior/interior.blend")
bpy.ops.object.select_all(action="DESELECT")
for obj in collection.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = next(obj for obj in collection.objects if obj.type == "MESH")
bpy.ops.object.convert(target="MESH")
bpy.ops.export_scene.gltf(
    filepath=BASE + "/apps/web/public/models/kirkland-house/interior.glb",
    export_format="GLB",
    use_selection=True,
    export_extras=True,
    export_apply=True,
    export_animations=False,
)
print("Re-laid out straight stair run and landing")
