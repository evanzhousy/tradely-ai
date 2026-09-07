"""Denoise linear HDR bake data with Blender's bundled Open Image Denoise.

Blender bundles the RT HDR model (its build omits RTLightmap weights). Run
before range/gamma encoding; generated surface textures stay intact.
API: https://www.openimagedenoise.org/documentation.html#rt
"""
import ctypes as C
from pathlib import Path

import bpy
import numpy as np


def denoise_lightmap(rgb):
    library = Path(bpy.app.binary_path).parent.parent / 'Resources/lib/libOpenImageDenoise.dylib'
    oidn = C.CDLL(str(library))
    ptr, size, name = C.c_void_p, C.c_size_t, C.c_char_p
    signatures = {
        'oidnNewDevice': (ptr, [C.c_int]),
        'oidnCommitDevice': (None, [ptr]),
        'oidnGetDeviceError': (C.c_int, [ptr, C.POINTER(name)]),
        'oidnNewBuffer': (ptr, [ptr, size]),
        'oidnWriteBuffer': (None, [ptr, size, size, ptr]),
        'oidnReadBuffer': (None, [ptr, size, size, ptr]),
        'oidnNewFilter': (ptr, [ptr, name]),
        'oidnSetFilterImage': (None, [ptr, name, ptr, C.c_int, size, size, size, size, size]),
        'oidnSetFilterInt': (None, [ptr, name, C.c_int]),
        'oidnSetFilterBool': (None, [ptr, name, C.c_bool]),
        'oidnCommitFilter': (None, [ptr]),
        'oidnExecuteFilter': (None, [ptr]),
        'oidnReleaseFilter': (None, [ptr]),
        'oidnReleaseBuffer': (None, [ptr]),
        'oidnReleaseDevice': (None, [ptr]),
    }
    for symbol, (result, arguments) in signatures.items():
        function = getattr(oidn, symbol)
        function.restype, function.argtypes = result, arguments

    device = oidn.oidnNewDevice(0)  # OIDN_DEVICE_TYPE_DEFAULT
    buffer = filter_handle = None

    def check():
        message = name()
        code = oidn.oidnGetDeviceError(device, C.byref(message))
        if code:
            raise RuntimeError(f'OIDN {code}: {message.value.decode() if message.value else "unknown error"}')

    try:
        check()
        if not device:
            raise RuntimeError('OIDN did not create a device')
        oidn.oidnCommitDevice(device)
        check()
        data = np.ascontiguousarray(rgb, dtype=np.float32)
        height, width, channels = data.shape
        if channels != 3 or not np.isfinite(data).all():
            raise ValueError('Expected finite linear RGB lightmap data')
        buffer = oidn.oidnNewBuffer(device, data.nbytes)
        check()
        oidn.oidnWriteBuffer(buffer, 0, data.nbytes, data.ctypes.data)
        filter_handle = oidn.oidnNewFilter(device, b'RT')
        check()
        for image_name in [b'color', b'output']:
            oidn.oidnSetFilterImage(filter_handle, image_name, buffer, 3, width, height, 0, 0, 0)
        oidn.oidnSetFilterBool(filter_handle, b'hdr', True)
        oidn.oidnSetFilterInt(filter_handle, b'quality', 6)  # OIDN_QUALITY_HIGH
        oidn.oidnSetFilterInt(filter_handle, b'maxMemoryMB', 2048)
        oidn.oidnCommitFilter(filter_handle)
        check()
        oidn.oidnExecuteFilter(filter_handle)
        check()
        oidn.oidnReadBuffer(buffer, 0, data.nbytes, data.ctypes.data)
        check()
        if not np.isfinite(data).all():
            raise RuntimeError('Denoised lightmap contains invalid values')
        return np.maximum(data, 0)
    finally:
        if filter_handle:
            oidn.oidnReleaseFilter(filter_handle)
        if buffer:
            oidn.oidnReleaseBuffer(buffer)
        if device:
            oidn.oidnReleaseDevice(device)
