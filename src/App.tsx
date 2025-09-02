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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
            <header className="bg-gradient-to-r from-green-800 to-green-900 text-green-50 px-6 py-6 shadow-strong">
                <div className="flex justify-between items-center max-w-6xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
                            🦶 Bigfoot Detector
                        </h1>
                        <p className="text-green-200 mt-1 font-medium">
                            Discover the cryptid hiding in plain sight
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        <EchoTokenPurchase />
                        {user && (
                            <button
                                onClick={signOut}
                                className="border-2 border-green-600 px-4 py-2 cursor-pointer bg-green-700 hover:bg-green-600 text-green-100 rounded-lg transition-all hover:shadow-medium font-medium"
                            >
                                Exit Trail
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                        <div className="bg-white shadow-strong rounded-2xl p-12 max-w-md mx-auto">
                            <div className="text-8xl mb-6">🌲</div>
                            <h2 className="mb-4 text-2xl text-green-800 font-display font-bold">Enter the Forest</h2>
                            <p className="mb-6 text-green-700 leading-relaxed">
                                Sign in to begin your cryptid research expedition
                            </p>
                            {!user && <EchoSignIn />}
                        </div>
                    </div>
                ) : (
                    <AIComponent />
                )}
            </main>
        </div>
    );
}

export default App
