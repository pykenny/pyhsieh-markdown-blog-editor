import React from 'react';
import PropTypes from 'prop-types';

function TitleInput(props) {
  const { onEditChange } = props;

  return (
    <div className="edit-area-title">
      <span className="edit-area-title-tag">
        {'Title: '}
      </span>
      <input
        type="text"
        className="edit-area-title-input"
        placeholder="Edit article title here..."
        onChange={onEditChange}
      />
    </div>
  );
}

TitleInput.propTypes = {
  onEditChange: PropTypes.func.isRequired,
};

export default TitleInput;
