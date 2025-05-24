class AuthStore {
    static setTokens(accessToken: string, refreshToken: string) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    static getTokens() {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        return { accessToken, refreshToken };
    }

    static removeTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
}

export default AuthStore;
