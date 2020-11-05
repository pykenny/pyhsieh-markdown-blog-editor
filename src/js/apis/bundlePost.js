import axios from 'axios';

import { LOCAL_BUNDLE_API_ROUTE } from './constants';

async function bundlePost(rawDocument, documentMeta) {
  return axios.post(
    LOCAL_BUNDLE_API_ROUTE,
    {
      rawDocument,
      documentMeta,
    },
  );
}

export default bundlePost;
