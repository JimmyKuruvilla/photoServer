import { SUPPORTED_METADATA, SupportedMetadata } from '../../services/metadata.ts'

let metadataForm = ''
SUPPORTED_METADATA.forEach(metadata => {
  metadataForm += `<li>`
  metadataForm += `<label for="${metadata.dbName}">${metadata.displayName}</label>`
  metadataForm += `<input type="${metadata.htmlType}" name="${metadata.dbName}" id="${metadata.dbName}">`
  metadataForm += `</li>`
})

export const searchBox = () => {
  return `<div class="searchbox">
    <form id="searchbox-form" action="/metadata" method="get">
      <ul>
        ${metadataForm}
      </ul>
    </form>
    <button form="searchbox-form" type="submit" class="search-submit-btn">
      Search
    </button>
  </div>`
}