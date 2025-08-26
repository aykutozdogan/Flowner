
import React, { useState } from 'react';
import './App.css';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('approver@demo.local');
  const [password, setPassword] = useState('Approver123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': 'demo.local',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="app">
        <div className="container">
          <div className="card">
            <h1>📱 Flowner Portal</h1>
            <div className="user-info">
              <h2>Hoş geldiniz, {user.name}!</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>ID:</strong> {user.id}</p>
            </div>
            <div className="actions">
              <button 
                onClick={() => window.open('/portal/tasks', '_blank')}
                className="btn btn-primary"
              >
                Görevlerime Git
              </button>
              <button 
                onClick={() => {
                  setUser(null);
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('user');
                }}
                className="btn btn-secondary"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <div className="card">
          <h1>📱 Flowner Portal</h1>
          <p>Kullanıcı Portalı</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
          
          <div className="demo-users">
            <h3>Demo Kullanıcılar:</h3>
            <p><strong>Approver:</strong> approver@demo.local / Approver123!</p>
            <p><strong>User:</strong> user@demo.local / User123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
