import {
  MorphologicalAnalysis,
  MultiMorphologicalAnalysis,
  MultiMorphologicalAnalysisWithMultiEnclitics,
  MultiMorphologicalAnalysisWithoutEnclitics,
  MultiMorphologicalAnalysisWithSingleEnclitics,
  readMorphologicalAnalysis,
  SingleMorphologicalAnalysisWithMultiEnclitics,
  SingleMorphologicalAnalysisWithoutEnclitics,
  SingleMorphologicalAnalysisWithSingleEnclitics,
  writeMorphAnalysisValue
} from './morphologicalAnalysis';

function normalizeString(value: string): string {
  return value
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ');
}

const selected = false;

describe('morphologicalAnalysis', () => {

  // single morph, no enclitic

  const maString0 = 'wē-/uwa- @ kommen @ 3SG.PRS @ I.12 @ ';
  const ma0: Omit<SingleMorphologicalAnalysisWithoutEnclitics, 'number'> = {
    referenceWord: 'wē-/uwa-',
    translation: 'kommen',
    analysis: '3SG.PRS',
    paradigmClass: 'I.12',
    selected,
  };

  // single morph, single enclitic, no determinativ

  const maString1 = 'paršn=ā(e)- @ sich niederhocken @ VBN.GEN.SG @ I.9 += kkan @ OBPk @  @ ';
  const ma1: Omit<SingleMorphologicalAnalysisWithSingleEnclitics, 'number'> = {
    referenceWord: 'paršn=ā(e)-',
    translation: 'sich niederhocken',
    analysis: 'VBN.GEN.SG',
    paradigmClass: 'I.9',
    encliticsAnalysis: {enclitics: 'kkan', analysis: 'OBPk', selected},
    selected
  };

  // single morph, single enclitic, with determinativ

  const maString2 = 'parašnau=aš @ Mann des Niederhockens @ GENunh @ 30.12 += kkan @ OBPk @  @ (LÚ)';
  const ma2: Omit<SingleMorphologicalAnalysisWithSingleEnclitics, 'number'> = {
    referenceWord: 'parašnau=aš',
    translation: 'Mann des Niederhockens',
    analysis: 'GENunh',
    paradigmClass: '30.12',
    encliticsAnalysis: {enclitics: 'kkan', analysis: 'OBPk', selected},
    determinativ: '(LÚ)',
    selected
  };

  // single morph, multiple enclitics

  const maString3 = `gen=u- @ Knie @ STF @ 3.1.1
		   += aš @
		{ R → PPRO.3SG.C.NOM}
		{ S → PPRO.3PL.C.ACC} @  @ `;
  const ma3: Omit<SingleMorphologicalAnalysisWithMultiEnclitics, 'number'> = {
    referenceWord: 'gen=u-',
    translation: 'Knie',
    analysis: 'STF',
    paradigmClass: '3.1.1',
    encliticsAnalysis: {
      enclitics: 'aš',
      analysisOptions: [
        {letter: 'R', analysis: 'PPRO.3SG.C.NOM', selected},
        {letter: 'S', analysis: 'PPRO.3PL.C.ACC', selected}
      ]
    }
  };


  // multiple morphs, no enclitics

  const maString4 = 'gen=u- @ Knie @ { a → GEN.SG} { b → GEN.PL} { c → D/L.PL} @ 3.1.1 @ ';
  const ma4: Omit<MultiMorphologicalAnalysis, 'number'> = {
    referenceWord: 'gen=u-',
    translation: 'Knie',
    analysisOptions: [
      {letter: 'a', analysis: 'GEN.SG', selected},
      {letter: 'b', analysis: 'GEN.PL', selected},
      {letter: 'c', analysis: 'D/L.PL', selected}
    ],
    paradigmClass: '3.1.1'
  };

  const multMorphNoEncStr2 = `① tamnaššar=a-   @   Dam(ma)naššareš   @         
        { a → DN.GEN.PL}       
        { b → DN.D/L.PL}   @   35.1.2   @   D`;
  const multMorphNoEncRes2: Omit<MultiMorphologicalAnalysisWithoutEnclitics, 'number'> = {
    referenceWord: '① tamnaššar=a-',
    translation: 'Dam(ma)naššareš',
    analysisOptions: [
      {letter: 'a', analysis: 'DN.GEN.PL', selected},
      {letter: 'b', analysis: 'DN.D/L.PL', selected}
    ],
    paradigmClass: '35.1.2',
    determinativ: 'D'
  };

  // multiple morphs, single enclitic

  const maString5 = `mezull=a- @ Mez(z)ul(l)a @
		{ a → DN.NOM.SG(UNM)}
		{ b → DN.ACC.SG(UNM)}
		{ c → DN.GEN.SG(UNM)}
		{ d → DN.D/L.SG(UNM)}
		{ e → DN.ABL(UNM)}
		{ f → DN.INS(UNM)}
		{ g → DN.VOC.SG} @ 35.1.1
		   += ma @ CNJctr @  @ D`;
  const ma5: Omit<MultiMorphologicalAnalysisWithSingleEnclitics, 'number'> = {
    referenceWord: 'mezull=a-',
    translation: 'Mez(z)ul(l)a',
    analysisOptions: [
      {letter: 'a', analysis: 'DN.NOM.SG(UNM)', selected},
      {letter: 'b', analysis: 'DN.ACC.SG(UNM)', selected},
      {letter: 'c', analysis: 'DN.GEN.SG(UNM)', selected},
      {letter: 'd', analysis: 'DN.D/L.SG(UNM)', selected},
      {letter: 'e', analysis: 'DN.ABL(UNM)', selected},
      {letter: 'f', analysis: 'DN.INS(UNM)', selected},
      {letter: 'g', analysis: 'DN.VOC.SG', selected}
    ],
    paradigmClass: '35.1.1',
    encliticsAnalysis: {enclitics: 'ma', analysis: 'CNJctr', selected},
    determinativ: 'D'
  };


  // multiple morph, multiple enclitic

  const maString6 = `gen=u- @ Knie @
		{ a → NOM.SG.N}
		{ b → ACC.SG.N}
		{ c → NOM.PL.N}
		{ d → ACC.PL.N}
		{ e → STF} @ 3.1.2
		   += aš @
		{ R → PPRO.3SG.C.NOM}
		{ S → PPRO.3PL.C.ACC} @  @ `;
  const ma6: Omit<MultiMorphologicalAnalysisWithMultiEnclitics, 'number'> = {
    referenceWord: 'gen=u-',
    translation: 'Knie',
    analysisOptions: [
      {letter: 'a', analysis: 'NOM.SG.N', selected},
      {letter: 'b', analysis: 'ACC.SG.N', selected},
      {letter: 'c', analysis: 'NOM.PL.N', selected},
      {letter: 'd', analysis: 'ACC.PL.N', selected},
      {letter: 'e', analysis: 'STF', selected}
    ],
    paradigmClass: '3.1.2',
    encliticsAnalysis: {
      enclitics: 'aš',
      analysisOptions: [
        {letter: 'R', analysis: 'PPRO.3SG.C.NOM', selected},
        {letter: 'S', analysis: 'PPRO.3PL.C.ACC', selected}
      ]
    }
  };

  const multMorphMultEncStr2 = `②Ⓐ tamnaššar=a-   @   Dam(ma)naššareš   @         
        { a → DN.NOM.PL(UNM)}       
        { b → DN.HURR.ABS}       
        { c → DN.ACC.PL(UNM)}       
        { d → DN.GEN.PL(UNM)}       
        { e → DN.D/L.PL(UNM)}       
        { f → DN.ABL(UNM)}       
        { g → DN.INS(UNM)}       
        { h → DN.VOC.PL(UNM)}   @   35.1.2             
           +=    aš   @         
        { R → PPRO.3SG.C.NOM}       
        { S → PPRO.3PL.C.ACC}   @   D`;
  const multMorphMultEncRes2: Omit<MultiMorphologicalAnalysisWithMultiEnclitics, 'number'> = {

    referenceWord: '②Ⓐ tamnaššar=a-',
    translation: 'Dam(ma)naššareš',
    analysisOptions: [
      {letter: 'a', analysis: 'DN.NOM.PL(UNM)', selected},
      {letter: 'b', analysis: 'DN.HURR.ABS', selected},
      {letter: 'c', analysis: 'DN.ACC.PL(UNM)', selected},
      {letter: 'd', analysis: 'DN.GEN.PL(UNM)', selected},
      {letter: 'e', analysis: 'DN.D/L.PL(UNM)', selected},
      {letter: 'f', analysis: 'DN.ABL(UNM)', selected},
      {letter: 'g', analysis: 'DN.INS(UNM)', selected},
      {letter: 'h', analysis: 'DN.VOC.PL(UNM)', selected}
    ],
    determinativ: 'D',
    paradigmClass: '35.1.2',
    encliticsAnalysis: {
      enclitics: 'aš',
      analysisOptions: [
        {letter: 'R', analysis: 'PPRO.3SG.C.NOM', selected},
        {letter: 'S', analysis: 'PPRO.3PL.C.ACC', selected}
      ]
    },
  };

  test.each<[string, Omit<MorphologicalAnalysis, 'number'>]>([
    [normalizeString(maString0), ma0],
    [normalizeString(maString1), ma1],
    [normalizeString(maString2), ma2],
    [normalizeString(maString3), ma3],
    [normalizeString(maString4), ma4],
    [normalizeString(maString5), ma5],
    [normalizeString(multMorphNoEncStr2), multMorphNoEncRes2],
    [normalizeString(maString6), ma6],
    [normalizeString(multMorphMultEncStr2), multMorphMultEncRes2],
  ])(
    'should read a morphological analysis string "%s" as %j',
    (toRead, expected) => expect(readMorphologicalAnalysis(1, toRead, [])).toEqual({...expected, number: 1})
  );


  test.each([
    [ma0, normalizeString(maString0)],
    [ma1, normalizeString(maString1)],
    [ma2, normalizeString(maString2)],
    [ma3, normalizeString(maString3)],
    [ma4, normalizeString(maString4)],
    [ma5, normalizeString(maString5)],
    [ma6, normalizeString(maString6)],
  ])(
    'should write a morphological analysis %j to a string "%s"',
    (toWrite, expected) =>
      expect(writeMorphAnalysisValue({...toWrite, number: 1}))
        // FIXME: this replaces a (perhaps?) redundant @
        .toEqual(expected.replace(/@\s*@/, '@'))
  );


});