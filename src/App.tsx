import { EchoSignIn, useEcho } from '@merit-systems/echo-react-sdk';
import AIComponent from './AIComponent';

function App() {
    const { isAuthenticated, user, balance, signOut } = useEcho();

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-black px-5 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-lg">
                            Echo Image Editor
                        </h1>
                        <p className="text-sm">
                            Edit your images with AI-powered tools
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        {!isAuthenticated ? (
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-sm">Sign in to continue</span>
                                <EchoSignIn />
                            </div>
                        ) : (
                            <div className="flex items-center gap-5">
                                <div className="text-right">
                                    <p>
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="text-sm">
                                        {user?.email}
                                    </p>
                                    <p className="text-sm">
                                        Balance: ${balance?.balance || '0.00'}
                                    </p>
                                </div>
                                <button
                                    onClick={signOut}
                                    className="border border-black px-2 py-1 text-sm cursor-pointer bg-white"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <div className="text-6xl mb-5">🔒</div>
                        <h2 className="mb-2 text-lg">Authentication Required</h2>
                        <p>
                            Please sign in to start editing your images with AI
                        </p>
                    </div>
                ) : (
                    <AIComponent />
                )}
            </main>
        </div>
    );
}

export default App
