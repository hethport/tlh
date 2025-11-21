// HeaderEditor.tsx
import React, { useEffect, useState } from 'react';
import { Modal } from '../genericElements/Modal';
import { MergeAttrs, MergedDoc } from './headerTypes';
import {
  DocumentEditTypes,
  allDocEditTypes,
  nameForDocEditType,
  attributesForDocEditType
} from './documentEditTypes';
import { EditEvent } from './documentEditTypes';
import { domElementToEditEvent, editEventToDomElement } from './domHelper';

type HeaderEditorProps = {
  xml: string;
  open: boolean;
  onSave: (newXml: string) => void;
  onCancel: () => void;
};

export const HeaderEditor: React.FC<HeaderEditorProps> = ({
  xml,
  open,
  onSave,
  onCancel,
}) => {
  // --------------------------------------------------------------
  // 1️⃣ Parse the XML when the modal opens
  // --------------------------------------------------------------
  const [doc, setDoc] = useState<Document | null>(null);
  useEffect(() => {
    if (!open) return;
    const parser = new DOMParser();
    const parsed = parser.parseFromString(xml, 'application/xml');
    if (parsed.getElementsByTagName('parsererror').length) {
      console.error('Invalid XML');
      setDoc(null);
    } else {
      setDoc(parsed);
    }
  }, [xml, open]);

  // --------------------------------------------------------------
  // 2️⃣ Basic header fields (docID, merge attrs)
  // --------------------------------------------------------------
  const [docID, setDocID] = useState('');
  const [merge, setMerge] = useState<MergeAttrs>({
    date: '',
    editor: '',
    docs: ''
  });

  // --------------------------------------------------------------
  // 3️⃣ Edit events that belong to the *main* <meta> element
  // --------------------------------------------------------------
  const [editEvents, setEditEvents] = useState<EditEvent[]>([]);

  // --------------------------------------------------------------
  // 4️⃣ Merged docs list (each merged doc has its own edit‑event array)
  // --------------------------------------------------------------
  interface MergedDocWithHistory extends MergedDoc {
    /** the history of that merged doc */
    mDocID: string;
    history: EditEvent[];
  }
  const [mergedDocs, setMergedDocs] = useState<MergedDocWithHistory[]>([]);

  // --------------------------------------------------------------
  // 5️⃣ Populate state when we have a parsed document
  // --------------------------------------------------------------
  useEffect(() => {
    if (!doc) return;

    const header = doc.querySelector('AOHeader');
    if (!header) return;

    // ---- docID -------------------------------------------------
    const docIdEl = header.querySelector('docID');
    setDocID(docIdEl?.textContent ?? '');

    // ---- merge attrs -------------------------------------------
    const mergeEl = header.querySelector('meta > merge');
    setMerge({
      date: mergeEl?.getAttribute('date') ?? '',
      editor: mergeEl?.getAttribute('editor') ?? '',
      docs: mergeEl?.getAttribute('docs') ?? ''
    });

    // ---- edit events (children of the main <meta>) ------------
    const meta = header.querySelector('meta');
    const events: EditEvent[] = [];
    if (meta) {
      // we deliberately ignore <merge> and <annotation> and <merged> – they are handled elsewhere
      const ignored = new Set(['merge', 'annotation', 'merged']);
      meta.childNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as Element;
        if (ignored.has(el.tagName)) return;
        events.push(domElementToEditEvent(el));
      });
    }
    setEditEvents(events);

    // ---- merged docs + their own history ----------------------
    const mergedArray: MergedDocWithHistory[] = [];
    const mergedContainer = header.querySelector('merged');
    mergedContainer?.querySelectorAll('doc').forEach(docEl => {
      const mDocID = docEl.querySelector('mDocID')?.textContent ?? '';
      const history: EditEvent[] = [];

      const metaInside = docEl.querySelector('meta');
      if (metaInside) {
        metaInside.childNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const evEl = node as Element;
          // same logic as for the main meta – everything that isn’t <annotation> or <merged> is an edit event
          const ignoredInner = new Set(['annotation', 'merged']);
          if (ignoredInner.has(evEl.tagName)) return;
          history.push(domElementToEditEvent(evEl));
        });
      }

      mergedArray.push({
        mDocID,
        history
      } as MergedDocWithHistory);
    });
    setMergedDocs(mergedArray);
  }, [doc]);


  // --------------------------------------------------------------
  // UI helpers for *merged‑doc* history
  // --------------------------------------------------------------
  const deleteMergedEvent = (docIdx: number, evIdx: number) => {
    setMergedDocs(prev => {
      const copy = [...prev];
      const targetDoc = { ...copy[docIdx] };
      targetDoc.history = targetDoc.history.filter((_e, i) => i !== evIdx);
      copy[docIdx] = targetDoc;
      return copy;
    });
  };
  const addMergedEvent = (docIdx: number) => {
    setMergedDocs(prev => {
      const copy = [...prev];
      const targetDoc = { ...copy[docIdx] };
      targetDoc.history = [
        ...targetDoc.history,
        {
          type: DocumentEditTypes.Annotation,
          date: new Date().toISOString(),
          data: '',
          editor: '',
          extra: {}
        }
      ];
      copy[docIdx] = targetDoc;
      return copy;
    });
  };

  // --------------------------------------------------------------
  // delete a *merged* <doc>
  // --------------------------------------------------------------

  const deleteMergedDoc = (idx: number) => {
    setMergedDocs(prev => prev.filter((_d, i) => i !== idx));
  };
  const updateMergedDocField = (
    idx: number,
    field: keyof MergedDocWithHistory,
    value: string
  ) => {
    setMergedDocs(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // --------------------------------------------------------------
  // Save – rebuild the XML from the current state
  // --------------------------------------------------------------
  const rebuildXml = () => {
    if (!doc) return '';

    const header = doc.querySelector('AOHeader');
    if (!header) return '';

    // ---- docID -------------------------------------------------
    const docIdEl = header.querySelector('docID');
    if (docIdEl) docIdEl.textContent = docID;

    // ---- merge ------------------------------------------------
    const mergeEl = header.querySelector('meta > merge');
    if (mergeEl) {
      mergeEl.setAttribute('date', merge.date);
      mergeEl.setAttribute('editor', merge.editor);
      mergeEl.setAttribute('docs', merge.docs);
    }

    // ---- main edit events ------------------------------------
    const meta = header.querySelector('meta');
    if (meta) {
      // remove all existing edit‑event elements (keep <merge>, <annotation>, <merged>)
      const keep = new Set(['merge', 'annotation', 'merged']);
      const toRemove: Element[] = [];
      meta.childNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as Element;
        if (!keep.has(el.tagName)) toRemove.push(el);
      });
      toRemove.forEach(el => meta.removeChild(el));

      // append the edited events in the order they appear in state
      editEvents.forEach(ev => {
        const el = editEventToDomElement(doc, ev);
        meta.appendChild(el);
      });
    }

    // ---- merged docs + their histories ------------------------
    const mergedEl = header.querySelector('merged');
    if (mergedEl) {
      // clear old <doc> children
      while (mergedEl.firstChild) mergedEl.removeChild(mergedEl.firstChild);

      mergedDocs.forEach(md => {
        const docEl = doc.createElement('doc');

        // <mDocID>
        const mDocIdEl = doc.createElement('mDocID');
        mDocIdEl.textContent = md.mDocID ?? '';
        docEl.appendChild(mDocIdEl);

        // <meta> for the merged doc
        const metaEl = doc.createElement('meta');
        md.history.forEach(ev => {
          const evEl = editEventToDomElement(doc, ev);
          metaEl.appendChild(evEl);
        });
        docEl.appendChild(metaEl);

        mergedEl.appendChild(docEl);
      });
    }

    // ---- final serialisation ----------------------------------
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  };

  // --------------------------------------------------------------
  // 10️⃣ UI – **single component that renders one edit event**
  // --------------------------------------------------------------
  const EditEventRow: React.FC<{
    ev: EditEvent;
    onChange: (e: EditEvent) => void;
    onDelete: () => void;
    t: (s: string) => string;
  }> = ({ ev, onChange, onDelete, t }) => {
    const handleCommon = (field: keyof Omit<EditEvent, 'extra'>) => (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      onChange({ ...ev, [field]: e.target.value });
    };

    const handleExtra = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...ev,
        extra: { ...ev.extra, [key]: e.target.value }
      });
    };

    const requiredExtras = attributesForDocEditType(ev.type);
    return (
      <div className="merged-doc" style={{ marginBottom: '16px' }}>
        {/* ---- type selector ----------------------------------- */}
        <label>{t('Edit type')}</label>
        <select
          value={ev.type}
          onChange={e => {
            const newType = e.target.value as DocumentEditTypes;
            // reset extra attributes when the type changes
            onChange({
              ...ev,
              type: newType,
              extra: Object.fromEntries(
                Object.keys(attributesForDocEditType(newType)).map(k => [k, ''])
              )
            });
          }}
        >
          {allDocEditTypes.map(v => (
            <option key={v} value={v}>
              {nameForDocEditType(v, t)}
            </option>
          ))}
        </select>

        {/* ---- common attributes -------------------------------- */}
        <label>{t('Date (timestamp)')}</label>
        <input
          type="datetime-local"
          value={ev.date.slice(0, 16)} // strip the trailing “Z” for the control
          onChange={e => {
            const iso = new Date(e.target.value).toISOString();
            onChange({ ...ev, date: iso });
          }}
        />
        {/* The old “data” field used to hold the timestamp. It is now called “date”. */}
        <label>{t('Comment')}</label>
        <input
          type="text"
          value={ev.extra?.comment ?? ''}   // you can keep free‑form comments in `extra`
          onChange={handleExtra('comment')}
        />
        <label>{t('Editor')}</label>
        <input type="text" value={ev.editor} onChange={handleCommon('editor')} />

        {/* ---- extra attributes (if any) ------------------------ */}
        {Object.keys(requiredExtras).map(key => (
          <React.Fragment key={key}>
            <label>{t(key)}</label>
            <input
              type="text"
              value={ev.extra[key] ?? ''}
              onChange={handleExtra(key)}
            />
          </React.Fragment>
        ))}

        {/* ---- delete button ----------------------------------- */}
        <button type="button" className="px-2 rounded bg-red-500 font-bold text-white" onClick={onDelete}>
          {t('Delete event')}
        </button>
      </div>
    );
  };

  // --------------------------------------------------------------
  // 11️⃣ Render the whole modal
  // --------------------------------------------------------------
  if (!doc) return null;

  const t = (s: string) => s; // replace with your i18n function if you have one

  const hasMerged = mergedDocs.length > 0;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Edit AOHeader"
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          const newXml = rebuildXml();
          onSave(newXml);
        }}
        className="modal-content"
      >
        {/* -------------------- Header fields -------------------- */}
        <div className="modal-header">
          <h2>{t('Document header')}</h2>
        </div>

        <div className="modal-body">
          {/* docID */}
          <label>{t('Document ID')}</label>
          <input
            type="text"
            value={docID}
            onChange={e => setDocID(e.target.value)}
          />

          {/* merge attributes */}
          {hasMerged && (
            <fieldset style={{ border: '1px solid #ddd', padding: '10px' }}>
              <legend>{t('Merge information')}</legend>
              <label>{t('Merge date')}</label>
              <input
                type="datetime-local"
                value={merge.date.slice(0, 16)}
                onChange={e => {
                  const iso = new Date(e.target.value).toISOString();
                  setMerge({ ...merge, date: iso });
                }}
              />
              <label>{t('Editor')}</label>
              <input
                type="text"
                value={merge.editor}
                onChange={e => setMerge({ ...merge, editor: e.target.value })}
              />
              <label>{t('Merged Document with labels')}</label>
              <input
                type="text"
                value={merge.docs}
                onChange={e => setMerge({ ...merge, docs: e.target.value })}
              />
            </fieldset>
          )}

          {/* ------------------- Main edit history ------------------- */}
          <section style={{ marginTop: '20px' }}>
            <h3>{t('Edit history (main document)')}</h3>
            {editEvents.map((ev, idx) => (
              <EditEventRow
                key={idx}
                ev={ev}
                t={t}
                onChange={newEv => {
                  const copy = [...editEvents];
                  copy[idx] = newEv;
                  setEditEvents(copy);
                }}
                onDelete={() => {
                  setEditEvents(prev => prev.filter((_e, i) => i !== idx));
                }}
              />
            ))}
            <button type="button" className="primary" onClick={() => {
              setEditEvents(prev => [
                ...prev,
                {
                  type: DocumentEditTypes.Annotation,
                  date: new Date().toISOString(),
                  data: '',
                  editor: '',
                  extra: {}
                }
              ]);
            }}>
              {t('Add new edit event')}
            </button>
          </section>

          {/* ------------------- Merged documents ------------------- */}
          {hasMerged && (
            <section style={{ marginTop: '30px' }}>
              <h3>{t('Merged documents')}</h3>
              {mergedDocs.map((md, idx) => (
                <div key={idx} className="merged-doc">
                  {/* mDocID (editable) */}
                  <label>{t('Merged Document ID (mDocID)')}</label>
                  <input
                    type="text"
                    value={md.mDocID}
                    onChange={e => updateMergedDocField(idx, 'mDocID', e.target.value)}
                  />

                  {/* history of this merged doc */}
                  <h4>{t('Edit history of this merged document')}</h4>
                  {md.history.map((ev, evIdx) => (
                    <EditEventRow
                      key={evIdx}
                      ev={ev}
                      t={t}
                      onChange={newEv => {
                        const copy = [...mergedDocs];
                        const target = { ...copy[idx] };
                        const newHist = [...target.history];
                        newHist[evIdx] = newEv;
                        target.history = newHist;
                        copy[idx] = target;
                        setMergedDocs(copy);
                      }}
                      onDelete={() => deleteMergedEvent(idx, evIdx)}
                    />
                  ))}
                  <button
                    type="button"
                    className="primary px-2 rounded bg-blue-500 text-white font-bold"
                    onClick={() => addMergedEvent(idx)}
                  >
                    {t('Add edit event to this merged doc')}
                  </button>

                  <button
                    type="button"
                    className="px-2 rounded bg-red-500 text-white font-bold"
                    onClick={() => deleteMergedDoc(idx)}
                  >
                    {t('Delete merged document')}
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* -------------------- Footer -------------------- */}
        <div className="modal-footer">
          <button type="button" onClick={onCancel}>
            {t('Cancel')}
          </button>
          <button type="submit" className="primary">
            {t('Save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};