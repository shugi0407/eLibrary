// runs on every page
document.addEventListener('DOMContentLoaded', async () => {
  const loginBtn = document.querySelector('.login-btn');
  if (!loginBtn) return;

  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();

    if (data.authenticated) {
      // replace Sign-in with Sign-out
      loginBtn.textContent = 'Sign Out';
      loginBtn.href = '#';
      loginBtn.onclick = async (e) => {
        e.preventDefault();
        await fetch('/api/sign-out', { method: 'POST' });
        window.location.reload();
      };
    } else {
      // ensure it stays Sign-in
      loginBtn.textContent = 'Sign In';
      loginBtn.href = '/sign-in';
      loginBtn.onclick = null;
    }
  } catch (err) {
    console.error('Auth UI error:', err);
  }
});
