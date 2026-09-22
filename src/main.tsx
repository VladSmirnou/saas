import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './router/router.ts';

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
);
