import { cssAndJs } from './cssAndJs.ts';

export function logTemplate(
  logContents: string, 
): string {
  return `
    <html>
      <head>
        ${cssAndJs()}
      </head>

      <body>
        <div class="toolbar"></div>
        
        <pre class="content-wrapper log">
          ${logContents}
        </pre>
        
      </body>
    </html>
    `;
}
