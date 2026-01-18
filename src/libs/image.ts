export const createDataUriFromImageUrl = async (_url: string): Promise<string> => {
  const url = _url.includes('fileView') ? _url.replace('fileView', 'file') : _url;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.toLowerCase().startsWith('image/')) {
    throw new Error(`URL did not return an image (content-type: ${contentType ?? 'unknown'})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mime = contentType.split(';')[0];
  return `data:${mime};base64,${base64}`;
};