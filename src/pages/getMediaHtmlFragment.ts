import path from 'path';
import { isVideo } from '../guards.ts';
import { FileItem } from '../services/listings.ts';

export function getMediaHtmlFragment(
  item: FileItem,
  interval: number | null,
  beforeItem: FileItem | null,
  afterItem: FileItem | null
): string {
  let html: string;
  if (isVideo(item.srcPath)) {
    html = `<video controls autoplay class="video"><source src="${item.srcPath}" type="video/mp4"></video>`;
  } else {
    html =
      `<img src="${item.srcPath}" class="pic">`;
  }

  return `
  <div class="content-and-controls">
    <button class="rotate-right" onclick="rotateRight()"> 🌪️ </button>
    <a class="left arrow" href="${beforeItem?.viewPath || ''}"> << </a>
    ${html}
    <a class="right arrow" href="${afterItem?.viewPath || ''}"> >> </a>
  </div>`;
}