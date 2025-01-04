document.getElementById('profileSetupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/index.html';
        return;
    }
    
    const formData = {
        username: username,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        school: document.getElementById('school').value,
        program: document.getElementById('program').value,
        graduationYear: document.getElementById('graduationYear').value
    };

    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'username': username
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Profile updated successfully!';
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.message || 'Failed to update profile';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'An error occurred. Please try again.';
        console.error('Error:', error);
    }
}); 