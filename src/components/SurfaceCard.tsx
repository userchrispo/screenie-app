import { forwardRef } from 'react';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

interface SurfaceCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  flatStack?: boolean;
  className?: string;
  children: ReactNode;
}

export const SurfaceCard = forwardRef<HTMLElement, SurfaceCardProps>(function SurfaceCard(
  { as: Component = 'div', flatStack = false, className = '', children, ...rest },
  ref
) {
  const stackClass = flatStack ? ' surface-card--flat-stack' : '';
  return (
    <Component ref={ref} className={`surface-card${stackClass} ${className}`.trim()} {...rest}>
      {children}
    </Component>
  );
});
