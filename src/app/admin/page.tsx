'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface DemoBooking {
  bookingId: string;
  studentId: string;
  name: string;
  email: string;
  mobile: string;
  interestedCourse: string;
  preferredDate: string;
  preferredTimeSlot: string;
  counsellingMode: string;
  status: string;
  counsellor?: string;
  notes?: string;
}

interface Counsellor {
  counsellorId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  active: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [demos, setDemos] = useState<DemoBooking[]>([]);
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<DemoBooking | null>(null);
  const [selectedCounsellor, setSelectedCounsellor] = useState<string>('');
  const [counsellingDate, setCounsellingDate] = useState<string>('');
  const [counsellingTime, setCounsellingTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // Load demo bookings and counsellors
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [dashRes, counselRes] = await Promise.all([
        fetch('/api/admin', { cache: 'no-store' }),
        fetch('/api/admin?resource=counsellors', { cache: 'no-store' }),
      ]);

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData.data?.demoBookings) {
          setDemos(dashData.data.demoBookings);
        }
      }

      if (counselRes.ok) {
        const counselData = await counselRes.json();
        if (counselData.data) {
          setCounsellors(counselData.data);
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
    }
  }

  async function handleAssignCounsellor() {
    if (!selectedDemo || !selectedCounsellor) {
      setMessageType('error');
      setMessage('Please select both a demo booking and a counsellor.');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_counsellor',
          bookingId: selectedDemo.bookingId,
          counsellorId: selectedCounsellor,
          counsellingDate,
          counsellingTime,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setMessageType('success');
        setMessage('Counsellor assigned successfully! Student has been notified.');
        setSelectedDemo(null);
        setSelectedCounsellor('');
        setCounsellingDate('');
        setCounsellingTime('');
        await loadData();
      } else {
        setMessageType('error');
        setMessage(result.message || 'Failed to assign counsellor.');
      }
    } catch (error) {
      console.error('Assign error:', error);
      setMessageType('error');
      setMessage('Error assigning counsellor. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    router.push('/login');
  }

  const pendingDemos = demos.filter(d => d.status === 'REQUEST RECEIVED' || d.status === 'REQUESTED');

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
            value={String(demos.length)}
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

        {/* Counsellor Assignment Panel */}
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
            Counsellor Assignment
          </h2>

          {message && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                backgroundColor:
                  messageType === 'success'
                    ? '#d1fae5'
                    : '#fee2e2',
                color:
                  messageType === 'success'
                    ? '#065f46'
                    : '#991b1b',
                border:
                  messageType === 'success'
                    ? '1px solid #6ee7b7'
                    : '1px solid #fecaca',
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            {/* Demo Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: '14px',
                }}
              >
                Select Demo Booking
              </label>
              <select
                value={selectedDemo?.bookingId || ''}
                onChange={(e) => {
                  const demo = demos.find(
                    (d) => d.bookingId === e.target.value
                  );
                  setSelectedDemo(demo || null);
                  setCounsellingDate(
                    demo?.preferredDate || ''
                  );
                  setCounsellingTime(
                    demo?.preferredTimeSlot || ''
                  );
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="">
                  {pendingDemos.length > 0
                    ? `Select from ${pendingDemos.length} pending booking(s)`
                    : 'No pending bookings'}
                </option>
                {pendingDemos.map((demo) => (
                  <option
                    key={demo.bookingId}
                    value={demo.bookingId}
                  >
                    {demo.name} - {demo.bookingId}
                  </option>
                ))}
              </select>
            </div>

            {/* Counsellor Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: '14px',
                }}
              >
                Select Counsellor
              </label>
              <select
                value={selectedCounsellor}
                onChange={(e) =>
                  setSelectedCounsellor(e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="">
                  {counsellors.length > 0
                    ? `Select from ${counsellors.length} counsellor(s)`
                    : 'No counsellors available'}
                </option>
                {counsellors.map((c) => (
                  <option key={c.counsellorId} value={c.counsellorId}>
                    {c.name} - {c.specialization}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: '14px',
                }}
              >
                Counselling Date
              </label>
              <input
                type="date"
                value={counsellingDate}
                onChange={(e) =>
                  setCounsellingDate(e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Time Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: '14px',
                }}
              >
                Counselling Time
              </label>
              <input
                type="time"
                value={counsellingTime}
                onChange={(e) =>
                  setCounsellingTime(e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Assignment Button */}
          <button
            onClick={handleAssignCounsellor}
            disabled={loading}
            style={{
              background: '#087bd1',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading
              ? 'Assigning...'
              : 'Assign Counsellor & Notify Student'}
          </button>

          {/* Selected Demo Info */}
          {selectedDemo && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  color: '#0f172a',
                  fontSize: '16px',
                }}
              >
                Selected Demo Details
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  fontSize: '14px',
                  color: '#475569',
                }}
              >
                <div>
                  <strong>Student:</strong>{' '}
                  {selectedDemo.name}
                </div>
                <div>
                  <strong>Email:</strong>{' '}
                  {selectedDemo.email}
                </div>
                <div>
                  <strong>Phone:</strong>{' '}
                  {selectedDemo.mobile}
                </div>
                <div>
                  <strong>Course:</strong>{' '}
                  {selectedDemo.interestedCourse}
                </div>
                <div>
                  <strong>Mode:</strong>{' '}
                  {selectedDemo.counsellingMode}
                </div>
                <div>
                  <strong>Current Status:</strong>{' '}
                  <span
                    style={{
                      padding: '4px 8px',
                      background: '#fef3c7',
                      color: '#92400e',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {selectedDemo.status}
                  </span>
                </div>
              </div>
            </div>
          )}
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
} as const;