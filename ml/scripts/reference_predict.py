"""Reference prediction with the exact training preprocessing, to compare against the app.

Usage: python ml/scripts/reference_predict.py path/to/leaf.jpg [--crop maize|wheat|cotton]

Needs: pip install onnxruntime pillow numpy
If the app and this script disagree by more than about 1 percentage point on the same photo, preprocessing has drifted.
"""
import argparse, json, pathlib
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

MODEL_DIR = pathlib.Path(__file__).resolve().parents[2] / "apps/web/public/models/v1"

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--crop", choices=["maize", "wheat", "cotton"])
    args = ap.parse_args()

    manifest = json.loads((MODEL_DIR / "manifest.json").read_text())
    session = ort.InferenceSession(str(MODEL_DIR / manifest["modelFile"]), providers=["CPUExecutionProvider"])
    inp = manifest["input"]
    mean, std = np.array(inp["mean"], np.float32), np.array(inp["std"], np.float32)

    im = ImageOps.exif_transpose(Image.open(args.image)).convert("RGB")
    w, h = im.size
    s = inp["resizeShorterSide"]
    nw, nh = (s, int(s * h / w)) if w <= h else (int(s * w / h), s)          # torchvision Resize(int)
    im = im.resize((nw, nh), Image.BILINEAR)
    left, top = int(round((nw - inp["width"]) / 2.0)), int(round((nh - inp["height"]) / 2.0))  # CenterCrop
    im = im.crop((left, top, left + inp["width"], top + inp["height"]))
    x = ((np.asarray(im, np.float32) / 255 - mean) / std).transpose(2, 0, 1)[None]

    logits = session.run(None, {"images": x})[0][0] / manifest["temperature"]
    classes = manifest["classes"]
    allowed = [c for c in classes if args.crop is None or c["crop"] == args.crop]
    z = np.array([logits[c["index"]] for c in allowed])
    p = np.exp(z - z.max()); p /= p.sum()
    for i in np.argsort(-p)[:3]:
        print(f"{allowed[i]['id']:26} {p[i] * 100:5.1f}%")

if __name__ == "__main__":
    main()
