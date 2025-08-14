import path from 'path';
import { isVideo } from './guards.ts';
import { generalToolbar } from './toolbar.ts';

const NL = '\n';

// Type definitions
interface DirectoryItem {
  name: string;
  webPath: string;
  fullPath: string;
}

interface MediaItem extends DirectoryItem {
  thumbnail?: string;
  tags: Array<{ id: number; value: string }>;
}

interface TemplateLocals {
  dirs: DirectoryItem[];
  files: DirectoryItem[];
  media: MediaItem[];
}

const cssAndJs = (): string => `
  <link rel="stylesheet" type="text/css" href="main.css">
  <script src="main.js"></script>
  `;

export function dirTemplate(locals: TemplateLocals): string {
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
              `<div class="dir"><a href="${i.webPath}"><label>📁${i.name}</label></div>`
          )
          .join('')}
        </div>

        <div class="file section">
        ${locals.files
          .map(
            i =>
              `<div class="file"><a href="${i.webPath}"><label>${i.name}</label></div>`
          )
          .join('')}
        </div>

        <div class="media section">
        ${locals.media
          .map(
            i =>
              `<div class="media"><a href="/media?fullpath=${
                i.fullPath
              }"><label>${i.name}</label>${
                isVideo(i.name)
                  ? "🎞️"
                  : i.thumbnail ? `<img src="${i.thumbnail}" class="thumbnail">` : "⚪"
              }</div>`
          )
          .join('')}
        </div>
    </body>
  </html>`;
}

export function getMediaHtmlFragment(
  item: MediaItem, 
  interval: number | null, 
  beforeItem: MediaItem | null, 
  afterItem: MediaItem | null
): string {
  let html: string;
  if (isVideo(item.webPath)) {
    html = `<video controls autoplay class="video"><source src="${interval ? path.join('..', item.webPath) : item.webPath
      }" type="video/mp4"></video>`;
  } else {
    html =
      `<img src="${interval ? path.join('..', item.webPath) : item.webPath
      }" class="pic">`;
  }

  return `
  <div class="content-and-controls">
    <button class="rotate-right" onclick="rotateRight()"> 🌪️ </button>
    <a class="left arrow" href="/media?fullpath=${beforeItem?.fullPath || ''}"> << </a>
    ${html}
    <a class="right arrow" href="/media?fullpath=${afterItem?.fullPath || ''}"> >> </a>
  </div>`;
}

const createTagEl = (tag: { id: number; value: string }): string => `
<div class="tag-group">
  <button class="delete-tag" data-tag-id=${tag.id} onclick="deleteTag(event)">⊖</button> 
  <button class="edit-tag" data-tag-id=${tag.id} onclick="editTag(event)">‣</button> 
  <div class="tag-text">${tag.value}</div>
</div>`;

export function imgVidTemplate(
  item: MediaItem, 
  type: string, 
  interval: number | null, 
  beforeItem: MediaItem | null, 
  afterItem: MediaItem | null
): string {
  const nameSection = `/${item.name}`;
  return `
    <html>
      <head>
        ${cssAndJs()}
      </head>

      <body>
        <div class="toolbar">
          ${generalToolbar(item as any)}
        </div>

        <a href="${item.webPath.replace(nameSection, '')}"> 
          <h6 class="webpath">${item.webPath} ↗</h6>
        </a>
        
        <div class="content-wrapper">
          ${getMediaHtmlFragment(item, interval, beforeItem, afterItem)}
        </div>

        
        <div class="tags">
          <div class="tag-group">
            <button class="add-tag" onclick="addTag()">⊕</button>
            <button class="search-by-tag" onclick="searchByTag('.add-tag-input')">🔎</button>
            <input class="add-tag-input" type="text" placeholder="add or edit a tag"></input>
          </div>

          ${item.tags.map(createTagEl).join(NL)}
        </div>

        <script>
          if(${interval}){
            share.contentInterval = ${interval};
            replaceOnInterval(${interval}, "${type}");
          }
          share.photoItem = ${JSON.stringify(item)};

          window.history.replaceState({}, '', '/media?fullpath=${item.fullPath}');

        </script>

      </body>
    </html>
    `;
}
