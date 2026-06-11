export function isMacPlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function modKeyLabel(): string {
  return isMacPlatform() ? '⌘' : 'Ctrl';
}

export function modShortcutKeys(secondKey: string, thirdKey?: string): string[] {
  const mod = modKeyLabel();
  return thirdKey ? [mod, secondKey, thirdKey] : [mod, secondKey];
}

export function isModKey(event: KeyboardEvent): boolean {
  return isMacPlatform() ? event.metaKey : event.ctrlKey;
}
