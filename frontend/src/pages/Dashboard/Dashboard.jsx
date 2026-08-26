import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import StatusBadge from '../../components/StatusBadge/StatusBadge';

function Dashboard() {
  return (
    <section>
      <h1>Dashboard</h1>

      <p>Your rehabilitation overview will appear here.</p>

      <Card>
        <h2>System Status</h2>

        <StatusBadge status="success">
          Backend connected
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