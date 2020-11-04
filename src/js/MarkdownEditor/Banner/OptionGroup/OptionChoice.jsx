import React from 'react';
import PropTypes from 'prop-types';

class OptionChoice extends React.Component {
  constructor(props) {
    super(props);
    this.focusedCarriageReturnHandler = this.focusedCarriageReturnHandler.bind(this);
  }

  focusedCarriageReturnHandler(evt) {
    const { onClick } = this.props;
    if (evt.key === 'Enter') {
      onClick();
    }
  }

  render() {
    const { enabled, onClick, title } = this.props;
    return (
      <div
        className={`option-choice ${(!enabled) ? 'disabled' : ''}`}
        role="button"
        tabIndex={0}
        onClick={enabled && onClick}
        onKeyDown={enabled && this.focusedCarriageReturnHandler}
      >
        {title}
      </div>
    );
  }
}

OptionChoice.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default OptionChoice;
