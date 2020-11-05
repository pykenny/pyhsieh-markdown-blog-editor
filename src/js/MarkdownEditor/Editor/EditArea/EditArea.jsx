import React from 'react';
import PropTypes from 'prop-types';

import TitleInput from './TitleInput';
import DocTextarea from './DocTextarea';

function EditArea(props) {
  const { onTitleEditChange, onDocumentEditChange } = props;

  return (
    <>
      <TitleInput onEditChange={onTitleEditChange} />
      <DocTextarea onEditChange={onDocumentEditChange} />
    </>
  );
}

EditArea.propTypes = {
  onTitleEditChange: PropTypes.func.isRequired,
  onDocumentEditChange: PropTypes.func.isRequired,
};

export default EditArea;
