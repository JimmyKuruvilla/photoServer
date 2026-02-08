import { SUPPORTED_METADATA, SupportedMetadata } from '../services/metadata.ts'

let metadataForm = ''
SUPPORTED_METADATA.forEach(metadata => {
  metadataForm += `<li>`
  metadataForm += `<label for="${metadata.name}">${metadata.name}</label>`
  metadataForm += `<input type="${metadata.type}" id="${metadata.name}"></input>`
  metadataForm += `</li>`
})

export const searchBox = () => {
  return `<div class="searchbox">
    <form>
    <ul>
      ${metadataForm}
    </ul>
    </form>
  </div>`
}