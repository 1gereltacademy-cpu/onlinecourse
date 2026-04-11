export function getStoragePathFromUrl(fileUrl) {
  if (!fileUrl) return null;

  try {
    const url = new URL(fileUrl);
    const marker = "/storage/v1/object/public/images/";
    const idx = url.pathname.indexOf(marker);

    if (idx === -1) return null;

    return decodeURIComponent(url.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}