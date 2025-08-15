import { isVideo } from '../guards.ts';
import { generalToolbar } from './toolbar.ts';
import { FileItem } from '../services/listings.ts';
import { cssAndJs } from './cssAndJs.ts';

export function dirTemplate(locals: {
  dirs: FileItem[];
  files: FileItem[];
  media: FileItem[];
}): string {
  return `
  <html>
    <head> 
      ${cssAndJs()}
    </head>
    
    <body>
      <div class="toolbar">
        ${generalToolbar()}
        </div>
        <div class="dir section">
        ${locals.dirs
      .reverse()
      .map(
        i =>
          `<div class="dir"><a href="${i.viewPath}"><label>📁${i.name}</label></div>`
      )
      .join('')}
        </div>

        <div class="file section">
        ${locals.files
      .map(
        i =>
          `<div class="file"><a href="${i.viewPath}"><label>${i.name}</label></div>`
      )
      .join('')}
        </div>

        <div class="media section">
        ${locals.media
      .map(
        i =>
          `<div class="media"><a href="${i.viewPath}"><label>${i.name}</label>${isVideo(i.name)
            ? "🎞️"
            : i.thumbnail ? `<img src="${i.thumbnail}" class="thumbnail">` : "⚪"
          }</div>`
      )
      .join('')}
        </div>
    </body>
  </html>`;
}