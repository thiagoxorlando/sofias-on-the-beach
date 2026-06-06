# Room Images

## Storage bucket

**Bucket name:** `room-images`  
**Public:** yes — all images are publicly readable without authentication  
**File size limit:** 5 MB  
**Allowed types:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

## Storage path format

```
rooms/{room_id}/{timestamp}-{safe-filename}
```

Example:
```
rooms/3f4a91b2-cc2e-4d1f-b6e4-abc123456789/1717700412345-suite-vista-mar.jpg
```

The `storage_path` column in `room_images` stores this relative path.  
The `url` column stores the full public URL returned by `getPublicUrl()`.

## How `room_images` maps to Storage

| `room_images` column | Value |
|---|---|
| `storage_path` | `rooms/{room_id}/{timestamp}-{filename}` |
| `url` | Full public Supabase Storage URL |
| `alt_text` | Admin-entered description (used as `<img alt>`) |
| `is_cover` | Only one cover per room. Used as the card image on homepage. |
| `sort_order` | Display order within the room's photo list |

Rows inserted before Storage upload was available may have `storage_path = url` (external URL). These are safe — `deleteImageAction` detects them by checking whether `storage_path.startsWith('rooms/')` and skips the Storage delete for external URLs.

## Cover image behavior

- Only one image per room can have `is_cover = true`.
- When the first image is uploaded for a room, it is automatically set as cover.
- Admin can change the cover at any time via "Definir capa" in the edit modal.
- Setting a new cover clears `is_cover` on all other images for that room first, then sets it on the selected image.

## Delete behavior

When an image is removed:

1. If `storage_path` starts with `rooms/` → the file is deleted from the `room-images` Storage bucket.
2. If `storage_path` is an external URL → only the `room_images` DB row is deleted; no Storage call is made.
3. The DB row is always deleted regardless.

## Where photos are managed

Photos are managed **inside the room edit modal** at `/dashboard/rooms`.

- Click **Editar** on any room to open the modal.
- The modal has two sections: **Dados do quarto** (room data form) and **Fotos do quarto** (photo management).
- When **creating** a new room, the Fotos section shows: *"Salve o quarto primeiro para adicionar fotos."* — because `room_images` requires a `room_id` that doesn't exist yet.
- After saving, click **Editar** to open the same room and upload photos.

## Homepage cover image resolution

`publicRooms.ts` joins `room_images` in its query and picks the cover image with this priority:

1. Image with `is_cover = true`
2. First image by `sort_order` (if no cover is set)
3. Local fallback: `/images/rooms/{slug}.jpg`
4. Static fallback data (if Supabase returns no featured active rooms at all)
