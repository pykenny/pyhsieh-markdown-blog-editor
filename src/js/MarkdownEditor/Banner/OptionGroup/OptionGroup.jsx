import React from 'react';
import PropTypes from 'prop-types';

import OptionChoice from './OptionChoice';
import Constants from '../../Constants';

function OptionGroup(props) {
  const {
    optionBundleEnabled,
    optionBundleOnClick,
  } = props;

  return (
    <div className="option-group">
      <OptionChoice
        enabled={optionBundleEnabled}
        title={Constants.EditorOptionBundleName}
        onClick={optionBundleOnClick}
      />
    </div>
  );
}

OptionGroup.propTypes = {
  optionBundleEnabled: PropTypes.bool.isRequired,
  optionBundleOnClick: PropTypes.func.isRequired,
};

export default OptionGroup;
