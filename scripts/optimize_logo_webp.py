#!/usr/bin/env python3
"""Regenerate the two logo WebP assets from their transparent PNG originals."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = (
    ("assets/img/logos/LogoPrincipal/Verde.png", "assets/img/logos/LogoPrincipal/Verde.webp"),
    ("assets/img/logos/Isotipo2/Azul.png", "assets/img/logos/Isotipo2/Azul.webp"),
)


def optimize(source_rel: str, target_rel: str) -> None:
    source = ROOT / source_rel
    target = ROOT / target_rel
    if not source.is_file():
        raise FileNotFoundError(f"Logo source is missing: {source_rel}")

    with Image.open(source) as original:
        rgba = original.convert("RGBA")
        alpha_min, _ = rgba.getchannel("A").getextrema()
        if alpha_min == 255:
            raise ValueError(f"Source does not contain transparent pixels: {source_rel}")
        dimensions = rgba.size
        target.parent.mkdir(parents=True, exist_ok=True)
        rgba.save(
            target,
            format="WEBP",
            quality=90,
            method=6,
            exact=True,
            alpha_quality=100,
        )

    with Image.open(target) as optimized:
        if optimized.format != "WEBP":
            raise ValueError(f"Output is not WebP: {target_rel}")
        if optimized.mode not in ("RGBA", "LA"):
            raise ValueError(f"Output has no alpha channel: {target_rel}")
        if optimized.size != dimensions:
            raise ValueError(f"Dimensions changed for {target_rel}")
        alpha_min_out, _ = optimized.getchannel("A").getextrema()
        if alpha_min_out == 255:
            raise ValueError(f"Transparency was lost: {target_rel}")

    print(
        f"{source_rel} -> {target_rel}: {dimensions[0]}x{dimensions[1]}, "
        f"alpha preserved, {source.stat().st_size} -> {target.stat().st_size} bytes"
    )


if __name__ == "__main__":
    for source_path, target_path in ASSETS:
        optimize(source_path, target_path)
