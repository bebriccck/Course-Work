document.querySelector('.hamburger').addEventListener('click', () => {
    document.querySelector('.nav_menu').classList.toggle('active');
    document.querySelector('.hamburger').classList.toggle('active');
});