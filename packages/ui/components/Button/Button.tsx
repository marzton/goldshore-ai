import './Button.css';
import type { JSX } from 'astro/jsx-runtime';

type ButtonProps = JSX.IntrinsicElements['button'];

export function Button(props: ButtonProps) {
  const { class: className = '', ...rest } = props;
  return <button class={`gs-button ${className}`.trim()} {...rest} />;
}
