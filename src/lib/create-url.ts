import { API_BASE_URL } from '../constants/api/constants';

export const createUrl = (path: string) => {
  return `${API_BASE_URL}/${path}`;
};
