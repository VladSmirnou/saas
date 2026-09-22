import { http, HttpResponse, type AnyHandler } from 'msw';
import { createUrl } from '../../lib/create-url';

export const handlers: AnyHandler[] = [
  http.get(createUrl('user'), () => {
    return HttpResponse.json({
      user: {
        id: 1,
        username: 'bob',
        email: 'email',
        isEmailVerified: false,
      },
    });
  }),
  http.post(createUrl('sign-in'), () => {
    return new HttpResponse(null, { status: 200 });
  }),
  http.delete(createUrl('sign-out'), () => {
    return new HttpResponse(null, { status: 200 });
  }),
  http.post(createUrl('sign-up'), () => {
    return new HttpResponse(null, { status: 201 });
  }),
];
