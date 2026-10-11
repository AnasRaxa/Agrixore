# Datasets

Datasets are never committed. Licenses below are **not verified**: confirm each one on its source page before the FYP report, the viva, or any public release, and cite them. Dataset redistribution and deploying a model trained on the data are separate permission questions.

| Dataset | Crop | Source | License | Images used | Notes |
|---|---|---|---|---|---|
| corn_maize_leaf_disease | corn (maize) | Hugging Face: `Project-AgML/corn_maize_leaf_disease` | Unknown, check the dataset card | 4,184 | 3,852 of the 4,184 are 256x256, the usual size of lab-style PlantVillage photos. Expect optimistic accuracy |
| cotton-leaf-disease-dataset | cotton | Kaggle: `seroshkarim/cotton-leaf-disease-dataset` (via kagglehub) | Unknown, check the dataset page | 1,591 | 63-96% of images sit in near-duplicate groups (likely augmented copies); many different image sources |
| Long 2023 Plant Pathology, 999 photos | wheat | Zenodo record 7573133 | Check the Zenodo record | 999 | Field photos; the only set that resembles real use. Tiny test counts per class |

Counts come from `ml/reports/model-v4/class_distribution.csv` (6,774 images after cleaning).

## Still needed
- A `not_a_leaf` set (soil, hands, other plants, weeds, fruit, random objects) with a clear license
- Real field photos of corn, wheat and cotton from Punjab, kept out of training and used only for testing
