import { createBrowserHistory } from 'history';

export const history = createBrowserHistory();

const navigationHistory = {
  history,
  push: (path: string, state?: any) => history.push(path, state),
  replace: (path: string, state?: any) => history.replace(path, state),
  goBack: () => history.back(),
};

export default navigationHistory;