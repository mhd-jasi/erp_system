import React, { useEffect, useState } from 'react';

function UserMana() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replace this with actual token retrieval logic (e.g., from localStorage)
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    fetch('http://localhost:5000/api/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          res.text().then(text => {
            setError(`Failed to fetch users: ${text}`);
            setLoading(false);
          });
          throw new Error('Failed to fetch users');
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!error) {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [token]);

  const handleRoleChange = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    fetch(`http://localhost:5000/api/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to update user role');
        }
        return res.json();
      })
      .then(() => {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h1>User Management</h1>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px', fontWeight: 'bold' }}>
          Error: {error}
        </div>
      )}
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px',backgroundColor:'var(--four)',color:'var(--white)' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px',backgroundColor:'var(--four)',color:'var(--white)' }}>Email</th>
            <th style={{ border: '1px solid #ddd', padding: '8px',backgroundColor:'var(--four)',color:'var(--white)' }}>Role</th>
            <th style={{ border: '1px solid #ddd', padding: '8px',backgroundColor:'var(--four)',color:'var(--white)' }}>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(({ id, username, email, role }) => (
            <tr key={id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{username}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{email}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{role}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={role === 'admin'}
                  onChange={() => handleRoleChange(id, role)}
                />{' '}
                Admin
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserMana;
