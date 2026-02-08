import { cssAndJs } from './utils/cssAndJs.ts';

export function NotFoundPage(
  data: any, 
): string {
  return `
    <html>
      <head>
        ${cssAndJs()}
      </head>

      <body>
        <pre class="content-wrapper not-found">
          Not Found: ${JSON.stringify(data)}
        </pre>
        
      </body>
    </html>
    `;
}
