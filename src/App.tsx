import { EchoSignIn, useEcho } from '@merit-systems/echo-react-sdk';
import { useEffect } from 'react';
import { Github } from 'lucide-react';
import AIComponent from './AIComponent';
import { EchoAccount } from './components/echo-account-next';

function App() {
    const { isAuthenticated, user } = useEcho();

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
        <div className="h-full bg-gradient-to-br from-green-50 via-green-100 to-green-200 flex flex-col overflow-hidden">
            <header className="bg-gradient-to-r from-green-800 to-green-900 text-green-50 px-4 py-4 shadow-strong flex-shrink-0">
                <div className="flex justify-between items-center max-w-6xl mx-auto">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-2">
                            🦶 Bigfooter
                        </h1>
                        <p className="text-green-200 mt-1 font-medium text-sm hidden sm:block">
                            Discover the cryptid hiding in plain sight
                        </p>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                        <a
                            href="https://github.com/sragss/echo-bigfoot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-200 hover:text-green-100 transition-colors"
                            title="View on GitHub"
                        >
                            <Github size={20} />
                        </a>
                        <EchoAccount />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden">
                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
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
