import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import Editor from './pages/Editor';
import Authentcation from './pages/Auth/index';
import EmailVerificationPage from './pages/Auth/EmailVerification';
import PasswordResetPage from './pages/Auth/NewPassword';
import { GoogleOAuthProvider } from "@react-oauth/google";
import config from "./config/env.config.ts";
import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to='/editor' />} />
                    <Route path='/projects'></Route>
                    <Route path="/projects/:slug" element={<Editor />} />
                    <Route path="/editor" element={<Editor />} />
                    <Route path="/auth" element={<Authentcation />} />
                    <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
                    <Route path="/auth/reset-password" element={<PasswordResetPage />} />
                </Routes>
                <Toaster />
            </Router>
        </GoogleOAuthProvider>
    );
}

export default App;
