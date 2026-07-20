import { delay, http, HttpResponse, type AnyHandler } from 'msw';
import { todolists } from './collections';

export const handlers: AnyHandler[] = [
  http.get('/todolists', async () => {
    await delay(1000);
    const data = todolists.findMany();
    console.log('data:', data);
    return HttpResponse.json(data);
  }),
];
