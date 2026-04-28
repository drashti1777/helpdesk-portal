async function testLogin() {
  try {
    const payload = {
      email: 'drashti7@gmail.com',
      password: 'your_password_here' // I don't know the password
    };
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Data:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// testLogin(); // Commented out because I don't know the password
