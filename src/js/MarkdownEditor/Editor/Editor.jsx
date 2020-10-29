import React from 'react';
import PropTypes from 'prop-types';
import parseDocument, { createDocumentParser } from '../../helpers/parser';

import LogArea from './LogArea';
import EditArea from './EditArea';
import PreviewArea from './PreviewArea';

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.parser = createDocumentParser();
  }

  render() {
    const { onEditChange, logRecords, markdownStr } = this.props;
    const htmlStr = markdownStr ? parseDocument(markdownStr, this.parser) : '';

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
