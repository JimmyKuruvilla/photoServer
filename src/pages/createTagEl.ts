export const createTagEl = (tag: { id: number; value: string }): string => `
<div class="tag-group">
  <button class="delete-tag" data-tag-id=${tag.id} onclick="deleteTag(event)">⊖</button> 
  <button class="edit-tag" data-tag-id=${tag.id} onclick="editTag(event)">‣</button> 
  <div class="tag-text">${tag.value}</div>
</div>`;