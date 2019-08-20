export default {
  getApi: () => {
    const { REACT_APP_API_ENDPOINT } = process.env;
    return REACT_APP_API_ENDPOINT || window.location.origin;
  },
};
