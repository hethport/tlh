// domHelpers.ts
import { DocumentEditTypes, EditEvent } from './documentEditTypes';

/**
 * Turn a `<annot …>` (or any edit‑type element) into a plain JS object.
 */
export function domElementToEditEvent(el: Element): EditEvent {
  const type = el.tagName as DocumentEditTypes;
  const dateAttr = el.getAttribute('date') ?? el.getAttribute('data') ?? '';
  const editor = el.getAttribute('editor') ?? '';

  // Grab the extra attributes that are defined for this type.
  const extra: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name;
    if (['date', 'data', 'editor', 'type'].includes(name)) continue;
    extra[name] = attr.value;
  }

  return {
    type,
    date: dateAttr,
    editor,
    extra,
  };
}

/**
 * Turn an EditEvent back into a DOM element (creates a fresh element each call).
 */
export function editEventToDomElement(doc: Document, ev: EditEvent): Element {
  const el = doc.createElement(ev.type);

  // always write the timestamp to the new attribute name
  if (ev.date) el.setAttribute('date', ev.date);

  if (ev.editor) el.setAttribute('editor', ev.editor);

  // write all extra attributes (including any custom comment field you stored there)
  if (ev.extra) {
    Object.entries(ev.extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        el.setAttribute(k, v);
      }
    });
  }

  // If the event type carries a textual payload (most do), write it as text content.
  if (ev.data) {
    el.textContent = ev.data;
  }

  return el;
}