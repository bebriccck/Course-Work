fetch('../header/index.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header').innerHTML = data;
        const script = document.createElement('script');
        script.src = '../header/burger.js';
        document.body.appendChild(script);
    });