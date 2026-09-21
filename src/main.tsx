import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './router/router.ts';

async function enableMocking() {
  const { worker } = await import('./mocks/todolists-feature/browser.ts');

  return await worker.start({
    serviceWorker: {
      url: import.meta.env.VITE_MSW_FILE_PATH,
      options: {
        scope: import.meta.env.VITE_PROJECT_BASE,
      },
    },
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <RouterProvider router={router} />,
  );
});
