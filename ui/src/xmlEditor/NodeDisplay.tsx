import {
  isXmlCommentNode,
  isXmlTextNode,
  XmlElementNode,
  XmlNode,
} from 'simple_xml';
import { isValidElement, ReactElement } from 'react';
import {
  isXmlEditableNodeConfig,
  XmlEditorSingleNodeConfig,
} from './editorConfig';
import { NodePath } from './insertablePositions';
import { tlhXmlEditorConfig } from './tlhXmlEditorConfig';

export interface InsertionData {
  insertablePaths: string[];
  insertAsLastChildOf: string[];
  initiateInsert: (path: NodePath) => void;
}
export interface NodeDisplayIProps {
  rootNode?: XmlElementNode;
  node: XmlNode;
  currentSelectedPath?: NodePath;
  onSelect?: (node: XmlElementNode, path: NodePath) => void;
  path?: NodePath;
  insertionData?: InsertionData;
  isLeftSide: boolean;

  /** ↓ New props added for hover handling */
  hoveredPath?: NodePath | null;
  onHoverEnter?: (path: NodePath) => void;
  onHoverLeave?: () => void;
}

const InsertButton = ({
  initiate,
  show,
}: {
  initiate: () => void;
  show: boolean;
}): ReactElement => (
  <button
    type="button"
    onClick={initiate}
    className={`
      inline-flex
      items-center justify-center
      w-2 h-3
      ml-0.5
      rounded-full
      bg-red-500
      text-sm font-medium
      transition-opacity duration-25
    `}
  >+</button>
);


export function NodeDisplay({
  node,
  path = [],
  hoveredPath,
  onHoverEnter,
  onHoverLeave,
  ...inheritedProps
}: NodeDisplayIProps): ReactElement {

  if (isXmlCommentNode(node)) {
    return <></>;
  }
  if (isXmlTextNode(node)) {
    return <span>{node.textContent}</span>;
  }

  const {
    rootNode,
    currentSelectedPath,
    onSelect,
    insertionData,
    isLeftSide,
  } = inheritedProps;

  const currentConfig: XmlEditorSingleNodeConfig | undefined =
    tlhXmlEditorConfig.nodeConfigs[node.tagName];


  const renderChildren = () => (
    <>
      {node.children.map((c, i) => (
        <NodeDisplay
          key={i}
          node={c}
          path={[...path, i]}
          {...inheritedProps}
          hoveredPath={hoveredPath}
          onHoverEnter={onHoverEnter}
          onHoverLeave={onHoverLeave}
        />
      ))}
    </>
  );

  const isSelected =
    !!currentSelectedPath && path.join('.') === currentSelectedPath.join('.');

  const replacement = currentConfig?.replace
    ? currentConfig.replace({
      rootNode,
      node,
      path,
      renderChildren,
      isSelected,
      isLeftSide,
    })
    : { clickablePrior: renderChildren(), notClickable: undefined, posterior: undefined };

  const { clickablePrior, notClickable, posterior } = isValidElement(replacement)
    ? { clickablePrior: replacement, notClickable: undefined, posterior: undefined }
    : replacement;

  const onClick =
    currentConfig && isXmlEditableNodeConfig(currentConfig) && onSelect
      ? () => onSelect(node, path)
      : undefined;

  /* -----------------------------------------------------------------
       Hover handling – decide if *this* line is the hovered one
  ----------------------------------------------------------------- */
  const isHovered = hoveredPath?.join('.') === path.join('.');

  const handleMouseEnter = () => {
    onHoverEnter?.(path);
  };
  const handleMouseLeave = () => {
    onHoverLeave?.();
  };

  return (
    <div
      className="group/item inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/*  Insert‑button *before* the node content */}
      {insertionData && insertionData.insertablePaths.includes(path.join('.')) && (
        <InsertButton
          initiate={() => insertionData.initiateInsert(path)}
          show={isHovered}
        />
      )}

      {/*  The actual node content (clickable, etc.) */}
      <span onClick={onClick}>{clickablePrior}</span>

      {/*  If we are rendering the left‑side “extra” stuff */}
      {isLeftSide && notClickable}

      {/*  Insert‑button *as a child* of the node (last‑child case) */}
      {insertionData && insertionData.insertAsLastChildOf.includes(node.tagName) && (
        <InsertButton
          initiate={() =>
            insertionData.initiateInsert([...path, node.children.length])
          }
          show={isHovered}
        />
      )}

      {/*  Any posterior JSX the node config returned */}
      {posterior}
    </div>
  );
}