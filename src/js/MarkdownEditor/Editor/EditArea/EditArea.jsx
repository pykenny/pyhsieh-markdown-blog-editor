import React from 'react';
import PropTypes from 'prop-types';

function EditArea(props) {
  const { onEditChange } = props;

  return (
    <textarea
      className="edit-area-input"
      placeholder="Try type in some Markdown..."
      onChange={(evt) => { onEditChange(evt.target.value); }}
    />
  );
}

EditArea.propTypes = {
  onEditChange: PropTypes.func.isRequired,
};

export default EditArea;
