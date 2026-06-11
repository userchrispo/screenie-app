import { forwardRef } from 'react';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  strong?: boolean;
  className?: string;
  children: ReactNode;
}

export const GlassPanel = forwardRef<HTMLElement, GlassPanelProps>(function GlassPanel(
  { as: Component = 'div', strong = false, className = '', children, ...rest },
  ref
) {
  const glassClass = strong ? 'glass-strong' : 'glass';
  return (
    <Component ref={ref} className={`${glassClass} ${className}`.trim()} {...rest}>
      {children}
    </Component>
  );
});
