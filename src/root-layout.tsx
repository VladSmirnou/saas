import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Header } from './components/header/header';

function RootLayout() {
  return (
    <div>
      <Suspense fallback={<p>loading...</p>}>
        <Header />
      </Suspense>
      <main>
        <Suspense fallback={<p>loading...</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export default RootLayout;
