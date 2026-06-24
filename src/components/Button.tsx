import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn--primary',
  secondary: '',
  accent: 'btn--accent',
  ghost: 'btn--ghost',
  danger: 'btn--danger'
};

export function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  icon,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = ['btn', variantClass[variant], size === 'sm' ? 'btn--sm' : '', block ? 'btn--block' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {icon}
      {children}
    </button>
  );
}
