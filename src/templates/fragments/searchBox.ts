import { SUPPORTED_METADATA, SupportedMetadata } from '../../services/metadata.ts'

let metadataForm = ''
SUPPORTED_METADATA.forEach(metadata => {
  metadataForm += `<li>`
  metadataForm += `<label for="${metadata.name}">${metadata.name}</label>`
  metadataForm += `<input type="${metadata.type}" name="${metadata.name}" id="${metadata.name}">`
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
// 
// todo 1. click off, hide search
// press esc hide search
// hit enter, do search