"""Restricted loader for the inspected checkpoint; never accepts weights from an API request."""

import hashlib
import importlib
import io
import os
from functools import lru_cache
from pathlib import Path

MODEL_SHA256 = "719df7a51f141b8acc00a0a519f117014f36c37dc87e89693a460fdfe212a051"
ALLOWED_CLASSES = {
    "torch.nn.modules.activation": ("SiLU",),
    "torch.nn.modules.batchnorm": ("BatchNorm2d",),
    "torch.nn.modules.container": ("ModuleList", "Sequential"),
    "torch.nn.modules.conv": ("Conv2d", "ConvTranspose2d"),
    "torch.nn.modules.linear": ("Identity",),
    "torch.nn.modules.pooling": ("MaxPool2d",),
    "torch.nn.modules.upsampling": ("Upsample",),
    "ultralytics.nn.modules.block": (
        "Attention",
        "Bottleneck",
        "C2PSA",
        "C3k",
        "C3k2",
        "DFL",
        "PSABlock",
        "Proto",
        "SPPF",
    ),
    "ultralytics.nn.modules.conv": ("Concat", "Conv", "DWConv"),
    "ultralytics.nn.modules.head": ("Segment",),
    "ultralytics.nn.tasks": ("SegmentationModel",),
}


def verified_bytes(path: Path) -> bytes:
    with path.open("rb") as stream:
        content = stream.read(64 * 1024 * 1024 + 1)
    if hashlib.sha256(content).hexdigest() != MODEL_SHA256:
        raise ValueError("Unrecognized checkpoint")
    return content


@lru_cache(maxsize=1)
def load_model(path: Path, threads: int):
    content = verified_bytes(path)
    # Set before importing Ultralytics: no connectivity probes, telemetry or model downloads.
    os.environ["YOLO_OFFLINE"] = "true"
    os.environ["YOLO_AUTOINSTALL"] = "false"
    config_dir = path.parent / "runtime"
    config_dir.mkdir(parents=True, exist_ok=True)
    os.environ["YOLO_CONFIG_DIR"] = str(config_dir.resolve())

    import torch
    from ultralytics import settings
    from ultralytics.nn.tasks import SegmentationModel

    settings.update({"sync": False})
    torch.set_num_threads(threads)
    allowed = [
        getattr(importlib.import_module(module), name)
        for module, names in ALLOWED_CLASSES.items()
        for name in names
    ]
    with torch.serialization.safe_globals(allowed):
        checkpoint = torch.load(io.BytesIO(content), map_location="cpu", weights_only=True)
    model = checkpoint["model"]
    if type(model) is not SegmentationModel or model.names != {0: "herida"}:
        raise ValueError("Unexpected model contract")
    return model.float().eval()
