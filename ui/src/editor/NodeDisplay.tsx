import {XmlNode} from './xmlModel';
import {EditTriggerFunc, XmlNodeDisplayConfigObject} from './xmlDisplayConfigs';
import {tlhNodeDisplayConfig} from './tlhNodeDisplayConfig';
import classNames from 'classnames';
import React from 'react';

interface NodeDisplayIProps {
  node: XmlNode;
  displayConfig?: XmlNodeDisplayConfigObject;
  currentSelectedPath: number[] | undefined;
  onEdit: EditTriggerFunc;
  path: number[];
}

export function DisplayNode({node, currentSelectedPath, displayConfig = tlhNodeDisplayConfig, onEdit, path}: NodeDisplayIProps): JSX.Element {
  if (node.__type === 'XmlTextNode') {
    return <span>{node.textContent}</span>;
  }

  const currentConfig = displayConfig[node.tagName];

  const renderedChildren = <>
    {node.children.map((c, i) =>
      <DisplayNode key={i} node={c} displayConfig={displayConfig} currentSelectedPath={currentSelectedPath} onEdit={onEdit} path={[...path, i]}/>
    )}
  </>;

  const display = currentConfig?.replace
    ? currentConfig.replace(node, renderedChildren)
    : renderedChildren;

  const classes = currentConfig?.styling ? currentConfig.styling(node, path, currentSelectedPath) : [];

  const onClick = currentConfig?.edit
    ? () => onEdit(node, path)
    : () => {
    };

  return <span className={classNames(classes)} onClick={onClick}>{display}</span>;
}