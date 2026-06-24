const TAG_COLOR_COUNT = 10;

/**
 * Maps a tag to a stable color class so each distinct tag keeps the same hue
 * across the app. Returns the shared `tag-color` hook plus a `tag-cN` palette
 * class that supplies the hue variables.
 */
export function tagColorClass(tag: string): string {
  const key = tag.trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }

  return `tag-color tag-c${hash % TAG_COLOR_COUNT}`;
}
