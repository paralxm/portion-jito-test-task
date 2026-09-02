import { useEffect, useState } from 'react';

/** Roughly the smallest software keyboard; smaller viewport changes are browser chrome. */
const KEYBOARD_THRESHOLD_PX = 150;

function textInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !['button', 'checkbox', 'radio', 'submit', 'range', 'file'].includes(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

/**
 * True while a software keyboard is actually open: the visual viewport has shrunk by
 * more than a keyboard's worth while a text control has focus. Desktop focus alone never
 * counts, so the navigation bar stays in place when a mouse user clicks into a field.
 */
export function useSoftwareKeyboard(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const shrink = window.innerHeight - viewport.height;
        setOpen(shrink > KEYBOARD_THRESHOLD_PX && textInputFocused());
      });
    };
    viewport.addEventListener('resize', update);
    window.addEventListener('focusin', update);
    window.addEventListener('focusout', update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', update);
      window.removeEventListener('focusin', update);
      window.removeEventListener('focusout', update);
    };
  }, []);

  return open;
}
