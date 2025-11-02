export function isMedia(name: string): boolean {
  return isImage(name) || isVideo(name);
}

export function isImage(name: string): boolean {
  return /.+\.jpg$|jpeg$|png$/i.test(name);
}

export function isVideo(name: string): boolean {
  return /.+\.mp4$/i.test(name);
}
