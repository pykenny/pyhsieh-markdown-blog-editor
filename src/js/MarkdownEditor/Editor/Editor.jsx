import React from 'react';
import PropTypes from 'prop-types';
import {
  reduce, isEmpty, forEach, isArray,
} from 'lodash';

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
              // Array means this link is shared by more than one alias.
              // A 'true' value means this URI has no corresponding alias.
              tempStr += isArray(errData)
                ? `<p>Err-<strong>${key}</strong>: Image link "${linkURI}" is linked with more than one alias.</p>`
                : `<p>Err-<strong>${key}</strong>: Image link "${linkURI}" is orphaned. Please assign alias to at least one of the occurences.</p>`;
            },
          );
          return result + tempStr;
        }
        if (key === 'imageAlias') {
          let tempStr = '';
          forEach(
            errValue,
            (_, aliasName) => {
              // Alias shared by more than one link is the only case here.
              tempStr += `<p>Err-${key}: Alias "${aliasName}" is linked with more than one image link.</p>`;
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

function Editor(props) {
  const {
    onTitleEditChange,
    onDocumentEditChange,
    logRecords,
    parseError,
    previewHTMLStr,
  } = props;

  const htmlStr = (parseError === undefined)
    ? previewHTMLStr
    : createErrorMessage(parseError);
  const passed = (parseError === undefined);

  return (
    <div className="editor-interface-container">
      <div className="grid-row">
        <div className="editor-interface-block  grid-column-half editor-input-container">
          <div className="area-title">Editor</div>
          <EditArea {...{ onTitleEditChange, onDocumentEditChange }} />
          <div className="area-title">Log</div>
          <LogArea {...{ logRecords }} />
        </div>
        <div className="editor-interface-block grid-column-half editor-output-container">
          <div className="area-title">Parsed Result</div>
          <PreviewArea {...{ htmlStr, passed }} />
        </div>
      </div>
    </div>
  );
}

Editor.propTypes = {
  onTitleEditChange: PropTypes.func.isRequired,
  onDocumentEditChange: PropTypes.func.isRequired,
  logRecords: PropTypes.arrayOf(
    PropTypes.shape({
      timestampStr: PropTypes.string.isRequired,
      msgType: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
    }),
  ).isRequired,
  parseError: PropTypes.instanceOf(Object),
  previewHTMLStr: PropTypes.string.isRequired,
};

Editor.defaultProps = {
  parseError: undefined,
};

export default Editor;
