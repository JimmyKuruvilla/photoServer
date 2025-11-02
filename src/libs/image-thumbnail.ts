// modified version of https://www.npmjs.com/package/image-thumbnail
import fs from 'fs';
import { imageSize } from 'image-size';
import sharp from 'sharp';

const PERCENTAGE = 10;
const RESPONSE_TYPE = 'buffer';

interface Dimensions {
  width?: number;
  height?: number;
}

interface ThumbnailOptions {
  percentage?: number;
  width?: number;
  height?: number;
  responseType?: 'buffer' | 'base64';
  jpegOptions?: any;
}

interface ImageInfo {
  format: string;
  width: number;
  height: number;
  size: number;
}

const fromPath = async (
  source: string, 
  percentage: number, 
  width: number | undefined, 
  height: number | undefined, 
  responseType: string, 
  jpegOptions: any | undefined
): Promise<Buffer | string> => {
  const imageBuffer = fs.readFileSync(source);

  const dimensions = getDimensions(imageBuffer, percentage, { width, height });
  const thumbnailBuffer = await sharpResize(imageBuffer, dimensions, jpegOptions);

  if (responseType === 'base64') {
    return thumbnailBuffer.toString('base64');
  }

  return thumbnailBuffer;
};

const createImageThumbnail = async (source: string, options?: ThumbnailOptions): Promise<Buffer | string> => {
  const percentage = options?.percentage ?? PERCENTAGE;
  const width = options?.width;
  const height = options?.height;
  const responseType = options?.responseType ?? RESPONSE_TYPE;
  const jpegOptions = options?.jpegOptions;

  return fromPath(source, percentage, width, height, responseType, jpegOptions);
};

export default createImageThumbnail;

const getDimensions = (imageBuffer: Buffer, percentageOfImage: number, dimensions: Dimensions): Dimensions => {
  if (typeof dimensions.width !== 'undefined' && typeof dimensions.height !== 'undefined') {
    return { width: dimensions.width, height: dimensions.height };
  }

  if (typeof dimensions.width !== 'undefined' || typeof dimensions.height !== 'undefined') {
    return mergeDimensions(imageBuffer, dimensions);
  }

  const originalDimensions = imageSize(imageBuffer);

  const width = parseInt((originalDimensions.width * (percentageOfImage / 100)).toFixed(0));
  const height = parseInt((originalDimensions.height * (percentageOfImage / 100)).toFixed(0));

  return { width, height };
};

const mergeDimensions = (imageBuffer: Buffer, dimensions: Dimensions): Dimensions => {
  const originalDimensions = imageSize(imageBuffer);
  let newDimensions: Dimensions = dimensions;

  if (typeof dimensions.width === 'undefined') {
    newDimensions = { width: originalDimensions.width, height: dimensions.height };
  } else if (typeof dimensions.height === 'undefined') {
    newDimensions = { width: dimensions.width, height: originalDimensions.height };
  }

  return newDimensions;
};

const sharpResize = (imageBuffer: Buffer, dimensions: Dimensions, jpegOptions?: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    sharp(imageBuffer)
      .resize({ 
        width: dimensions.width, 
        height: dimensions.height, // Fixed typo: heigth -> height
        withoutEnlargement: true 
      })
      .jpeg(jpegOptions ?? { force: false })
      .toBuffer((err: any, data: any, info: any) => {
        if (err) {
          reject(err);
        } else {
          if (info) {
            // Note: info object is available but we're not using it in the resolve
            resolve(data);
          } else {
            reject(`info missing properties: ${info}`);
          }
        }
      });
  });
};
