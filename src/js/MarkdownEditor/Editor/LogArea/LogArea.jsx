import React from 'react';
import PropTypes from 'prop-types';

import LogRecord from './LogRecord';

function LogArea(props) {
  const { logRecords } = props;

  const logElements = logRecords.map((data, index) => {
    const { timestampStr, msgType, message } = data;
    const uniqKey = `LogRecord-${index}`;
    return (
      <LogRecord
        key={uniqKey}
        {...{ timestampStr, msgType, message }}
      />
    );
  });
  return (
    <div className="edit-area-log">
      {logElements}
    </div>
  );
}

LogArea.propTypes = {
  logRecords: PropTypes.arrayOf(
    PropTypes.shape({
      timestampStr: PropTypes.string.isRequired,
      msgType: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default LogArea;
