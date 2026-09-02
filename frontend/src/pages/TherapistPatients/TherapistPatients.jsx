import { useEffect, useState } from 'react';

import api from '../../services/api';

function TherapistPatients() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPatients() {
      try {
        const response = await api.get('/patients');

        if (!isMounted) {
          return;
        }

        setPatients(response.data.patients || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        const message =
          requestError.response?.data?.error ||
          'Unable to load patients.';

        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPatients();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section>
        <h1>Patients</h1>
        <p>Loading patients...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>Patients</h1>
        <p role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Patients</h1>

      <p>
        Patients available for rehabilitation
        management.
      </p>

      {patients.length === 0 ? (
        <div>
          <h2>No patients found</h2>
          <p>
            There are currently no registered
            patients.
          </p>
        </div>
      ) : (
        <div>
          {patients.map((patient) => (
            <article key={patient.id}>
              <h2>{patient.name}</h2>

              <p>
                Email: {patient.email}
              </p>

              <p>
                Patient ID: {patient.id}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TherapistPatients;