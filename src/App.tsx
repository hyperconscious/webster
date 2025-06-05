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
import {GoogleOAuthProvider} from "@react-oauth/google";
import config from "./config/env.config.ts";
import {Toaster} from 'react-hot-toast';
import ProjectsPage from './pages/ProjectsPage.tsx';
import {useState} from 'react';
import type {Theme} from './types/index.ts';
import NotFound from './pages/NotFound.tsx';
import {Profile} from "./pages/Profile.tsx";
import {UserProvider} from "./context/UserContext.tsx";

function App() {
    const [theme, setTheme] = useState<Theme>('light');
    return (
        <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
            <UserProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Navigate to='/editor'/>}/>
                        <Route path='/projects' element={<ProjectsPage theme={theme} setTheme={setTheme}/>}/>
                        <Route path="/projects/:slug" element={<Editor theme={theme} setTheme={setTheme}/>}/>
                        <Route path="/editor" element={<Editor theme={theme} setTheme={setTheme}/>}/>
                        <Route path="/profile" element={<Profile/>}/>
                        <Route path="/auth" element={<Authentcation/>}/>
                        <Route path="/auth/verify-email" element={<EmailVerificationPage/>}/>
                        <Route path="/auth/reset-password" element={<PasswordResetPage/>}/>
                        <Route path="*" element={<NotFound theme={theme}/>}/>
                    </Routes>
                    <Toaster/>
                </Router>
            </UserProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
