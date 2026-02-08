import { keyof } from 'zod/v4';
import { NL } from '../constants.ts';
import { FileItem } from '../services/listings.ts';
import { createTagEl } from './fragments/createTagEl.ts';
import { cssAndJs } from './utils/cssAndJs.ts';

import { generalToolbar } from './toolbar/toolbar.ts';
import { searchBox } from './fragments/searchBox.ts';
import { media } from './fragments/media.ts';

export function ItemPage(
  item: FileItem, 
  type: string, 
  interval: number | null, 
  beforeItem: FileItem | null, 
  afterItem: FileItem | null,
  isDev: boolean = false
): string {
  return `
    <html>
      <head>
        ${cssAndJs()}
        <link rel="prefetch" href="${beforeItem?.srcPath}" as="image">
        <link rel="prefetch" href="${afterItem?.srcPath}" as="image">
      </head>

      <body>
        ${searchBox()}

        <div class="toolbar">
          ${generalToolbar(item as any)}
        </div>

        <a href="${item.parentViewPath}"> 
          <h6 class="webpath">Parent Directory ↗</h6>
        </a>

        <ul class="metadata ${isDev ? 'shown' : 'hidden'}">
        ${item.metadata && Object.entries(item.metadata).map(([key, value]) => {
          return '<li>' + key + ' : ' + value + '</li>'
        }).join(NL)}
        </ul>
        
        <div class="content-wrapper img-vid">
          ${media(item, interval, beforeItem, afterItem)}
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
          share.mediaItem = ${JSON.stringify(item)};

          window.history.replaceState({}, '', '${item.viewPath}');

        </script>

      </body>
    </html>
    `;
}
