import { FileItem } from '../listings.ts';
import { generalToolbar } from './toolbar.ts';
import { getMediaHtmlFragment } from './getMediaHtmlFragment.ts';
import { cssAndJs } from './cssAndJs.ts';
import { NL } from '../constants.ts';
import { createTagEl } from './createTagEl.ts';

export function imgVidTemplate(
  item: FileItem, 
  type: string, 
  interval: number | null, 
  beforeItem: FileItem | null, 
  afterItem: FileItem | null
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

        <a href="${item.srcPath.replace(nameSection, '')}"> 
          <h6 class="webpath">${item.srcPath} ↗</h6>
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

          ${item?.tags?.map(createTagEl).join(NL)}
        </div>

        <script>
          if(${interval}){
            share.contentInterval = ${interval};
            replaceOnInterval(${interval}, "${type}");
          }
          share.photoItem = ${JSON.stringify(item)};

          window.history.replaceState({}, '', '/media?fullpath=${item.srcPath}');

        </script>

      </body>
    </html>
    `;
}
