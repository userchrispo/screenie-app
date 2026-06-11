interface CommandKeyProps {
  keys: string[];
  label: string;
}

export function CommandKey({ keys, label }: CommandKeyProps) {
  return (
    <kbd className="command-key" aria-label={label}>
      {keys.map((key, index) => (
        <span key={`${key}-${index}`} aria-hidden="true">
          {key}
        </span>
      ))}
    </kbd>
  );
}
