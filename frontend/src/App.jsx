import { useEffect, useState } from 'react';

import { getHealth } from './services/api';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;

    async function checkBackend() {
      try {
        const data = await getHealth();

        if (isMounted && data.status === 'ok') {
          setBackendStatus('connected');
        } else if (isMounted) {
          setBackendStatus('error');
        }
      } catch (error) {
        if (isMounted) {
          setBackendStatus('offline');
        }
      }
    }

    checkBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main>
      <h1>Aurevia</h1>

      <p>AI-Powered Rehabilitation Platform</p>

      <p>
        Backend:{' '}
        <strong>
          {backendStatus}
        </strong>
      </p>
    </main>
  );
}

export default App;