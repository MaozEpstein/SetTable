// Cloudinary unsigned upload — runs entirely from the client.
// The upload preset is configured as "Unsigned" in the Cloudinary
// dashboard, which is what allows uploads without an API secret.
//
// Note: deleting from Cloudinary requires a signed request with the
// API secret. We don't have a backend, so when the user removes an
// image from a food we simply drop the URL from Firestore — the
// underlying asset stays orphaned in Cloudinary. This is fine within
// the 25 GB free tier for a family-scale app.
const CLOUD_NAME = 'dugrpbfai';
const UPLOAD_PRESET = 'settable_preset';

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

export async function uploadImageToCloudinary(localUri: string): Promise<string> {
  const formData = new FormData();
  // React Native accepts the { uri, type, name } shape on FormData.
  // We cast to any because the DOM FormData type doesn't model this.
  formData.append('file', {
    uri: localUri,
    type: 'image/jpeg',
    name: `upload_${Date.now()}.jpg`,
  } as unknown as Blob);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
    // Important: do NOT set Content-Type — fetch needs to add the
    // multipart boundary itself.
  });

  const data = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !data.secure_url) {
    const message = data.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Cloudinary: ${message}`);
  }

  return data.secure_url;
}

// Insert Cloudinary URL transformations to deliver a small, optimized
// thumbnail (auto format/quality, square crop). Falls back to the
// original URL if it isn't a Cloudinary delivery URL.
export function cloudinaryThumbnail(url: string, size = 120): string {
  const marker = '/image/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const transform = `f_auto,q_auto,c_fill,w_${size},h_${size}/`;
  return url.slice(0, idx + marker.length) + transform + url.slice(idx + marker.length);
}
