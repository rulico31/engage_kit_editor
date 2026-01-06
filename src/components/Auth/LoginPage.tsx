import { useAuthStore } from '../../stores/useAuthStore';

export function LoginPage() {
    const { signInWithGoogle, signInWithMicrosoft, isLoading } = useAuthStore();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '48px 40px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
            }}>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    color: '#1a202c',
                }}>
                    EngageKit Editor
                </h1>

                <p style={{
                    color: '#718096',
                    marginBottom: '32px',
                    fontSize: '16px',
                }}>
                    インタラクティブなコンテンツを作成しましょう
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Googleログインボタン */}
                    <button
                        onClick={signInWithGoogle}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1a202c',
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            transition: 'all 0.2s',
                            opacity: isLoading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.borderColor = '#cbd5e0';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4" />
                            <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853" />
                            <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC04" />
                            <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335" />
                        </svg>
                        {isLoading ? 'ログイン中...' : 'Googleでログイン'}
                    </button>

                    {/* Microsoftログインボタン */}
                    <button
                        onClick={signInWithMicrosoft}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'white',
                            background: '#0078d4',
                            border: '2px solid #0078d4',
                            borderRadius: '8px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            transition: 'all 0.2s',
                            opacity: isLoading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.background = '#005a9e';
                                e.currentTarget.style.borderColor = '#005a9e';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,120,212,0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#0078d4';
                            e.currentTarget.style.borderColor = '#0078d4';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect width="9" height="9" fill="white" />
                            <rect x="11" width="9" height="9" fill="white" />
                            <rect y="11" width="9" height="9" fill="white" />
                            <rect x="11" y="11" width="9" height="9" fill="white" />
                        </svg>
                        {isLoading ? 'ログイン中...' : 'Microsoftでログイン'}
                    </button>
                </div>

                <p style={{
                    marginTop: '24px',
                    fontSize: '14px',
                    color: '#a0aec0',
                }}>
                    ログインすることで、プロジェクトの作成・保存・公開が可能になります
                </p>
            </div>
        </div>
    );
}
