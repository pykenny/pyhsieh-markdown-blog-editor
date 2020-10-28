import React from 'react';
import strftime from 'strftime';

import Banner from './Banner';
import Editor from './Editor';
import Constants from './Constants';

class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props);
    this.bundleDocument = this.bundleDocument.bind(this);
    this.onEditChange = this.onEditChange.bind(this);
    this.onLogUpdate = this.onLogUpdate.bind(this);
    this.state = {
      documentText: '',
      logHistory: [],
    };
  }

  onEditChange(documentText) {
    this.setState(() => ({ documentText }));
  }

  onLogUpdate(message, msgType) {
    const timestampStr = strftime('%Y-%m-%d %H:%M:%S');
    this.setState((state) => ({
      logHistory: [{ timestampStr, msgType, message }, ...state.logHistory],
    }));
  }

  bundleDocument() {
    const { documentText } = this.state;
    console.log(documentText);
    this.onLogUpdate(
      Constants.BundleCompleteMessage, Constants.EditorMessageType.NORMAL,
    );
  }

  render() {
    const { documentText, logHistory } = this.state;
    return (
      <>
        <Banner
          optionBundleEnabled
          optionBundleOnClick={this.bundleDocument}
        />
        <Editor
          onEditChange={this.onEditChange}
          logRecords={logHistory}
          markdownStr={documentText}
        />
      </>
    );
  }
}

export default MarkdownEditor;
