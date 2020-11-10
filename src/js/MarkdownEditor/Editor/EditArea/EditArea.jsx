import React from 'react';
import PropTypes from 'prop-types';

import TitleInput from './TitleInput';
import TagsInput from './TagsInput';
import DocTextarea from './DocTextarea';

function EditArea(props) {
  const {
    onTitleEditChange,
    onTagsEditChange,
    onDocumentEditChange,
  } = props;

  return (
    <>
      <TitleInput onEditChange={onTitleEditChange} />
      <TagsInput onEditChange={onTagsEditChange} />
      <DocTextarea onEditChange={onDocumentEditChange} />
    </>
  );
}

EditArea.propTypes = {
  onTitleEditChange: PropTypes.func.isRequired,
  onTagsEditChange: PropTypes.func.isRequired,
  onDocumentEditChange: PropTypes.func.isRequired,
};

export default EditArea;
