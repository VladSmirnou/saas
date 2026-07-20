import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

async function enableMocking() {
  const { worker } = await import('./mocks/browser');

  return await worker.start({
    serviceWorker: { url: import.meta.env.VITE_MSW_FILE_PATH },
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
