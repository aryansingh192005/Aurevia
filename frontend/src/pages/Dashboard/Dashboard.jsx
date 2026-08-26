import { useEffect, useState } from 'react';

import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { getHealth } from '../../services/api';

function Dashboard() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;

    async function checkBackend() {
      try {
        const data = await getHealth();

        if (!isMounted) {
          return;
        }

        if (data.status === 'ok') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('offline');
        }
      } catch {
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

  const statusConfig = {
    checking: {
      status: 'neutral',
      label: 'Checking backend...',
    },
    connected: {
      status: 'success',
      label: 'Backend connected',
    },
    offline: {
      status: 'danger',
      label: 'Backend offline',
    },
  };

  const currentStatus = statusConfig[backendStatus];

  return (
    <section>
      <h1>Dashboard</h1>

      <p>
        Your rehabilitation overview will appear here.
      </p>

      <Card>
        <h2>System Status</h2>

        <StatusBadge status={currentStatus.status}>
          {currentStatus.label}
        </StatusBadge>

        <div style={{ marginTop: '16px' }}>
          <Button>
            Start Rehabilitation Session
          </Button>
        </div>
      </Card>
    </section>
  );
}

export default Dashboard;