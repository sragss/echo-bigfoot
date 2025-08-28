import { EchoSignIn, useEcho } from '@merit-systems/echo-react-sdk';
import AIComponent from './AIComponent';

function App() {
    const { isAuthenticated, user, balance, signOut } = useEcho();

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 py-4 shadow-sm">
                <div className="w-full flex justify-between items-center px-5">
                    <div>
                        <h1 className="m-0 text-2xl font-semibold text-gray-800">
                            Echo Image Editor
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Edit your images with AI-powered tools
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        {!isAuthenticated ? (
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-sm text-gray-600">Sign in to continue</span>
                                <EchoSignIn />
                            </div>
                        ) : (
                            <div className="flex items-center gap-5">
                                <div className="text-right">
                                    <p className="mb-1 text-base font-medium text-gray-800">
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="mb-1 text-sm text-gray-600">
                                        {user?.email}
                                    </p>
                                    <p className="text-sm text-green-600 font-medium">
                                        Balance: ${balance?.balance || '0.00'}
                                    </p>
                                </div>
                                <button
                                    onClick={signOut}
                                    className="px-4 py-2 bg-red-600 text-white border-0 rounded-md text-sm cursor-pointer font-medium hover:bg-red-700 transition-colors"
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
                        <h2 className="text-gray-800 mb-2.5 text-2xl">Authentication Required</h2>
                        <p className="text-gray-600 text-lg">
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
