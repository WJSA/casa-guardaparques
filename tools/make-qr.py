#!/usr/bin/env python
"""Generate the project QR codes.

Usage:  python tools/make-qr.py "https://tu-usuario.github.io/casa-guardaparques/"

Outputs (in assets/):
  qr.png          on-brand: dark bamboo on cream, high error correction
  qr-classic.png  plain black on white (most reliable backup for print)
"""
import sys, os
import qrcode
from qrcode.constants import ERROR_CORRECT_H

URL = sys.argv[1] if len(sys.argv) > 1 else "https://EXAMPLE.github.io/casa-guardaparques/"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets")

INK   = (10, 9, 8)       # casi negro cálido
CREAM = (242, 237, 225)  # crema del sitio

def build(path, fg, bg, box=20, border=4):
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=box, border=border)
    qr.add_data(URL)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fg, back_color=bg).convert("RGB")
    img.save(path)
    print(f"  {os.path.basename(path)}  ({img.size[0]}x{img.size[1]} px)")

print(f"URL: {URL}")
build(os.path.join(OUT, "qr.png"), INK, CREAM)
build(os.path.join(OUT, "qr-classic.png"), (0, 0, 0), (255, 255, 255))
print("Listo.")
