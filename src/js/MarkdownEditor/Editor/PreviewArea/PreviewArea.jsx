import React from 'react';
import PropTypes from 'prop-types';

function PreviewArea(props) {
  const { htmlStr, passed } = props;
  const innerHTMLContext = { __html: htmlStr };

  return (
    <div className="edit-area-output">
      <div
        className={'preview-content '.concat(passed ? 'passed' : 'error')}
        dangerouslySetInnerHTML={innerHTMLContext}
      />
    </div>
  );
}

PreviewArea.propTypes = {
  htmlStr: PropTypes.string.isRequired,
  passed: PropTypes.bool.isRequired,
};

export default PreviewArea;
