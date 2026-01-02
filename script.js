// Date Logic
const dateSpan = document.getElementById('current-year');
if (dateSpan) {
    dateSpan.textContent = new Date().getFullYear();
}