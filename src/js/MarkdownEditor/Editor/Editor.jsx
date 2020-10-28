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

  /* TODOs:
   * There are several issues here for doing direct parsing here:
   *  1. Deal with invalid image. The app should make request to ask about
   *     file availability first before inserting HTML. Otherwise let the
   *     preview area provide error information ("File <...> not available in
   *     image content directory...")
   *  2. We want to customize code block that supports language syntax
   *     highlighting, which require external library support.
   *  3. We want to prevent the editor from requesting local server too
   *     often even if it's not really using user's network resource. Make
   *     some delay between edit and parsing can help (for instance, update
   *     only when the user stop modifying the edit area for 3 secoonds), but
   *     we want some better control on reducing image requests to the server.
   *
   * Optional / Future Works:
   *  1. Modify parser's syntax to support processing img parts like:
   *     ![ALT_TEXT](URL_LINK|ALIAS)
   *  2. Process alias (we can do this later)
   *  3. Local caching for images. If repetitive URLs are found, then use the
   *     cached image, instead of making server request. This also means we
   *     need to manage the cache as internal state, and manipulate the HTML
   *     content in preview area (for instance, cache the images in base64,
   *     then set up the image block with 'src' attribute).
   */
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
