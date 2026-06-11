interface SectionLabelProps {
  children: string;
  id?: string;
}

export function SectionLabel({ children, id }: SectionLabelProps) {
  return (
    <p className="section-label" id={id}>
      {children}
    </p>
  );
}
