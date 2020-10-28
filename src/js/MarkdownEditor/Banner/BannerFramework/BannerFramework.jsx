import React from 'react';
import PropTypes from 'prop-types';

import OptionGroup from '../OptionGroup';

function Banner(props) {
  const {
    optionBundleEnabled,
    optionBundleOnClick,
  } = props;
  return (
    <div className="head-banner-container">
      <div className="head-banner">
        <div className="page-title">Blog Post Editor</div>
        <OptionGroup
          {...{
            optionBundleEnabled,
            optionBundleOnClick,
          }}
        />
      </div>
    </div>
  );
}

Banner.propTypes = {
  optionBundleEnabled: PropTypes.bool.isRequired,
  optionBundleOnClick: PropTypes.func.isRequired,
};

export default Banner;
