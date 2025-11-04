import { JSX } from 'react';
import { Word } from '../corpus/wordConstructor';
import { MyLeft, parseNewXml, XmlElementNode } from 'simple_xml';
import { tlhXmlEditorConfig } from '../../tlhXmlEditorConfig';
import { NodeDisplay } from '../../NodeDisplay';

interface IProps {
  word: Word;
}

export function WordViewer({ word }: IProps): JSX.Element {
  const { transliteration, segmentation, gloss } = word;
  const parseResult = parseNewXml(transliteration, tlhXmlEditorConfig.readConfig);
  
  return (
    <div className="corpus-word">
      <div className="corpus-word-field">
        {parseResult instanceof MyLeft ? <>{transliteration}</>
        : <NodeDisplay node={parseResult.value as XmlElementNode}
                       isLeftSide={true} />}
      </div>
      <div className="corpus-word-field">
        &nbsp;{segmentation}
      </div>
      <div className="corpus-word-field">
        &nbsp;{gloss}
      </div>
    </div>
  );
}
