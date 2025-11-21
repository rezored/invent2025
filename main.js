// Language switching functionality
function switchLanguage(lang, evt) {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
        btn.classList.remove('active');
    });

    const trigger = evt?.currentTarget || evt?.target;
    if (trigger) {
        trigger.classList.add('active');
    } else {
        const fallbackBtn = document.querySelector(`.lang-btn[onclick*="${lang}"]`);
        fallbackBtn?.classList.add('active');
    }

    document.querySelectorAll('.lang-content').forEach((content) => {
        content.classList.remove('active');
    });
    document.querySelectorAll(`.lang-content[data-lang="${lang}"]`).forEach((content) => {
        content.classList.add('active');
    });

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const translated = el.getAttribute(`data-${lang}`);
        if (translated) {
            el.textContent = translated;
        }
    });
}

// Contact form submission handler
function handleSubmit(event) {
    event.preventDefault();
    const currentLang = document.querySelector('.lang-content.active')?.getAttribute('data-lang') ?? 'en';
    const message = currentLang === 'bg'
        ? 'Благодарим за вашето съобщение! Ще се свържем с вас скоро.'
        : 'Thank you for your message! We will get back to you soon.';
    alert(message);
    event.target.reset();
}

(function initCarousel() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    const slides = Array.from(track.querySelectorAll('.carousel-slide'));
    const dots = Array.from(document.querySelectorAll('.carousel-dot'));
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    let current = 0;
    let timerId = null;
    const interval = 6000;

    const showSlide = (index) => {
        if (!slides.length) return;
        current = (index + slides.length) % slides.length;
        slides.forEach((slide) => slide.classList.remove('active'));
        dots.forEach((dot) => dot.classList.remove('active'));
        slides[current].classList.add('active');
        dots[current]?.classList.add('active');
    };

    const nextSlide = () => showSlide(current + 1);
    const prevSlide = () => showSlide(current - 1);

    const restartTimer = () => {
        if (timerId) clearInterval(timerId);
        timerId = setInterval(nextSlide, interval);
    };

    nextBtn?.addEventListener('click', () => {
        nextSlide();
        restartTimer();
    });

    prevBtn?.addEventListener('click', () => {
        prevSlide();
        restartTimer();
    });

    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const idx = Number(dot.dataset.index);
            showSlide(idx);
            restartTimer();
        });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(timerId);
        } else {
            restartTimer();
        }
    });

    showSlide(0);
    restartTimer();
})();

