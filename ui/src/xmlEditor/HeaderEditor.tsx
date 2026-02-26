// HeaderEditor.tsx
import React, { useEffect, useState } from 'react';
import { MergeAttrs, MergedDoc } from './headerTypes';
import {
  DocumentEditTypes,
  allDocEditTypes,
  nameForDocEditType,
  attributesForDocEditType,
} from './documentEditTypes';
import { EditEvent } from './documentEditTypes';
import { useTranslation } from 'react-i18next';
import { domElementToEditEvent, editEventToDomElement } from './domHelper';

type HeaderEditorProps = {
  xml: string;
  onSave: (newXml: string) => void;
  onCancel: () => void;
  onCondenseEvents?: () => void;
};

// Extended merged doc structure that supports nested merges
interface MergedDocWithHistory {
  mDocID: string;
  history: EditEvent[];
  // Support for nested merged documents (cascading merges)
  nestedMerge?: {
    date: string;
    editor: string;
    docs: string;
  };
  nestedMergedDocs?: MergedDocWithHistory[];
}

// Utility function to condense events (can be called externally)
export const condenseEvents = (events: EditEvent[]): EditEvent[] => {
  if (events.length === 0) return events;

  // Group events by type, editor, and day
  const groups = new Map<string, EditEvent[]>();

  events.forEach((event) => {
    const eventDate = new Date(event.date);
    const dayKey = `${event.type}_${event.editor}_${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;

    if (!groups.has(dayKey)) {
      groups.set(dayKey, []);
    }
    groups.get(dayKey)!.push(event);
  });

  // Condense each group
  const condensedEvents: EditEvent[] = [];

  groups.forEach((groupEvents) => {
    if (groupEvents.length === 1) {
      // Only one event in group, keep as is
      condensedEvents.push(groupEvents[0]);
    } else {
      // Multiple events - condense them
      // Sort by date to get the latest timestamp
      groupEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const lastEvent = groupEvents[groupEvents.length - 1];

      // Combine comments
      const comments = groupEvents
        .map(e => e.extra?.comment)
        .filter(c => c && c.trim())
        .join(' | ');

      // Create condensed event with last timestamp
      condensedEvents.push({
        ...lastEvent,
        extra: {
          ...lastEvent.extra,
          comment: comments || '',
        },
      });
    }
  });

  // Sort by date
  condensedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return condensedEvents;
};

// Utility function to condense XML directly (can be called externally)
export const condenseXmlEvents = (xml: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('Invalid XML');
  }

  const header = doc.querySelector('AOHeader');
  if (!header) {
    throw new Error('No AOHeader found');
  }

  // Helper function to condense events in a meta element
  const condenseMetaEvents = (meta: Element) => {
    const events: EditEvent[] = [];
    const ignored = new Set(['merge', 'merged', 'creation-date', 'kor2', 'AOxml-creation']);

    // Collect events
    meta.childNodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;

      if (el.tagName === 'annotation') {
        el.querySelectorAll(':scope > annot').forEach((annotEl) => {
          events.push(domElementToEditEvent(annotEl));
        });
      } else if (!ignored.has(el.tagName)) {
        events.push(domElementToEditEvent(el));
      }
    });

    // Condense events
    const condensed = condenseEvents(events);

    // Remove old events
    const toRemove: Element[] = [];
    meta.childNodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      if (!ignored.has(el.tagName) && el.tagName !== 'merge') {
        toRemove.push(el);
      }
    });
    toRemove.forEach((el) => meta.removeChild(el));

    // Add condensed events back
    const annotEvents = condensed.filter(ev => ev.type === DocumentEditTypes.Annotation);
    const otherEvents = condensed.filter(ev => ev.type !== DocumentEditTypes.Annotation);

    if (annotEvents.length > 0) {
      const annotationEl = doc.createElement('annotation');
      annotEvents.forEach((ev) => {
        const annotEl = editEventToDomElement(doc, ev);
        annotationEl.appendChild(annotEl);
      });
      meta.appendChild(annotationEl);
    }

    otherEvents.forEach((ev) => {
      const el = editEventToDomElement(doc, ev);
      meta.appendChild(el);
    });
  };

  // Condense main meta events
  const mainMeta = header.querySelector(':scope > meta');
  if (mainMeta) {
    condenseMetaEvents(mainMeta);
  }

  // Condense merged doc events recursively
  const condenseMergedDocs = (mergedContainer: Element) => {
    mergedContainer.querySelectorAll(':scope > doc').forEach((docEl) => {
      const metaEl = docEl.querySelector(':scope > meta');
      if (metaEl) {
        condenseMetaEvents(metaEl);

        // Recursively handle nested merges
        const nestedMerged = metaEl.querySelector(':scope > merged');
        if (nestedMerged) {
          condenseMergedDocs(nestedMerged);
        }
      }
    });
  };

  const mergedContainer = header.querySelector(':scope > meta > merged');
  if (mergedContainer) {
    condenseMergedDocs(mergedContainer);
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
};

export const HeaderEditor: React.FC<HeaderEditorProps> = ({
  xml,
  onSave,
  onCancel,
  onCondenseEvents,
}) => {
  const [doc, setDoc] = useState<Document | null>(null);
  const { t } = useTranslation('common');

  const inputClasses = `
    w-full rounded border border-gray-300
    py-2 px-3 text-sm focus:outline-none
    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
    transition duration-150 ease-in-out`;

  // State for all form fields
  const [docID, setDocID] = useState('');
  const [merge, setMerge] = useState<MergeAttrs>({
    date: '',
    editor: '',
    docs: '',
  });
  const [editEvents, setEditEvents] = useState<EditEvent[]>([]);
  const [mergedDocs, setMergedDocs] = useState<MergedDocWithHistory[]>([]);

  // Parse XML on mount/change
  useEffect(() => {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(xml, 'application/xml');
    if (parsed.getElementsByTagName('parsererror').length) {
      console.error('Invalid XML');
      setDoc(null);
    } else {
      setDoc(parsed);
    }
  }, [xml]);

  // Recursive function to parse merged docs (handles cascading merges)
  const parseMergedDoc = (docEl: Element): MergedDocWithHistory => {
    const mDocID = docEl.querySelector(':scope > mDocID')?.textContent ?? '';
    const history: EditEvent[] = [];

    const metaInside = docEl.querySelector(':scope > meta');
    if (metaInside) {
      // Parse edit events from meta (including annotation events)
      metaInside.childNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const evEl = node as Element;
        const ignoredInner = new Set(['merged', 'creation-date', 'kor2', 'AOxml-creation']);

        // Handle <annotation> container - extract <annot> children as events
        if (evEl.tagName === 'annotation') {
          evEl.querySelectorAll(':scope > annot').forEach((annotEl) => {
            history.push(domElementToEditEvent(annotEl));
          });
        } else if (!ignoredInner.has(evEl.tagName)) {
          history.push(domElementToEditEvent(evEl));
        }
      });

      // Check for nested merged structure
      const nestedMergedContainer = metaInside.querySelector(':scope > merged');
      if (nestedMergedContainer) {
        const nestedMergeEl = metaInside.querySelector(':scope > merge');
        const nestedMerge = nestedMergeEl ? {
          date: nestedMergeEl.getAttribute('date') ?? '',
          editor: nestedMergeEl.getAttribute('editor') ?? '',
          docs: nestedMergeEl.getAttribute('docs') ?? '',
        } : undefined;

        const nestedMergedDocs: MergedDocWithHistory[] = [];
        nestedMergedContainer.querySelectorAll(':scope > doc').forEach((nestedDocEl) => {
          nestedMergedDocs.push(parseMergedDoc(nestedDocEl));
        });

        return {
          mDocID,
          history,
          nestedMerge,
          nestedMergedDocs,
        };
      }
    }

    return { mDocID, history };
  };

  // Populate state from parsed document
  useEffect(() => {
    if (!doc) return;
    const header = doc.querySelector('AOHeader');
    if (!header) return;

    // Parse docID
    const docIdEl = header.querySelector(':scope > docID');
    setDocID(docIdEl?.textContent ?? '');

    // Parse merge attributes
    const mergeEl = header.querySelector(':scope > meta > merge');
    setMerge({
      date: mergeEl?.getAttribute('date') ?? '',
      editor: mergeEl?.getAttribute('editor') ?? '',
      docs: mergeEl?.getAttribute('docs') ?? '',
    });

    // Parse main edit events (including annotation events)
    const meta = header.querySelector(':scope > meta');
    const events: EditEvent[] = [];
    if (meta) {
      const ignored = new Set(['merge', 'merged']);
      meta.childNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as Element;

        // Handle <annotation> container - extract <annot> children as events
        if (el.tagName === 'annotation') {
          el.querySelectorAll(':scope > annot').forEach((annotEl) => {
            events.push(domElementToEditEvent(annotEl));
          });
        } else if (!ignored.has(el.tagName)) {
          events.push(domElementToEditEvent(el));
        }
      });
    }
    setEditEvents(events);

    // Parse merged docs (including nested merges)
    const mergedArray: MergedDocWithHistory[] = [];
    const mergedContainer = header.querySelector(':scope > meta > merged');
    mergedContainer?.querySelectorAll(':scope > doc').forEach((docEl) => {
      mergedArray.push(parseMergedDoc(docEl));
    });
    setMergedDocs(mergedArray);
  }, [doc]);

  // Recursive function to build merged doc XML
  const buildMergedDocElement = (
    doc: Document,
    md: MergedDocWithHistory
  ): Element => {
    const docEl = doc.createElement('doc');

    const mDocIdEl = doc.createElement('mDocID');
    mDocIdEl.textContent = md.mDocID ?? '';
    docEl.appendChild(mDocIdEl);

    const metaEl = doc.createElement('meta');

    // Separate annotation events from other events
    const annotEvents = md.history.filter(ev => ev.type === DocumentEditTypes.Annotation);
    const otherEvents = md.history.filter(ev => ev.type !== DocumentEditTypes.Annotation);

    // Add annotation container if there are annotation events
    if (annotEvents.length > 0) {
      const annotationEl = doc.createElement('annotation');
      annotEvents.forEach((ev) => {
        const annotEl = editEventToDomElement(doc, ev);
        annotationEl.appendChild(annotEl);
      });
      metaEl.appendChild(annotationEl);
    }

    // Add other history events
    otherEvents.forEach((ev) => {
      const evEl = editEventToDomElement(doc, ev);
      metaEl.appendChild(evEl);
    });

    // Handle nested merges recursively
    if (md.nestedMerge && md.nestedMergedDocs && md.nestedMergedDocs.length > 0) {
      const nestedMergeEl = doc.createElement('merge');
      nestedMergeEl.setAttribute('date', md.nestedMerge.date);
      nestedMergeEl.setAttribute('editor', md.nestedMerge.editor);
      nestedMergeEl.setAttribute('docs', md.nestedMerge.docs);
      metaEl.appendChild(nestedMergeEl);

      const nestedMergedEl = doc.createElement('merged');
      md.nestedMergedDocs.forEach((nestedMd) => {
        nestedMergedEl.appendChild(buildMergedDocElement(doc, nestedMd));
      });
      metaEl.appendChild(nestedMergedEl);
    }

    docEl.appendChild(metaEl);
    return docEl;
  };

  // Build XML from form values
  const buildXmlFromValues = ({
    newDocID,
    newMerge,
    newEditEvents,
    newMergedDocs,
  }: {
    newDocID: string;
    newMerge: MergeAttrs;
    newEditEvents: EditEvent[];
    newMergedDocs: MergedDocWithHistory[];
  }) => {
    if (!doc) return '';
    const header = doc.querySelector('AOHeader');
    if (!header) return '';

    // Update docID
    const docIdEl = header.querySelector('docID');
    if (docIdEl) docIdEl.textContent = newDocID;

    // Update merge
    const mergeEl = header.querySelector('meta > merge');
    if (mergeEl) {
      mergeEl.setAttribute('date', newMerge.date);
      mergeEl.setAttribute('editor', newMerge.editor);
      mergeEl.setAttribute('docs', newMerge.docs);
    }

    // Update main edit events
    const meta = header.querySelector('meta');
    if (meta) {
      const keep = new Set(['merge', 'merged']);
      const toRemove: Element[] = [];
      meta.childNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as Element;
        if (!keep.has(el.tagName)) toRemove.push(el);
      });
      toRemove.forEach((el) => meta.removeChild(el));

      // Separate annotation events from other events
      const annotEvents = newEditEvents.filter(ev => ev.type === DocumentEditTypes.Annotation);
      const otherEvents = newEditEvents.filter(ev => ev.type !== DocumentEditTypes.Annotation);

      // Add annotation container if there are annotation events
      if (annotEvents.length > 0) {
        const annotationEl = doc.createElement('annotation');
        annotEvents.forEach((ev) => {
          const annotEl = editEventToDomElement(doc, ev);
          annotationEl.appendChild(annotEl);
        });
        meta.appendChild(annotationEl);
      }

      // Add other events directly to meta
      otherEvents.forEach((ev) => {
        const el = editEventToDomElement(doc, ev);
        meta.appendChild(el);
      });
    }

    // Update merged docs
    const mergedEl = header.querySelector('merged');
    if (mergedEl) {
      while (mergedEl.firstChild) mergedEl.removeChild(mergedEl.firstChild);

      newMergedDocs.forEach((md) => {
        mergedEl.appendChild(buildMergedDocElement(doc, md));
      });
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  };

  // Helper to convert form date to ISO
  const isoDate = (v: string | null) => (v ? new Date(v).toISOString() : '');

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const newDocID = (data.get('docID') as string) ?? '';

    const newMerge: MergeAttrs = {
      date: isoDate(data.get('merge.date') as string),
      editor: (data.get('merge.editor') as string) ?? '',
      docs: (data.get('merge.docs') as string) ?? '',
    };

    const newEditEvents: EditEvent[] = editEvents.map((_old, i) => {
      const prefix = `editEvents[${i}]`;
      const type =
        (data.get(`${prefix}.type`) as DocumentEditTypes) ??
        DocumentEditTypes.Annotation;
      const date = isoDate(data.get(`${prefix}.date`) as string);
      const editor = (data.get(`${prefix}.editor`) as string) ?? '';
      const comment = (data.get(`${prefix}.extra.comment`) as string) ?? '';

      const extra: Record<string, string> = { comment };
      const required = attributesForDocEditType(type);
      Object.keys(required).forEach((k) => {
        extra[k] = (data.get(`${prefix}.extra.${k}`) as string) ?? '';
      });

      return { type, date, data: '', editor, extra };
    });

    // Recursive function to read merged docs from form
    const readMergedDoc = (
      docIdx: number,
      prefix: string,
      originalDoc: MergedDocWithHistory
    ): MergedDocWithHistory => {
      const mDocID = (data.get(`${prefix}.mDocID`) as string) ?? '';

      const history: EditEvent[] = originalDoc.history.map((_old, evIdx) => {
        const evPrefix = `${prefix}.history[${evIdx}]`;
        const type =
          (data.get(`${evPrefix}.type`) as DocumentEditTypes) ??
          DocumentEditTypes.Annotation;
        const date = isoDate(data.get(`${evPrefix}.date`) as string);
        const editor = (data.get(`${evPrefix}.editor`) as string) ?? '';
        const comment = (data.get(`${evPrefix}.extra.comment`) as string) ?? '';

        const extra: Record<string, string> = { comment };
        const required = attributesForDocEditType(type);
        Object.keys(required).forEach((k) => {
          extra[k] = (data.get(`${evPrefix}.extra.${k}`) as string) ?? '';
        });

        return { type, date, data: '', editor, extra };
      });

      const result: MergedDocWithHistory = { mDocID, history };

      // Handle nested merges
      if (originalDoc.nestedMergedDocs && originalDoc.nestedMergedDocs.length > 0) {
        result.nestedMerge = {
          date: isoDate(data.get(`${prefix}.nestedMerge.date`) as string),
          editor: (data.get(`${prefix}.nestedMerge.editor`) as string) ?? '',
          docs: (data.get(`${prefix}.nestedMerge.docs`) as string) ?? '',
        };

        result.nestedMergedDocs = originalDoc.nestedMergedDocs.map((nestedDoc, nestedIdx) => {
          return readMergedDoc(
            nestedIdx,
            `${prefix}.nestedMergedDocs[${nestedIdx}]`,
            nestedDoc
          );
        });
      }

      return result;
    };

    const newMergedDocs: MergedDocWithHistory[] = mergedDocs.map((doc, docIdx) => {
      return readMergedDoc(docIdx, `mergedDocs[${docIdx}]`, doc);
    });

    const newXml = buildXmlFromValues({
      newDocID,
      newMerge,
      newEditEvents,
      newMergedDocs,
    });
    onSave(newXml);
  };

  // Handler for condense button
  const handleCondenseEvents = () => {
    // Condense main edit events
    setEditEvents(prev => condenseEvents(prev));

    // Condense merged doc events recursively
    const condenseMergedDocHistory = (doc: MergedDocWithHistory): MergedDocWithHistory => {
      const condensedDoc = {
        ...doc,
        history: condenseEvents(doc.history),
      };

      if (doc.nestedMergedDocs && doc.nestedMergedDocs.length > 0) {
        condensedDoc.nestedMergedDocs = doc.nestedMergedDocs.map(condenseMergedDocHistory);
      }

      return condensedDoc;
    };

    setMergedDocs(prev => prev.map(condenseMergedDocHistory));

    // Call external callback if provided
    if (onCondenseEvents) {
      onCondenseEvents();
    }
  };

  // Event handlers
  const deleteEditEvent = (idx: number) => {
    setEditEvents((prev) => prev.filter((_, i) => i !== idx));
  };

  const addEditEvent = () => {
    setEditEvents((prev) => [
      ...prev,
      {
        type: DocumentEditTypes.Annotation,
        date: new Date().toISOString(),
        data: '',
        editor: '',
        extra: {},
      },
    ]);
  };

  const deleteMergedEvent = (docIdx: number, evIdx: number) => {
    setMergedDocs((prev) => {
      const copy = [...prev];
      const targetDoc = { ...copy[docIdx] };
      targetDoc.history = targetDoc.history.filter((_, i) => i !== evIdx);
      copy[docIdx] = targetDoc;
      return copy;
    });
  };

  const addMergedEvent = (docIdx: number) => {
    setMergedDocs((prev) => {
      const copy = [...prev];
      const targetDoc = { ...copy[docIdx] };
      targetDoc.history = [
        ...targetDoc.history,
        {
          type: DocumentEditTypes.Annotation,
          date: new Date().toISOString(),
          data: '',
          editor: '',
          extra: {},
        },
      ];
      copy[docIdx] = targetDoc;
      return copy;
    });
  };

  const deleteMergedDoc = (idx: number) => {
    setMergedDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const addMergedDoc = () => {
    setMergedDocs((prev) => [
      ...prev,
      { mDocID: '', history: [] } as MergedDocWithHistory,
    ]);
  };

  // Render edit event row
  const EditEventRow: React.FC<{
    ev: EditEvent;
    idx: number;
    onChangeType: (type: DocumentEditTypes) => void;
    onDelete: () => void;
    t: (s: string) => string;
    namePrefix: string;
  }> = ({ ev, idx, onChangeType, onDelete, t, namePrefix }) => {
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as DocumentEditTypes;
      onChangeType(newType);
    };

    const requiredExtras = attributesForDocEditType(ev.type);

    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              {t('Edit type')}
            </label>
            <select
              className={inputClasses}
              value={ev.type}
              onChange={handleTypeChange}
              name={`${namePrefix}.type`}
            >
              {allDocEditTypes.map((v) => (
                <option key={v} value={v}>
                  {nameForDocEditType(v, t)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              {t('Editor')}
            </label>
            <input
              type="text"
              className={inputClasses}
              name={`${namePrefix}.editor`}
              defaultValue={ev.editor ?? ''}
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              {t('Date (timestamp)')}
            </label>
            <input
              type="datetime-local"
              lang="en-DE"
              className={inputClasses}
              name={`${namePrefix}.date`}
              defaultValue={ev.date.slice(0, 16)}
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              {t('Comment')}
            </label>
            <input
              type="text"
              className={inputClasses}
              name={`${namePrefix}.extra.comment`}
              defaultValue={ev.extra?.comment ?? ''}
            />
          </div>

          {Object.keys(requiredExtras).map((key) => (
            <div key={key}>
              <label className="block font-medium text-gray-700 mb-1">
                {t(key)}
              </label>
              <input
                type="text"
                className={inputClasses}
                name={`${namePrefix}.extra.${key}`}
                defaultValue={ev.extra?.[key] ?? ''}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-4 px-4 py-2 rounded bg-red-500 hover:bg-red-600 font-bold text-white transition"
          onClick={onDelete}
        >
          {t('Delete event')}
        </button>
      </div>
    );
  };

  // Render merged doc recursively
  const MergedDocSection: React.FC<{
    doc: MergedDocWithHistory;
    docIdx: number;
    namePrefix: string;
    onDelete: () => void;
    depth?: number;
  }> = ({ doc, docIdx, namePrefix, onDelete, depth = 0 }) => {
    const bgColor = depth === 0 ? 'bg-blue-50' : 'bg-purple-50';
    const borderColor = depth === 0 ? 'border-blue-300' : 'border-purple-300';

    return (
      <div className={`${bgColor} border-2 ${borderColor} rounded-lg p-4 mb-4 w-full`}>
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-2">
            {depth === 0 ? t('Merged doc ID') : t('Nested merged doc ID')}
          </label>
          <input
            type="text"
            className={inputClasses}
            name={`${namePrefix}.mDocID`}
            defaultValue={doc.mDocID}
          />
        </div>

        {/* History events */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            {t('Edit History')}
          </h4>
          {doc.history.map((ev, evIdx) => (
            <EditEventRow
              key={evIdx}
              ev={ev}
              idx={evIdx}
              namePrefix={`${namePrefix}.history[${evIdx}]`}
              t={t}
              onChangeType={(newType) => {
                setMergedDocs((prev) => {
                  const updateDoc = (
                    docs: MergedDocWithHistory[],
                    targetIdx: number,
                    currentDepth: number
                  ): MergedDocWithHistory[] => {
                    if (currentDepth === depth) {
                      const copy = [...docs];
                      copy[targetIdx] = {
                        ...copy[targetIdx],
                        history: copy[targetIdx].history.map((e, i) =>
                          i === evIdx ? { ...e, type: newType } : e
                        ),
                      };
                      return copy;
                    }
                    return docs;
                  };
                  return updateDoc(prev, docIdx, 0);
                });
              }}
              onDelete={() => deleteMergedEvent(docIdx, evIdx)}
            />
          ))}
          <button
            type="button"
            className="mt-2 px-4 py-2 rounded bg-green-600 hover:bg-green-700 font-bold text-white transition"
            onClick={() => addMergedEvent(docIdx)}
          >
            {t('Add event')}
          </button>
        </div>

        {/* Nested merge section */}
        {doc.nestedMergedDocs && doc.nestedMergedDocs.length > 0 && (
          <div className="mt-4 pl-4 border-l-4 border-purple-400">
            <h4 className="font-semibold text-gray-800 mb-2">
              {t('Nested Merge')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  {t('Merge date')}
                </label>
                <input
                  className={inputClasses}
                  type="datetime-local"
                  lang="en-DE"
                  name={`${namePrefix}.nestedMerge.date`}
                  defaultValue={doc.nestedMerge?.date.slice(0, 16) ?? ''}
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  {t('Merge editor')}
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  name={`${namePrefix}.nestedMerge.editor`}
                  defaultValue={doc.nestedMerge?.editor ?? ''}
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  {t('Merge docs')}
                </label>
                <input
                  className={inputClasses}
                  type="text"
                  name={`${namePrefix}.nestedMerge.docs`}
                  defaultValue={doc.nestedMerge?.docs ?? ''}
                />
              </div>
            </div>

            {doc.nestedMergedDocs.map((nestedDoc, nestedIdx) => (
              <MergedDocSection
                key={nestedIdx}
                doc={nestedDoc}
                docIdx={nestedIdx}
                namePrefix={`${namePrefix}.nestedMergedDocs[${nestedIdx}]`}
                onDelete={() => {
                  // Delete nested doc
                  setMergedDocs((prev) => {
                    const copy = [...prev];
                    const targetDoc = { ...copy[docIdx] };
                    if (targetDoc.nestedMergedDocs) {
                      targetDoc.nestedMergedDocs = targetDoc.nestedMergedDocs.filter(
                        (_, i) => i !== nestedIdx
                      );
                    }
                    copy[docIdx] = targetDoc;
                    return copy;
                  });
                }}
                depth={depth + 1}
              />
            ))}
          </div>
        )}

        <div className="flex space-x-2 mt-4">
          <button
            type="button"
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 font-bold text-white transition"
            onClick={onDelete}
          >
            {t('Delete merged doc')}
          </button>
        </div>
      </div>
    );
  };

  if (!doc) return null;
  const hasMerged = mergedDocs.length > 0;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-full p-6 bg-gray-50">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-300">
        <div className="flex space-x-2">
          <button
            type="button"
            className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 font-bold text-white transition"
            onClick={handleCondenseEvents}
            title={t('condenseEventsMouseOver')}
          >
            {t('condenseEvents')}
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 font-bold text-white transition"
            onClick={onCancel}
          >
            {t('Cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 font-bold text-white transition"
          >
            {t('Save')}
          </button>
        </div>
      </div>

      {/* Document ID */}
      <div className="mb-6">
        <label className="block font-bold text-gray-800 mb-2">
          {t('Document ID')}
        </label>
        <input
          type="text"
          name="docID"
          className={inputClasses}
          defaultValue={docID}
        />
      </div>

      {/* Main Edit Events */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {t('Edit Events')}
        </h3>
        {editEvents.map((ev, i) => (
          <EditEventRow
            key={i}
            ev={ev}
            idx={i}
            t={t}
            namePrefix={`editEvents[${i}]`}
            onChangeType={(newType) => {
              setEditEvents((prev) => {
                const copy = [...prev];
                copy[i] = { ...copy[i], type: newType };
                return copy;
              });
            }}
            onDelete={() => deleteEditEvent(i)}
          />
        ))}
        <button
          type="button"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 font-bold text-white transition"
          onClick={addEditEvent}
        >
          {t('Add edit event')}
        </button>
      </div>

      {/* Merge Section */}
      {hasMerged && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {t('Merge Information')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                {t('Merge date')}
              </label>
              <input
                className={inputClasses}
                type="datetime-local"
                lang="en-DE"
                name="merge.date"
                defaultValue={merge.date.slice(0, 16)}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                {t('Merge editor')}
              </label>
              <input
                className={inputClasses}
                type="text"
                name="merge.editor"
                defaultValue={merge.editor}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                {t('Merge docs')}
              </label>
              <input
                className={inputClasses}
                type="text"
                name="merge.docs"
                defaultValue={merge.docs}
              />
            </div>
          </div>
        </div>
      )}

      {/* Merged Documents */}
      {hasMerged && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {t('Merged Documents')}
          </h3>
          {mergedDocs.map((md, docIdx) => (
            <MergedDocSection
              key={docIdx}
              doc={md}
              docIdx={docIdx}
              namePrefix={`mergedDocs[${docIdx}]`}
              onDelete={() => deleteMergedDoc(docIdx)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="mb-6 px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 font-bold text-white transition"
        onClick={addMergedDoc}
      >
        {t('Add merged doc')}
      </button>
    </form>
  );
};
