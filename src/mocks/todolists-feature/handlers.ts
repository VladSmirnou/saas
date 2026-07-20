import { delay, http, HttpResponse, type AnyHandler } from 'msw';
import { todolists } from './collections';
import { API_BASE_URL } from '../../constants/api/constants';

export const handlers: AnyHandler[] = [
  http.get(`${API_BASE_URL}/todolists`, async () => {
    await delay(1000);
    return HttpResponse.json(todolists.findMany());
  }),
];
