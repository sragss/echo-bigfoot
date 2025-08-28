import { EchoSignIn, useEcho, EchoTokenPurchase } from '@merit-systems/echo-react-sdk';
import { useEffect } from 'react';
import AIComponent from './AIComponent';

function App() {
    const { isAuthenticated, user, signOut } = useEcho();

    // Fix iOS Safari viewport height issues
    useEffect(() => {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);

        return () => {
            window.removeEventListener('resize', setVH);
            window.removeEventListener('orientationchange', setVH);
        };
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-black px-5 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-lg">
                            Banana Editor
                        </h1>
                        <p className="text-sm">
                            Edit your images with AI-powered tools
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        <EchoTokenPurchase />
                        {user && (
                            <button
                                onClick={signOut}
                                className="border border-black px-2 py-1 text-sm cursor-pointer bg-white rounded-md"
                            >
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <div className="text-6xl mb-5">🔒</div>
                        <h2 className="mb-2 text-lg">Authentication Required</h2>
                        <p className="mb-4">
                            Please sign in to start editing your images with AI
                        </p>
                        {!user && <EchoSignIn />}
                    </div>
                ) : (
                    <AIComponent />
                )}
            </main>
        </div>
    );
}

export default App
