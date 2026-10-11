# Model v4 (MobileNetV3-Small, experimental)

Trained in Google Colab (`ml/notebooks/Agrixore_MobileNetV3_v4.ipynb`). Exported as ONNX and used by the app as `0.4.0-experimental`.

## Results (public-dataset test split, 1,024 images)

| Metric | Value |
|---|---|
| Accuracy | 94.5% |
| Macro F1 | 0.918 |
| Best epoch | 12 (early stopping at 17) |
| Model file | 6.1 MB, ONNX opset 17 |
| PyTorch vs ONNX max logit difference | 0.00027 |

Per class: see `evaluation_metrics.json` and `confusion_matrix.csv`.

## How to read these numbers (honest limits)
- **Not field accuracy.** Corn images are mostly lab-style PlantVillage photos; wheat is the only field-photo set and has 19-53 test images per class.
- **Cotton scores of ~100% are a warning sign, not a success.** The cotton data contains many near-duplicate or augmented copies, and hashing does not catch flipped or rotated copies, so train and test likely share images.
- **Closed set.** There is no `not_a_leaf` class. On blank inputs the raw model answered with confident diseases (black image: corn healthy 87%). The app therefore runs a pre-check (`apps/web/src/features/scan/photoCheck.ts`) and labels the model experimental.
- **Confidence is not calibrated** (temperature is 1.0 in the manifest). The validation logits needed for temperature scaling were not saved.
- **Fusarium wilt** cannot be reliably confirmed from a single leaf photo.

## Preprocessing (must match training)
Resize shorter side to 256 (torchvision rules, longer side truncated), center-crop 224, RGB, ImageNet mean/std. The web app reproduces this with a Pillow-compatible resize (`apps/web/src/ml/preprocess.ts`, unit-tested against Pillow output). Browser vs Python probabilities agree within 0.06 points on test images (`ml/scripts/reference_predict.py`).

## Class names
The notebook calls corn `corn_*` and the virus class `cotton_curl_virus`. The app uses `maize_*` and `cotton_leaf_curl_virus`. The mapping lives in `ml/scripts/make_manifest.py`, so the ONNX file never changes.

## Next version (v5) should
Add a `not_a_leaf` class; detect flipped/rotated cotton duplicates before splitting; use stronger field-like augmentation; save validation logits and calibrate; evaluate with the crop mask; add a real field test set.
