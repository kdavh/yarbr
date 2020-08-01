import {createMemoryHistory} from 'history';

export const createBrowserHistory = () => createMemoryHistory({initialEntries: ['/']});
