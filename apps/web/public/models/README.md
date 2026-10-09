# Model files

Put the trained model here as `public/models/v1/`:

```
public/models/v1/
  manifest.json   # see ARCHITECTURE.md section 7.2
  model.onnx      # quantized, about 10 MB or less
```

Until `manifest.json` exists the app runs scans in **demo mode** and says so on screen. Demo results are not real diagnoses.
After adding a model, run `pnpm content:validate` (class ids must match `content/diseases/*.json`).
