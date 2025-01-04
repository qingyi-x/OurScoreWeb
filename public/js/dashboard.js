document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/index.html';
        return;
    }

    // Display username
    document.getElementById('username').textContent = username;

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('username');
        window.location.href = '/index.html';
    });
}); 