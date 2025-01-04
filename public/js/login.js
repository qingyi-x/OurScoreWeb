document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        
        if (data.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Login successful!';
            
            // Check if profile is complete
            if (data.isProfileComplete) {
                window.location.href = '/dashboard.html';
            } else {
                window.location.href = '/profile-setup.html';
            }
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.message || 'Login failed';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'An error occurred. Please try again.';
    }
}); 