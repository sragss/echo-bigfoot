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
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
            <header className="border-b border-green-800 bg-green-900 text-green-50 px-5 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            🦶 Bigfoot Detector
                        </h1>
                        <p className="text-sm text-green-200">
                            Discover the cryptid hiding in plain sight
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        <EchoTokenPurchase />
                        {user && (
                            <button
                                onClick={signOut}
                                className="border border-green-600 px-3 py-1 text-sm cursor-pointer bg-green-800 hover:bg-green-700 text-green-100 rounded-md transition-colors"
                            >
                                Exit Trail
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <div className="text-6xl mb-5">🌲</div>
                        <h2 className="mb-2 text-lg text-green-800 font-bold">Enter the Forest</h2>
                        <p className="mb-4 text-green-700">
                            Sign in to begin your cryptid research expedition
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
