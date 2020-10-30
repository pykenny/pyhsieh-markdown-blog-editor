import React from 'react';
import PropTypes from 'prop-types';
import {
  reduce, isEmpty, forEach, isArray,
} from 'lodash';

import parseDocument, { createDocumentParser } from '../../helpers/parser';

import LogArea from './LogArea';
import EditArea from './EditArea';
import PreviewArea from './PreviewArea';

function createErrorMessage(errors) {
  // TODO: Need a better approach to generate these strings
  if (isEmpty(errors)) {
    return '<p>Unexpected error happened during the parsing process</p>';
  }
  return reduce(
    errors,
    (result, errValue, key) => {
      if (!isEmpty(errValue)) {
        if (key === 'imageLink') {
          let tempStr = '';
          forEach(
            errValue,
            (errData, linkURI) => {
              tempStr += isArray(errData)
                ? `<p>Err${key}: Image link "${linkURI}" is linked with more than one alias.</p>`
                : `<p>Err${key}: Image link "${linkURI}" is orphaned. Please assign alias to at least one of the occurences.</p>`;
            },
          );
          return result + tempStr;
        }
        if (key === 'imageAlias') {
          let tempStr = '';
          forEach(
            errValue,
            (_, aliasName) => {
              tempStr += `<p>Err${key}: Alias "${aliasName}" is linked with more than one image link.</p>`;
            },
          );
          return result + tempStr;
        }
      }
      return result;
    },
    '',
  );
}

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.parser = createDocumentParser();
  }

  render() {
    const { onEditChange, logRecords, markdownStr } = this.props;
    let htmlStr = '';

    if (markdownStr) {
      const parsedResult = parseDocument(markdownStr, this.parser);
      htmlStr = (parsedResult.pass)
        ? parsedResult.parsedHTML
        : createErrorMessage(parsedResult.errors);
    }

    return (
      <div className="editor-interface-container">
        <div className="grid-row">
          <div className="editor-interface-block  grid-column-half editor-input-container">
            <div className="area-title">Editor</div>
            <EditArea onEditChange={onEditChange} />
            <div className="area-title">Log</div>
            <LogArea logRecords={logRecords} />
          </div>
          <div className="editor-interface-block grid-column-half editor-output-container">
            <div className="area-title">Parsed Result</div>
            <PreviewArea htmlStr={htmlStr} />
          </div>
        </div>
      </div>
    );
  }
}

Editor.propTypes = {
  onEditChange: PropTypes.func.isRequired,
  logRecords: PropTypes.arrayOf(
    PropTypes.shape({
      timestampStr: PropTypes.string.isRequired,
      msgType: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
    }),
  ).isRequired,
  markdownStr: PropTypes.string.isRequired,
};

export default Editor;
