import React from 'react';
import PropTypes from 'prop-types';

import LogArea from './LogArea';

function Editor(props) {
  const { logRecords } = props;

  return (
    <div className="editor-interface-container">
      <div className="grid-row">
        <div className="editor-interface-block  grid-column-half editor-input-container">
          <div className="area-title">Editor</div>
          <textarea className="edit-area-input" placeholder="Try type in some Markdown..." />
          <div className="area-title">Log</div>
          <LogArea logRecords={logRecords} />
        </div>
        <div className="editor-interface-block grid-column-half editor-output-container">
          <div className="area-title">Parsed Result</div>
          <div className="edit-area-output" />
        </div>
      </div>
    </div>
  );
}

Editor.propTypes = {
  logRecords: PropTypes.arrayOf(
    PropTypes.shape({
      timestampStr: PropTypes.string.isRequired,
      msgType: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default Editor;
