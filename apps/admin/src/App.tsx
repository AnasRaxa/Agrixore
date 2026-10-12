import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ApiError } from './api';
import { Layout } from './components/Layout';
import { Button, Notice, Spinner } from './components/ui';
import { DashboardPage } from './pages/Dashboard';
import { LoginPage } from './pages/Login';
import { PricesPage } from './pages/Prices';
import { ME_KEY, useSession } from './session';

// If any request says the session ended (401), go back to the sign-in screen.
function onAuthLost(error: unknown) {
  if (error instanceof ApiError && error.status === 401) client.setQueryData(ME_KEY, null);
}

const client: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onAuthLost }),
  mutationCache: new MutationCache({ onError: onAuthLost }),
  defaultOptions: {
    queries: { retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2 },
  },
});

function Gate() {
  const session = useSession();
  if (session.isPending) return <Spinner />;
  if (session.isError) {
    return (
      <main className="mx-auto max-w-md space-y-3 p-6">
        <Notice tone="error" live>Could not reach the server. Check your connection and try again.</Notice>
        <Button onClick={() => void session.refetch()}>Try again</Button>
      </main>
    );
  }
  if (!session.data) return <LoginPage />;
  return (
    <Layout admin={session.data}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export function App() {
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter basename="/admin">
        <Gate />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
