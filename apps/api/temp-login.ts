async function testAuth() {
  try {
    const res = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@pospizza.com", password: "admin123" })
    });
    const data = await res.json();
    console.log("LOGIN RESPONSE:", data);

    if (data.access_token) {
      const profileRes = await fetch("http://localhost:3001/auth/profile", {
        headers: { "Authorization": `Bearer ${data.access_token}` },
      });
      const profileData = await profileRes.json();
      console.log("PROFILE RESPONSE:", profileData);
    }
  } catch (err) {
    console.error(err);
  }
}
testAuth();
