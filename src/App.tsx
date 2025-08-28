import { EchoSignIn, useEcho } from '@merit-systems/echo-react-sdk';
import AIComponent from './AIComponent';

function App() {

const { isAuthenticated, user, balance, signOut } = useEcho();

return (
    <>
        <header>
            <EchoSignIn />

        {!isAuthenticated && "Sign in to continue"}
        {isAuthenticated && (
            <div>
                <p>Welcome, {user?.name}!</p>
                <p>Email: {user?.email}</p>
                <p>Balance: {balance?.balance}</p>
                <button onClick={signOut}>Sign Out</button>
            </div>
        )}
        </header>
        <main>
            {isAuthenticated && <AIComponent />}
        </main>
    </>
);
}

export default App
