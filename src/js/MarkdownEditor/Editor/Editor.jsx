import React from 'react';
import PropTypes from 'prop-types';
import marked from 'marked';
import DOMPurify from 'dompurify';

import LogArea from './LogArea';
import EditArea from './EditArea';
import PreviewArea from './PreviewArea';

function markdown2HTML(markdownStr) {
  return DOMPurify.sanitize(marked(markdownStr));
}

function Editor(props) {
  const { onEditChange, logRecords, markdownStr } = props;
  const htmlStr = markdownStr ? markdown2HTML(markdownStr) : '';

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
