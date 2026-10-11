"""Builds apps/web/public/models/v1/manifest.json from the training outputs (class_names.json + model_config.json).

Usage: python ml/scripts/make_manifest.py [--reports ml/reports/model-v4] [--out apps/web/public/models/v1]

The training notebook names classes corn_* / cotton_curl_virus; the app uses maize_* / cotton_leaf_curl_virus.
That renaming lives here (APP_IDS) so the ONNX file never has to change. Class ORDER must stay exactly as trained.
"""
import argparse, hashlib, json, pathlib

APP_IDS = {
    "corn_blight": ("maize_blight", "maize", "disease"),
    "corn_common_rust": ("maize_common_rust", "maize", "disease"),
    "corn_gray_leaf_spot": ("maize_gray_leaf_spot", "maize", "disease"),
    "corn_healthy": ("maize_healthy", "maize", "healthy"),
    "cotton_bacterial_blight": ("cotton_bacterial_blight", "cotton", "disease"),
    "cotton_curl_virus": ("cotton_leaf_curl_virus", "cotton", "virus"),
    "cotton_fusarium_wilt": ("cotton_fusarium_wilt", "cotton", "disease"),
    "cotton_healthy": ("cotton_healthy", "cotton", "healthy"),
    "wheat_brown_rust": ("wheat_brown_rust", "wheat", "disease"),
    "wheat_healthy": ("wheat_healthy", "wheat", "healthy"),
    "wheat_mildew": ("wheat_mildew", "wheat", "disease"),
    "wheat_septoria": ("wheat_septoria", "wheat", "disease"),
    "wheat_yellow_rust": ("wheat_yellow_rust", "wheat", "disease"),
}

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--reports", default="ml/reports/model-v4")
    ap.add_argument("--out", default="apps/web/public/models/v1")
    ap.add_argument("--version", default="0.4.0-experimental")
    args = ap.parse_args()
    reports, out = pathlib.Path(args.reports), pathlib.Path(args.out)

    names = json.loads((reports / "class_names.json").read_text())
    cfg = json.loads((reports / "model_config.json").read_text())
    metrics = json.loads((reports / "evaluation_metrics.json").read_text())
    unknown = [n for n in names if n not in APP_IDS]
    if unknown:
        raise SystemExit(f"No app id for trained classes: {unknown}. Update APP_IDS.")

    model_bytes = (out / cfg["model_file"]).read_bytes()
    manifest = {
        "version": args.version,
        "experimental": True,
        "architecture": "mobilenetv3-small",
        "modelFile": cfg["model_file"],
        "input": {
            "width": cfg["input_size"][0],
            "height": cfg["input_size"][1],
            "layout": "CHW",
            "mean": cfg["normalization"]["mean"],
            "std": cfg["normalization"]["std"],
            "resizeShorterSide": cfg["resize_shorter_side"],
        },
        # 1.0 = uncalibrated. TODO: temperature scaling needs validation logits (not saved by notebook v4).
        "temperature": 1.0,
        "classes": [
            {"index": i, "id": APP_IDS[n][0], "crop": APP_IDS[n][1], "kind": APP_IDS[n][2]} for i, n in enumerate(names)
        ],
        "sha256": hashlib.sha256(model_bytes).hexdigest(),
        "metrics": {
            "testAccuracy": round(metrics["test_accuracy"], 4),
            "testMacroF1": round(metrics["test_macro_f1"], 4),
            "note": "Public-dataset test split, not field photos. See ml/reports/model-v4/README.md",
        },
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"wrote {out / 'manifest.json'} with {len(names)} classes")

if __name__ == "__main__":
    main()
