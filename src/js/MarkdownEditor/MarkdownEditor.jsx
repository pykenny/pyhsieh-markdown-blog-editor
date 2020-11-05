import React from 'react';
import strftime from 'strftime';

import Banner from './Banner';
import Editor from './Editor';
import Constants from './Constants';
import parseDocument, { createDocumentParser } from '../helpers/parser';
import APIS from '../apis';

const PARSE_DELAY = 1000;

class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props);
    this.parser = createDocumentParser();
    this.bundleDocument = this.bundleDocument.bind(this);
    this.onTitleEditChange = this.onTitleEditChange.bind(this);
    this.onDocumentEditChange = this.onDocumentEditChange.bind(this);
    this.onLogUpdate = this.onLogUpdate.bind(this);
    this.state = {
      documentTitle: '',
      previewHTMLStr: '',
      parseError: undefined,
      // Parsed information. You can only save data when it's available.
      // Format: {
      //   rawDocument: (string) Raw Markdown text
      //   aliasMapping: (object) Mapping from img alias to local file path
      // }
      packedData: undefined,
      // Log history stack
      logHistory: [],
      // Timer ID for delayed preview update
      pendingUpdateTimerId: undefined,
    };
  }

  onTitleEditChange(documentTitle) {
    this.setState(() => ({ documentTitle }));
  }

  onDocumentEditChange(documentText) {
    const { pendingUpdateTimerId } = this.state;
    if (pendingUpdateTimerId !== undefined) {
      clearTimeout(pendingUpdateTimerId);
    }
    const timerId = setTimeout(
      () => {
        const {
          pass,
          parsedHTML,
          aliasMapping,
          errors,
        } = parseDocument(documentText, this.parser);
        const newState = {
          previewHTMLStr: '',
          parseError: undefined,
          packedData: undefined,
          pendingUpdateTimerId: undefined,
        };
        if (pass) {
          newState.previewHTMLStr = parsedHTML;
          newState.packedData = { rawDocument: documentText, aliasMapping };
        } else {
          newState.parseError = errors;
        }
        this.setState(() => newState);
      },
      PARSE_DELAY,
    );
    this.setState(() => ({ pendingUpdateTimerId: timerId }));
  }

  onLogUpdate(message, msgType) {
    const timestampStr = strftime('%Y-%m-%d %H:%M:%S');
    this.setState((state) => ({
      logHistory: [{ timestampStr, msgType, message }, ...state.logHistory],
    }));
  }

  bundleDocument() {
    const { documentTitle, packedData } = this.state;

    if (packedData !== undefined) {
      const { rawDocument, aliasMapping } = packedData;
      const documentMeta = { documentTitle, aliasMapping };
      return APIS.bundlePost(rawDocument, documentMeta)
        .then((response) => {
          const { timeStamp, outputDir } = response;
          const completeMessage = (
            `Created bundle at "${outputDir}". Timestamp: ${timeStamp}.`
          );
          this.onLogUpdate(
            completeMessage, Constants.EditorMessageType.NORMAL,
          );
        })
        .catch((error) => {
          // TODO: Error handling.
          if (error.response) {
            console.log('Normal non-2xx response.');
          } else if (error.request) {
            console.log('No-response error.');
          } else {
            console.log('Error before transmission.');
          }
          this.onLogUpdate(
            'Ooops', Constants.EditorMessageType.ERROR,
          );
        });
    }

    return undefined;
  }

  render() {
    const {
      documentText,
      logHistory,
      pendingUpdateTimerId,
      parseError,
      packedData,
      previewHTMLStr,
    } = this.state;
    return (
      <>
        <Banner
          optionBundleEnabled={
            (pendingUpdateTimerId === undefined)
            && (parseError === undefined)
            && (packedData !== undefined)
          }
          optionBundleOnClick={this.bundleDocument}
        />
        <Editor
          onTitleEditChange={this.onTitleEditChange}
          onDocumentEditChange={this.onDocumentEditChange}
          logRecords={logHistory}
          markdownStr={documentText}
          parseError={parseError}
          previewHTMLStr={previewHTMLStr}
        />
      </>
    );
  }
}

export default MarkdownEditor;
