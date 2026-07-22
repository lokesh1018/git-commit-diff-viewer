import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CommitPage from './pages/CommitPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/repositories/:owner/:repository/commit/:commitSHA"
          element={<CommitPage />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
