import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import Editor from './pages/Editor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Editor />} />
      </Routes>
    </Router>
  );
}

export default App;
