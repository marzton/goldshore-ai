import './Button.css';
import type { JSX } from 'astro/jsx-runtime';

type ButtonProps = JSX.IntrinsicElements['button'];

export function Button(props: ButtonProps) {
  const { class: className = '', ...rest } = props;
  return <button class={`gs-button ${className}`.trim()} {...rest} />;

export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  class?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  [key: string]: unknown;
}

export function Button({
  variant = 'primary',
  class: className = '',
  ...props
}: ButtonProps) {
  const variantClass = variant === 'secondary' ? 'gs-button--secondary' : 'gs-button--primary';
  const classes = ['gs-button', variantClass, className].filter(Boolean).join(' ');

  return <button class={classes} {...props} />;
}
