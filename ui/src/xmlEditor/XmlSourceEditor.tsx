import {CSSProperties, ReactElement, useMemo} from 'react';
import ReactCodeMirror from '@uiw/react-codemirror';
import {xml} from '@codemirror/lang-xml';
import {EditorView} from 'codemirror';
import {search, highlightSelectionMatches} from '@codemirror/search';

interface IProps {
  style?: CSSProperties;
  source: string;
  onChange: (value: string) => void;
}

export function XmlSourceEditor({style, source, onChange}: IProps): ReactElement {
  // Create scroll handling extension
  const scrollExtension = useMemo(() => {
    return EditorView.updateListener.of((update) => {
      if (update.selectionSet) {
        const view = update.view;
        const selection = update.state.selection.main;

        // Small delay to ensure DOM is updated
        setTimeout(() => {
          // Get the DOM coordinates of the selection
          const coords = view.coordsAtPos(selection.head);
          if (coords) {
            // Find the scrollable parent container
            let scrollParent = view.dom.parentElement;
            while (scrollParent) {
              const overflow = window.getComputedStyle(scrollParent).overflow;
              if (overflow === 'auto' || overflow === 'scroll') {
                break;
              }
              scrollParent = scrollParent.parentElement;
            }

            if (scrollParent) {
              const parentRect = scrollParent.getBoundingClientRect();
              const relativeTop = coords.top - parentRect.top;
              const relativeBottom = coords.bottom - parentRect.top;

              // Scroll parent if selection is not fully visible
              if (relativeTop < 50 || relativeBottom > parentRect.height - 50) {
                const scrollTo = scrollParent.scrollTop + relativeTop - (parentRect.height / 2);
                scrollParent.scrollTo({
                  top: scrollTo,
                  behavior: 'smooth'
                });
              }
            }
          }
        }, 10);
      }
    });
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <ReactCodeMirror
        className="xml-source-editor"
        height="100%"
        extensions={[
          xml(),
          EditorView.lineWrapping,
          search({
            top: true,
          }),
          highlightSelectionMatches(),
          scrollExtension,
          EditorView.theme({
            '&': {
              height: '100%'
            },
            '.cm-scroller': {
              overflow: 'auto'
            }
          })
        ]}
        value={source}
        onChange={onChange}
        basicSetup={{
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
        }}
      />
    </div>
  );
}
