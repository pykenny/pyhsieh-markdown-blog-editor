import React from 'react';
import PropTypes from 'prop-types';

function PreviewArea(props) {
  const { htmlStr } = props;
  const innerHTMLContext = { __html: htmlStr };

  return (
    <div
      className="edit-area-output"
      dangerouslySetInnerHTML={innerHTMLContext}
    />
  );
}

PreviewArea.propTypes = {
  htmlStr: PropTypes.string.isRequired,
};

export default PreviewArea;
