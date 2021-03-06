import {MorphologicalAnalysis, MultiMorphologicalAnalysis} from '../../model/morphologicalAnalysis';
import {getSelectedLetters} from '../../model/analysisOptions';

export function getSelectedEnclitics(ma: MorphologicalAnalysis): string {

  const encliticsAnalysis = 'encliticsAnalysis' in ma
    ? ma.encliticsAnalysis
    : undefined;

  if (!encliticsAnalysis) {
    return '';
  }

  const selectedEncliticLetteredOptions = 'analysis' in encliticsAnalysis
    ? []
    : encliticsAnalysis.analysisOptions;

  return getSelectedLetters(selectedEncliticLetteredOptions).join('');
}

export function MultiMorphAnalysisSelection({ma}: { ma: MultiMorphologicalAnalysis }): JSX.Element | null {

  const {number, translation, analysisOptions} = ma;

  const encliticsAnalysis = 'encliticsAnalysis' in ma
    ? ma.encliticsAnalysis
    : undefined;

  const selectedAnalyses = analysisOptions.filter(({selected}) => selected);

  if (selectedAnalyses.length === 0) {
    return null;
  }

  const encliticsLetters = getSelectedEnclitics(ma);

  return (
    <div className="p-2 mb-2 bg-teal-200 rounded">
      <table className="table w-full">
        <tbody>
          {selectedAnalyses
            .map((ao) => <tr key={ao.letter}>
              <td>{number}{ao.letter}{encliticsLetters}</td>
              <td>{translation}</td>
              <td>{ao.analysis}</td>
              {(encliticsAnalysis && 'analysis' in encliticsAnalysis)
                ? <td>{encliticsAnalysis.enclitics} @ {encliticsAnalysis.analysis}</td>
                : <td/>}
            </tr>)}
        </tbody>
      </table>
    </div>
  );
}
