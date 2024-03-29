import {MergeLine} from './mergeDocument';
import {JSX, useState} from 'react';
import {MergeDocumentLine} from './DocumentMerger';
import {useTranslation} from 'react-i18next';
import {
  findFirstXmlElementByTagName,
  isXmlElementNode,
  isXmlTextNode,
  writeNode,
  writeNodeWithDefaultWriteConfig,
  XmlElementNode,
  xmlElementNode,
  XmlNode,
  xmlTextNode
} from 'simple_xml';
import xmlFormat from 'xml-formatter';
import {tlhXmlEditorConfig} from '../xmlEditor/tlhXmlEditorConfig';
import {makeDownload} from '../downloadHelper';

interface IProps {
  lines: MergeLine[];
  header: XmlElementNode;
  publicationMapping: Map<string, string[]>;
}

interface exportState {
  mergerName: string;
  isExportDisabled: boolean;
}

export function MergedDocumentView({lines, header, publicationMapping}: IProps): JSX.Element {

  const {t} = useTranslation('common');
  const [state, setState] = useState<exportState>({mergerName: '', isExportDisabled: true});


  function onExport(): void {
    const lineNodes = lines
      .map<XmlNode[]>(({lineNumberNode, rest}) => [lineNumberNode, ...rest])
      .flat();
    const publMapping = writePublMapping();
    const publicationMappingString: string[] = getPublicationMappingString(publMapping);
    const childNodes = publMapping.concat(lineNodes);
    const newBody: XmlElementNode = {
      tagName: 'body',
      attributes: {},
      children: [xmlElementNode('div1', {'type': 'transliteration'}, [xmlElementNode('text', {'xml:lang': 'XXXlang'}, childNodes)])]
    };

    header.children.forEach((node) => {
      if (isXmlElementNode(node) && node.tagName === 'meta') {
        node.children.forEach((cnode) => {
            if (isXmlElementNode(cnode) && cnode.tagName === 'merge') {
              cnode.attributes['editor'] = state.mergerName;
              cnode.attributes['docs'] = publicationMappingString.join(' ');
              console.log(cnode.attributes['editor']);
            }
          }
        );
      }
    });


    const AOxml: XmlElementNode = {
      tagName: 'AOxml',
      attributes: {
        'xmlns:hpm': 'http://hethiter.net/ns/hpm/1.0',
        'xmlns:AO': 'http://hethiter.net/ns/AO/1.0',
        'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
        'xmlns:meta': 'urn:oasis:names:tc:opendocument:xmlns:meta:1.0',
        'xmlns:text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
        'xmlns:table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
        'xmlns:draw': 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',
        'xmlns:xlink': 'http://www.w3.org/1999/xlink'
      },
      children: [header, newBody]
    };


    const exported: string = writeNode(AOxml, tlhXmlEditorConfig.writeConfig).join('\n');
    console.log(exported);
    let filename = 'merged';
    const docIDnode = findFirstXmlElementByTagName(header, 'docID');

    if (docIDnode && isXmlTextNode(docIDnode.children[0])) {
      filename = docIDnode.children[0].textContent;
    }

    makeDownload(exported, filename + '.xml');
  }

  function writePublMapping(): XmlNode[] {
    const publications: XmlNode[] = [];
    console.log(publicationMapping);
    let i = 0;
    for (const publ of Array.from(publicationMapping.values())) {
      if (i > 0) {
        publications.push(xmlTextNode('+'));
      }
      console.log(publ[1] + '{€' + publ[0] + '}');
      publications.push(xmlElementNode('AO:TxtPubl',
        {},
        [xmlTextNode(
          (publ[1] + ' {€' + publ[0] + '}')
            .replaceAll('\n', '')
            .replaceAll('\t', '')
        )]));
      i++;
    }

    return [xmlElementNode('AO:Manuscripts', {}, publications)];
  }


  function getPublicationMappingString(publMapping: XmlNode[]): string [] {
    const output: string[] = [];

    for (const publication of publMapping) {
      if (isXmlElementNode(publication)) {
        for (const childPub of publication.children) {
          if (isXmlElementNode(childPub) && isXmlTextNode(childPub.children[0])) {
            output.push(childPub.children[0].textContent);
          } else if (isXmlTextNode(childPub)) {
            output.push(childPub.textContent);
          }
        }
      }
    }

    return output;
  }

  function setMergerReg(input: string) {
    setState({mergerName: input, isExportDisabled: (input == '')});
  }

  return (
    <>
      <div className="mb-4">
        <label htmlFor="mergerName" className="font-bold">{t('editorName')}:</label>
        <input name="mergerName" id="mergerName" placeholder={t('editorAbbreviation')} className="mt-2 p-2 rounded border w-full"
               onChange={e => setMergerReg(e.target.value)}></input>
      </div>
      <button type="button" className="mb-2 p-2 rounded bg-blue-500 text-white w-full" onClick={onExport} disabled={state.isExportDisabled}>{
        state.isExportDisabled ? t('disabled_export') : t('export')
      }</button>
      <pre><code>{xmlFormat(writeNodeWithDefaultWriteConfig(header).join('\n'), {
        indentation: '  ',
        collapseContent: true,
        lineSeparator: '\n'
      })}</code></pre>
      {lines.map((l, index) => <p key={index}><MergeDocumentLine line={l}/></p>)}
    </>
  );
}