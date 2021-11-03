import React from 'react';
import {XmlEditableNodeIProps} from './xmlDisplayConfigs';
import {GenericAttributes} from './xmlModel/xmlModel';
import {LinebreakNodeAttributes} from './tlhEditorConfig';
import {useTranslation} from 'react-i18next';
import {Field, Form, Formik} from 'formik';

type IProps = XmlEditableNodeIProps<LinebreakNodeAttributes & GenericAttributes>;

export function LineBreakEditor({node, updateNode, deleteNode, path, jumpEditableNodes, setKeyHandlingEnabled}: IProps): JSX.Element {

  const {t} = useTranslation('common');

  function onSubmit(attributes: LinebreakNodeAttributes & GenericAttributes): void {
    updateNode({...node, attributes}, path);
  }

  return (
    <Formik initialValues={node.attributes} onSubmit={onSubmit}>
      <Form>

        <div className="field">
          <label htmlFor="txtid" className="label">{t('textId')}:</label>
          <div className="control">
            <Field type="text" name="txtid" id="txtid" className="input" readOnly/>
          </div>
        </div>

        <div className="field">
          <label htmlFor="lnr" className="label">{t('lineNumber')}:</label>
          <div className="control">
            <Field type="text" name="lnr" id="lnr" className="input" onFocus={() => setKeyHandlingEnabled(false)} onBlur={() => setKeyHandlingEnabled(true)}/>
          </div>
        </div>

        <div className="field">
          <label htmlFor="lg" className="label">{t('language')}</label>
          <div className="control">
            <Field type="text" name="lg" id="lg" className="input" onFocus={() => setKeyHandlingEnabled(false)} onBlur={() => setKeyHandlingEnabled(true)}/>
          </div>
        </div>

        <div className="columns">
          <div className="column">
            <button type="button" className="button is-danger is-fullwidth" onClick={deleteNode}>{t('delete')}</button>
          </div>
          <div className="column">
            <button type="submit" className="button is-link is-fullwidth">{t('update')}</button>
          </div>
        </div>

        <div className="columns">
          <div className="column">
            <button className="button is-fullwidth" onClick={() => jumpEditableNodes(node.tagName, false)}>{t('previousEditable')}</button>
          </div>
          <div className="column">
            <button className="button is-fullwidth" onClick={() => jumpEditableNodes(node.tagName, true)}>{t('nextEditable')}</button>
          </div>
        </div>

      </Form>
    </Formik>
  );
}