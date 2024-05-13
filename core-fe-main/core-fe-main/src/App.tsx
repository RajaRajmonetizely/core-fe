import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import AppRoutes from './router/routes';

const App = () => {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
};

export default App;
