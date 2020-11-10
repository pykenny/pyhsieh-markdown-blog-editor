import React from 'react';
import PropTypes from 'prop-types';

function TagsInput(props) {
  const { onEditChange } = props;

  return (
    <div className="edit-area-title">
      <span className="edit-area-title-tag">
        {'Tags: '}
      </span>
      <input
        type="text"
        className="edit-area-title-input"
        placeholder="Enter tags split by comma (tag1, tag2, tag3, ...)"
        onChange={(evt) => { onEditChange(evt.target.value); }}
      />
    </div>
  );
}

TagsInput.propTypes = {
  onEditChange: PropTypes.func.isRequired,
};

export default TagsInput;
