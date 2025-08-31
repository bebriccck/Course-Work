fetch('../header/index.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header').innerHTML = data;
        const scripts = [
            '../header/burger.js',
            '../header/theme.js',
            '../header/i18n.js',
            '../header/accessibility.js'
        ];
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            document.body.appendChild(script);
        });
    });