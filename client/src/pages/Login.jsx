import { useState } from 'react';

function Login() {
  const [username, setUsername] = useState('');

  return (
    <section>
      <h1>AssetFlow Login</h1>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
      <button>Login</button>
    </section>
  );
}

export default Login;
