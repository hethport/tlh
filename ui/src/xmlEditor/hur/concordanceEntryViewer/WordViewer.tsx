import { JSX } from 'react';
import { Word } from '../corpus/wordType';
import { MyLeft, parseNewXml, XmlElementNode } from 'simple_xml';
import { tlhXmlEditorConfig } from '../../tlhXmlEditorConfig';
import { NodeDisplay } from '../../NodeDisplay';
import { MorphologicalAnalysis } from '../../../model/morphologicalAnalysis';
import { getTranslationAndMorphTag } from '../common/splitter';

interface IProps {
  word: Word;
  highlightedMa?: MorphologicalAnalysis;
}

export function WordViewer({ word, highlightedMa }: IProps): JSX.Element {
  const { transliteration, segmentation, gloss } = word;
  const parseResult = parseNewXml(transliteration, tlhXmlEditorConfig.readConfig);
  const shouldBeHighlighted = highlightedMa !== undefined &&
                              word.segmentation === highlightedMa.referenceWord &&
                              getTranslationAndMorphTag(word.gloss)[0] === highlightedMa.translation;
  const cssClass =  shouldBeHighlighted ? 'corpus-word font-bold' : 'corpus-word';
  
  return (
    <div className={cssClass}>
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
