'use client';

import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  function handleLogout() {
    router.push('/login');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
      }}
    >
      {/* Header */}
      <header
        style={{
          height: '70px',
          background: '#172033',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: 800,
          }}
        >
          EduPath AI
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <span
            style={{
              color: '#cbd5e1',
              fontSize: '14px',
            }}
          >
            Administrator
          </span>

          <button
            onClick={handleLogout}
            style={{
              border: '1px solid #475569',
              background: 'transparent',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard */}
      <section
        style={{
          padding: '40px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            marginBottom: '32px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            Admin Dashboard
          </h1>

          <p
            style={{
              marginTop: '8px',
              color: '#64748b',
              fontSize: '16px',
            }}
          >
            Welcome to the EduPath AI Administration
            Portal.
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          <DashboardCard
            title="Students"
            value="0"
            description="Registered students"
          />

          <DashboardCard
            title="Courses"
            value="0"
            description="Available courses"
          />

          <DashboardCard
            title="Mock Tests"
            value="0"
            description="Available mock tests"
          />

          <DashboardCard
            title="Bookings"
            value="0"
            description="Demo bookings"
          />
        </div>

        {/* Welcome panel */}
        <div
          style={{
            marginTop: '30px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '30px',
            border: '1px solid #e2e8f0',
            boxShadow:
              '0 8px 30px rgba(15,23,42,0.06)',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: '#0f172a',
            }}
          >
            Admin Control Center
          </h2>

          <p
            style={{
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            You have successfully logged into the
            EduPath AI administrator portal.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '24px',
            }}
          >
            <button
              style={actionButton}
            >
              Manage Students
            </button>

            <button
              style={actionButton}
            >
              Manage Courses
            </button>

            <button
              style={actionButton}
            >
              Manage Resources
            </button>

            <button
              style={actionButton}
            >
              View Reports
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow:
          '0 8px 25px rgba(15,23,42,0.05)',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#64748b',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        {title}
      </p>

      <div
        style={{
          marginTop: '10px',
          fontSize: '32px',
          fontWeight: 800,
          color: '#0f172a',
        }}
      >
        {value}
      </div>

      <p
        style={{
          marginTop: '6px',
          marginBottom: 0,
          color: '#94a3b8',
          fontSize: '13px',
        }}
      >
        {description}
      </p>
    </div>
  );
}

const actionButton = {
  border: 'none',
  background: '#087bd1',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700,
};