import React from 'react';
import strftime from 'strftime';
import { isEmpty } from 'lodash';

import Banner from './Banner';
import Editor from './Editor';
import Constants from './Constants';
import parseDocument, { createDocumentParser } from '../helpers/parser';
import APIS from '../apis';

const PARSE_DELAY = 1000;

function parseTagString(rawString) {
  // (1) Split by comma then trim. (2) Remove empty tags.
  return rawString.split(',').map((s) => s.trim()).filter((s) => s);
}

class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props);
    this.parser = createDocumentParser();
    this.bundleDocument = this.bundleDocument.bind(this);
    this.onTitleEditChange = this.onTitleEditChange.bind(this);
    this.onTagsEditChange = this.onTagsEditChange.bind(this);
    this.onDocumentEditChange = this.onDocumentEditChange.bind(this);
    this.onLogUpdate = this.onLogUpdate.bind(this);
    this.state = {
      documentTitle: '',
      documentTags: [],
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

  onTagsEditChange(rawEditString) {
    this.setState(() => ({ documentTags: parseTagString(rawEditString) }));
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
    const {
      documentTitle,
      documentTags,
      packedData,
      previewHTMLStr,
    } = this.state;

    if (packedData !== undefined) {
      const { rawDocument, aliasMapping } = packedData;
      const documentMeta = {
        documentTitle,
        documentTags,
        aliasMapping,
        version: Constants.Version,
      };

      return APIS.bundlePost(rawDocument, previewHTMLStr, documentMeta)
        .then((response) => {
          const { timeStamp, outputDir } = response.data;
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
          console.log(error);
          this.onLogUpdate(
            'Ooops', Constants.EditorMessageType.ERROR,
          );
        });
    }

    return undefined;
  }

  render() {
    const {
      documentTitle,
      documentTags,
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
            && (documentTitle !== '')
            && (!isEmpty(documentTags))
          }
          optionBundleOnClick={this.bundleDocument}
        />
        <Editor
          onTitleEditChange={this.onTitleEditChange}
          onTagsEditChange={this.onTagsEditChange}
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
