# Body Graph Assets

PNG images for the Recovery tab muscle fatigue visualization.

## How it works

Each muscle has one PNG. The component applies a `tintColor` dynamically based on the fatigue intensity tier — so you only need one image per muscle (not one per color/tier).

## Requirements for your PNGs

- **White silhouette on a fully transparent background**
- All images must share the **same canvas dimensions** (same width × height)
- Front and back images can be different canvas sizes from each other, but all front images must be identical dimensions, and all back images must be identical dimensions

## Naming convention

### `front/`

| File            | Muscle                               |
| --------------- | ------------------------------------ |
| `base.png`      | Body outline, no muscles highlighted |
| `chest.png`     | Chest / pectorals                    |
| `core.png`      | Abs / core                           |
| `biceps.png`    | Biceps                               |
| `shoulders.png` | Shoulders / delts                    |
| `legs.png`      | Quads, hamstrings, adductors         |

### `back/`

| File          | Muscle                               |
| ------------- | ------------------------------------ |
| `base.png`    | Body outline, no muscles highlighted |
| `back.png`    | Lats, upper back, traps              |
| `glutes.png`  | Glutes                               |
| `triceps.png` | Triceps                              |
| `calves.png`  | Calves                               |

## Intensity tier colors (applied as tintColor)

| Tier         | Sets | Color                   |
| ------------ | ---- | ----------------------- |
| 0 (none)     | 0    | Not rendered            |
| 1 (low)      | 1-6  | `#E0D6FF` light purple  |
| 2 (moderate) | 7-14 | `#B8A8FF` medium purple |
| 3 (high)     | 15+  | `#947AFF` full purple   |
