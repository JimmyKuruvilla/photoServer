export function isMedia(name: string): boolean {
  return isPic(name) || isVideo(name);
}

export function isPic(name: string): boolean {
  return /.+\.jpg$|jpeg$|png$/i.test(name);
}

export function isVideo(name: string): boolean {
  return /.+\.mp4$/i.test(name);
}
