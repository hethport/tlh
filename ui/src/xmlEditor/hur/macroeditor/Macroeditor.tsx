import { JSX, useState } from 'react';
import { ChangesViewerContainer } from '../changes/ChangesViewerContainer';
import { ChangesListClearer } from '../textEditor/ChangesListClearer';

interface IProps {
  initialChanges: Map<string, string[]>;
}

export function Macroeditor({ initialChanges }: IProps): JSX.Element {
  const [changes, setChanges] = useState(initialChanges);
  const clearChanges = () => setChanges(new Map<string, string[]>());
  return (
    <div className="container mx-auto">
      <div className="clear-changes-button">
        <ChangesListClearer clearChanges={clearChanges} />
      </div>
      <ChangesViewerContainer changes={changes} />
    </div>
  );
}
