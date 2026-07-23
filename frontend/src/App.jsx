import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CommitPage from './pages/CommitPage';
import NotFound from './pages/NotFound';

/** Default home: example commit shown when opening `/`. */
const DEFAULT_COMMIT_PATH =
  '/repositories/golemfactory/clay/commit/a1bf367b3af680b1182cc52bb77ba095764a11f9';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={DEFAULT_COMMIT_PATH} replace />} />
        <Route
          path="/repositories/:owner/:repository/commit/:commitSHA"
          element={<CommitPage />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
