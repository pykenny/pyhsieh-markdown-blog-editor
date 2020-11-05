import LOCAL_API_ROUTES from './constants';
import bundlePost from './bundlePost';

const APIS = {
  LOCAL_API_ROUTES,
  ...LOCAL_API_ROUTES,
  bundlePost,
};

export default APIS;
