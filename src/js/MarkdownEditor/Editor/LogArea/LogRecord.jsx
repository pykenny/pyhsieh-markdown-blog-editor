import React from 'react';
import PropTypes from 'prop-types';

import Constants from '../../Constants';

function LogRecord(props) {
  const { timestampStr, msgType, message } = props;

  const msgTypeClass = (msgType === Constants.EditorMessageType.WARNING)
    ? 'alert'
    : 'normal';

  return (
    <div
      className={`log-row ${msgTypeClass}`}
    >
      {`[${timestampStr}] ${message}`}
    </div>
  );
}

LogRecord.propTypes = {
  timestampStr: PropTypes.string.isRequired,
  msgType: PropTypes.number.isRequired,
  message: PropTypes.string.isRequired,
};

export default LogRecord;
