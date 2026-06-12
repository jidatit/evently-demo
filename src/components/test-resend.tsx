import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

const TestResendDomains = () => {
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDomains = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('list-resend-domains', {
                body: null,  // No body for GET
                method: 'GET'
            });
            if (error) {
                throw error;
            }
            setResult(JSON.stringify(data.verifiedDomains, null, 2));
        } catch (error) {
            setResult(`Error: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <div>
            <button onClick={fetchDomains} disabled={loading}>
                {loading ? 'Loading...' : 'Test Resend Domains'}
            </button>
            {result && <pre>{result}</pre>}
        </div>
    );
};

export default TestResendDomains;