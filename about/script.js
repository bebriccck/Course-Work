document.addEventListener('DOMContentLoaded', () => {
    const parallax = document.querySelector('.parallax');
    const foreground = document.querySelector('.parallax-foreground');
    const content = document.querySelector('.parallax-content');
    const header = document.querySelector('#header');
    let virtualScroll = 0;
    let isParallaxComplete = false;

    foreground.style.opacity = '0';
    content.style.opacity = '0';

    const isParallaxVisible = () => {
        const rect = parallax.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    };

    if (isParallaxVisible()) {
        document.body.classList.add('locked');
    }

    const handleWheel = (e) => {
        if (isParallaxComplete || !isParallaxVisible()) return;

        e.preventDefault();
        const parallaxHeight = parallax.offsetHeight;
        const headerHeight = header.offsetHeight;

        virtualScroll += e.deltaY;

        if (virtualScroll < 0) virtualScroll = 0;
        if (virtualScroll >= parallaxHeight) {
            virtualScroll = parallaxHeight;
            isParallaxComplete = true;
            unlockScroll();
        }

        const parallaxScroll = Math.min(parallaxHeight, Math.max(0, virtualScroll) * (parallaxHeight / (parallaxHeight - headerHeight)));
        updateParallax(parallaxHeight, parallaxScroll);

        console.log(`virtualScroll: ${virtualScroll}, parallaxScroll: ${parallaxScroll}, parallaxHeight: ${parallaxHeight}, headerHeight: ${headerHeight}`);
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
        touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
        if (isParallaxComplete || !isParallaxVisible()) return;

        e.preventDefault();
        const parallaxHeight = parallax.offsetHeight;
        const headerHeight = header.offsetHeight;
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        virtualScroll += deltaY * 1.2;

        if (virtualScroll < 0) virtualScroll = 0;
        if (virtualScroll >= parallaxHeight) {
            virtualScroll = parallaxHeight;
            isParallaxComplete = true;
            unlockScroll();
        }

        const parallaxScroll = Math.min(parallaxHeight, Math.max(0, virtualScroll) * (parallaxHeight / (parallaxHeight - headerHeight)));
        updateParallax(parallaxHeight, parallaxScroll);

        console.log(`virtualScroll: ${virtualScroll}, parallaxScroll: ${parallaxScroll}, parallaxHeight: ${parallaxHeight}, headerHeight: ${headerHeight}`);
        touchStartY = touchY;
    };

    const unlockScroll = () => {
        document.body.classList.remove('locked');
        document.body.style.overflow = 'auto';
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        console.log('Scroll unlocked, event listeners removed, overflow set to auto');
        console.log('Body classList:', document.body.classList.toString());
    };

    const updateParallax = (parallaxHeight, parallaxScroll) => {
        const foregroundMaxMove = parallaxHeight;
        let foregroundTranslate = foregroundMaxMove - parallaxScroll * 1.2;
        if (foregroundTranslate <= 0) {
            foregroundTranslate = 0;
            foreground.style.opacity = '1';
        } else {
            foreground.style.opacity = Math.min(parallaxScroll / (parallaxHeight * 0.5), 1);
        }
        foreground.style.transform = `translateY(${foregroundTranslate}px)`;

        const contentDelay = parallaxHeight * 0.5;
        const contentMaxMove = parallaxHeight * 0.5;
        if (parallaxScroll > contentDelay) {
            let contentTranslate = contentMaxMove - (parallaxScroll - contentDelay) * 1.2;
            if (contentTranslate <= -contentMaxMove) {
                contentTranslate = -contentMaxMove;
                content.style.opacity = '1';
            } else {
                content.style.opacity = Math.min((parallaxScroll - contentDelay) / (parallaxHeight * 0.5), 1);
            }
            content.style.transform = `translateY(${contentTranslate}px)`;
        } else {
            content.style.transform = `translateY(${foregroundMaxMove}px)`;
            content.style.opacity = '0';
        }

        console.log(`content translateY: ${content.style.transform}, content opacity: ${content.style.opacity}`);
    };

    const handleScroll = () => {
        const scrollPosition = window.scrollY;
        const parallaxPosition = parallax.offsetTop;
        const windowHeight = window.innerHeight;
        const parallaxHeight = parallax.offsetHeight;

        if (isParallaxVisible()) {
            if (!isParallaxComplete && !document.body.classList.contains('locked')) {
                document.body.classList.add('locked');
                document.body.style.overflow = 'hidden';
                window.addEventListener('wheel', handleWheel, { passive: false });
                window.addEventListener('touchstart', handleTouchStart, { passive: false });
                window.addEventListener('touchmove', handleTouchMove, { passive: false });
                console.log('Parallax visible, scroll locked, event listeners restored');
                console.log('Body classList:', document.body.classList.toString());
            }
        } else if (!isParallaxComplete) {
            document.body.classList.remove('locked');
            document.body.style.overflow = 'auto';
            console.log('Parallax not visible, scroll unlocked temporarily');
            console.log('Body classList:', document.body.classList.toString());
        }

        if (!isParallaxComplete && scrollPosition + windowHeight <= parallaxPosition) {
            virtualScroll = 0;
            foreground.style.transform = `translateY(${parallaxHeight}px)`;
            foreground.style.opacity = '0';
            content.style.transform = `translateY(${parallaxHeight}px)`;
            content.style.opacity = '0';
            document.body.classList.add('locked');
            document.body.style.overflow = 'hidden';
            console.log('Scroll reset to top, parallax restarted');
            console.log('Body classList:', document.body.classList.toString());
        }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('scroll', handleScroll);
});