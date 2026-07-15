import { useState, type FormEvent } from 'react';
import logo from '../assets/logo-wide-white.png';
import { verifyPassword } from '../lib/dataFiles';

interface Props {
  onUnlock: (password: string) => void;
}

export function LoginGate({ onUnlock }: Props) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || checking) return;
    setChecking(true);
    setError(false);
    const ok = await verifyPassword(password);
    if (ok) {
      onUnlock(password);
    } else {
      setError(true);
      setChecking(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#003143', color: '#fff', padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 30 }}>
        <img src={logo} alt="ZeroNorth" style={{ height: 30, width: 'auto' }} />
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.01em', marginTop: 10 }}>Fleet performance monitoring : CMA CGM</div>
        <div style={{ fontSize: 12.5, color: '#a8d7c5' }}>This dashboard is restricted. Enter the access password to continue.</div>
      </div>
      <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type={show ? 'text' : 'password'}
            autoFocus
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Access password"
            style={{
              width: '100%', padding: '12px 52px 12px 14px', border: '1px solid ' + (error ? '#f06a2d' : 'rgba(255,255,255,.3)'),
              borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#003143', background: '#fff', outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              border: 'none', background: 'transparent', color: '#156e80', fontSize: 12, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer', padding: '6px 8px', borderRadius: 6,
            }}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        {error ? <div style={{ fontSize: 12.5, color: '#ffb59a' }}>Incorrect password. Please try again.</div> : null}
        <button
          type="submit"
          disabled={checking || !password}
          style={{
            width: '100%', padding: '12px 14px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            fontFamily: 'inherit', cursor: checking || !password ? 'default' : 'pointer',
            background: checking || !password ? 'rgba(80,177,140,.4)' : '#50b18c', color: '#fff',
          }}
        >
          {checking ? 'Unlocking…' : 'Unlock dashboard'}
        </button>
      </form>
      <div style={{ fontSize: 11, color: '#5d7780', marginTop: 28, textAlign: 'center', maxWidth: 340 }}>
        Access is limited to approved users. Contact your administrator if you need the password.
      </div>
    </div>
  );
}
