Supabase Storage setup for property-images bucket

1. In the Supabase dashboard go to "Storage" → "Create a new bucket".
2. Name: `property-images`
3. Public: Yes (for easy public CDN access). If you prefer private, switch to signed URLs in the client.
4. Recommended headers: set appropriate cache-control for images (e.g., `public, max-age=31536000, immutable`).

Upload policy notes:
- When uploading from the client, use the `supabase.storage.from('property-images').upload(path, file)` API.
- Store the returned public URL (via `supabase.storage.from('property-images').getPublicUrl(path)`) into `property_images.url`.

Delete images:
- Delete from storage then delete DB row. Keep operations idempotent.
