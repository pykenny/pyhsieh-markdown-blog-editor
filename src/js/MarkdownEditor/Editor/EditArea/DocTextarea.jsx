import React from 'react';
import PropTypes from 'prop-types';

function DocTextArea(props) {
  const { onEditChange } = props;

  return (
    <textarea
      className="edit-area-input"
      placeholder="Try type in some Markdown..."
      onChange={(evt) => { onEditChange(evt.target.value); }}
    />
  );
}

DocTextArea.propTypes = {
  onEditChange: PropTypes.func.isRequired,
};

export default DocTextArea;
