import { useState } from 'react';
import { generateText } from 'ai';
import { useEchoModelProviders } from '@merit-systems/echo-react-sdk';

export default function AIComponent() { 
    const [result, setResult] = useState("");
    const { openai } = useEchoModelProviders();

    const handleGen = async () => {
        const { text } = await generateText({
            model: await openai('gpt-5-nano'),
            messages: [
                { role: 'user', content: 'Two sentences. What is the cleanest way to make $1M?' }
            ]
        });
        setResult(text);
    };  


    return (
        <div>
            <button onClick={handleGen}>Generate Wisdom</button>
            <p>{result}</p>
        </div>

    );
}