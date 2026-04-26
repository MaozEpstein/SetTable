# Cloudinary Upload Preset — production hardening

The app uploads via the unsigned preset `settable_preset` (configured in
`src/services/cloudinary.ts`). Unsigned uploads are tied to the preset
config — anyone with the preset name can upload, so we must lock down
the preset itself, not the client code.

## Settings to apply (Cloudinary Console → Settings → Upload → settable_preset → Edit)

### Limits — prevent storage abuse
- **Max file size**: `10485760` (10 MB)
- **Max image width**: `2000` px
- **Max image height**: `2000` px
- **Allowed formats**: `jpg, png, webp` (drop everything else)

### Transformations — auto-optimize on upload
Add an "Incoming transformation" so every upload is normalized before
hitting our 25 GB tier:
```
quality: auto:good
format: auto
fetch_format: auto
width: 1600
height: 1600
crop: limit
```
This shrinks 4 MB iPhone snaps to ~300 KB without visible quality loss.

### Folder & tagging — organize for future cleanup
- **Folder**: `settable/foods` — keeps Cloudinary console tidy and lets
  us run bulk deletions if we ever migrate.
- **Tags**: `settable, food` — adds metadata for analytics/cleanup.

### Auth & abuse
- **Use filename**: `false` (we generate our own names)
- **Unique filename**: `true` (avoid collisions)
- **Overwrite**: `false` (don't let one user clobber another's upload)
- **Resource type**: `image` (block videos/raw — we never need them)

## Optional: tighten further later
- Switch to **signed uploads** with a Cloud Function that mints
  short-lived signatures. Requires a backend; deferred until we have
  real abuse signals.
- Add **moderation** (`webpurify` or `aws_rek`) — flags NSFW images
  automatically. Costs a few cents per 1k uploads.

## How to verify
After saving the preset, try uploading via the app — it should still
work. Then, in Cloudinary Console → Media Library, open any new upload
and confirm the dimensions are ≤2000×2000 and the format is `jpg`/`webp`.
