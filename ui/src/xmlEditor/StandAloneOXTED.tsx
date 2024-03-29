import { ReactElement, useState } from 'react';
import { FileLoader } from '../forms/FileLoader';
import { findFirstXmlElementByTagName, writeNode, XmlElementNode, XmlNode } from 'simple_xml';
import { XmlDocumentEditor } from './XmlDocumentEditor';
import { XmlEditorConfig } from './editorConfig';
import { useTranslation } from 'react-i18next';
import { reCountNodeNumbers, tlhXmlEditorConfig } from './tlhXmlEditorConfig';
import { OxtedExportData } from './OxtedExportData';
import { makeDownload } from '../downloadHelper';
import { DocumentEditTypes } from './documentEditTypes';
import { XmlValidityChecker } from './XmlValidityChecker';

const locStoreKey = 'editorState';

interface IProps {
  editorConfig: XmlEditorConfig;
}

interface LoadedDocument {
  filename: string;
  source: string;
}

function initialState(): LoadedDocument | undefined {
  const maybeEditorState = localStorage.getItem(locStoreKey);

  if (maybeEditorState === null) {
    return undefined;
  }

  const parsed = JSON.parse(maybeEditorState);

  return 'filename' in parsed && 'source' in parsed ? parsed : undefined;
}

const autoSave = (filename: string, rootNode: XmlNode): void => {
  localStorage.setItem(locStoreKey, JSON.stringify({ filename, source: writeXml(rootNode as XmlElementNode) }));
};

export const writeXml = (rootNode: XmlElementNode, expand = false): string => {
  reCountNodeNumbers(rootNode, 'node', 'n');
  reCountNodeNumbers(rootNode, 'clb', 'nr');

  const lines = writeNode(rootNode, tlhXmlEditorConfig.writeConfig)
    .join('\n');

  if (expand) {
    return lines
      .replaceAll(/®/g, '\n\t')
      .replaceAll(/{/g, '\n\t\t{')
      .replaceAll(/\+=/g, '\n\t\t   += ')
      .replaceAll(/<w/g, '\n <w')
      .replaceAll(/<lb/g, '\n\n<lb')
      .replaceAll(/ mrp/g, '\n\tmrp')
      .replaceAll(/@/g, ' @ ');
  } else {
    return lines
      .replaceAll(/\s+/g, ' ')
      .replaceAll(' @ ', '@')
      .replaceAll('</w><w', '</w> <w')
      .replaceAll('</text>', '\n</text>')
      .replaceAll('<lb ', '\n<lb ')
      .replaceAll('<gap t="line"', '\n<gap t="line"')
      .replaceAll('<AO:Manuscripts>', '\n<AO:Manuscripts>')
      .replaceAll('</AO:Manuscripts>', '</AO:Manuscripts>\n');
  }
};

export function StandAloneOXTED({ editorConfig }: IProps): ReactElement {

  const { t } = useTranslation('common');
  const [loadedDocument, setLoadedDocument] = useState<LoadedDocument | undefined>(initialState());
  const [exportAddNode, setExportAddNode] = useState<XmlElementNode>();

  const readFile = async (file: File) => {
    const source = await file.text();

    setLoadedDocument({ source, filename: file.name });
  };

  function download(rootNode: XmlElementNode): void {
    if (loadedDocument === undefined) {
      return;
    }

    if (exportAddNode === undefined) {
      alert(t('pleaseSpecifyAuthor'));
      return;
    }

    const attributesWithoutValue = Object.entries(exportAddNode.attributes)
      .filter(([/* _ */, value]) => value === undefined || value.trim().length === 0)
      .map(([key]) => key);

    if (attributesWithoutValue.length > 0) {
      alert(t('pleaseSpecifyAttributes') + ': ' + attributesWithoutValue.join(','));
      return;
    }

    // set update type
    const tagNameToInsert = exportAddNode.tagName === DocumentEditTypes.Annotation || exportAddNode.tagName === DocumentEditTypes.Validation
      ? 'annotation'
      : 'meta';

    const nodeToAddTo = findFirstXmlElementByTagName(rootNode, tagNameToInsert);

    // FIXME: create nodeToAddTo if not exists!

    if (nodeToAddTo === undefined) {
      alert('Internal error!');
      return;
    }

    nodeToAddTo.children.push(exportAddNode);

    makeDownload(writeXml(rootNode), loadedDocument.filename);
  }

  function closeFile(): void {
    setLoadedDocument(undefined);
    localStorage.removeItem(locStoreKey);
  }

  return (
    <div className="h-full max-h-full">
      {loadedDocument
        ? (
          <XmlValidityChecker xmlSource={loadedDocument.source}>
            {(rootNode) =>
              <XmlDocumentEditor node={rootNode} editorConfig={editorConfig} onExportXml={download} filename={loadedDocument.filename}
                closeFile={closeFile} autoSave={(node) => autoSave(loadedDocument.filename, node)}>
                <OxtedExportData setExportNode={setExportAddNode} />
              </XmlDocumentEditor>}
          </XmlValidityChecker>
        ) : (
          <div className="container mx-auto">
            <FileLoader accept="text/xml" onLoad={readFile} />
          </div>
        )}
    </div>
  );
}