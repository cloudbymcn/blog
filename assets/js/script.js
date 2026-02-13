document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    setupMouseGlow();
    setupCurrentYear();
    setupLanguageSwitcher();

    // Home Features
    if (document.querySelector('.search-input')) {
        setupSearch();
        setupTagFilters();
    }

    // Article Features
    if (document.querySelector('.article-content')) {
        setupReadingTime();
        setupProgressBar();
        setupCopyButtons();
        generateTOC();
    }
});

// --- Google Translate Integration ---
function setupLanguageSwitcher() {
    if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);
    }

    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'pt',
            includedLanguages: 'en,pt',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
    };

    const ptBtn = document.getElementById('lang-pt');
    const enBtn = document.getElementById('lang-en');

    if (ptBtn && enBtn) {
        ptBtn.addEventListener('click', () => changeLanguage('pt'));
        enBtn.addEventListener('click', () => changeLanguage('en'));
    }
}

function changeLanguage(langCode) {
    const cookieValue = langCode === 'en' ? '/pt/en' : '/pt/pt';
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${cookieValue}; path=/;`; 
    window.location.reload();
}

// --- Dark/Light Mode (Padrão Dark) ---
function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if(!toggle) return;
    
    // 1. Verifica se o usuário já escolheu um tema antes
    const savedTheme = localStorage.getItem('theme');

    // 2. Se salvou 'light', aplica. Caso contrário (null ou 'dark'), mantém o padrão do CSS (Dark)
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        toggle.textContent = '🌙'; // Ícone para voltar ao escuro
    } else {
        toggle.textContent = '☀️'; // Ícone para ir ao claro
    }
    
    // 3. Evento de clique
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        
        if (document.body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
            toggle.textContent = '🌙';
        } else {
            localStorage.setItem('theme', 'dark');
            toggle.textContent = '☀️';
        }
    });
}

// --- Efeito Mouse Glow ---
function setupMouseGlow() {
    document.querySelectorAll('.post-card').forEach(card => {
        card.onmousemove = e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        };
    });
}

// --- Busca em Tempo Real ---
function setupSearch() {
    const input = document.querySelector('.search-input');
    const posts = document.querySelectorAll('.post-card');

    if (!input) return;

    input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();

        posts.forEach(post => {
            const title = post.querySelector('.post-title').innerText.toLowerCase();
            const excerpt = post.querySelector('.post-excerpt').innerText.toLowerCase();
            const tags = post.getAttribute('data-tags') || '';

            if (title.includes(term) || excerpt.includes(term) || tags.includes(term)) {
                post.style.display = 'flex';
                post.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                post.style.display = 'none';
            }
        });
    });
}

// --- Filtros de Tags ---
function setupTagFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const posts = document.querySelectorAll('.post-card');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            const searchInput = document.querySelector('.search-input');
            if(searchInput) searchInput.value = ''; 

            posts.forEach(post => {
                if (filter === 'all' || post.getAttribute('data-tags').includes(filter)) {
                    post.style.display = 'flex';
                } else {
                    post.style.display = 'none';
                }
            });
        });
    });
}

// --- Gerador de Índice (Table of Contents) ---
function generateTOC() {
    const tocList = document.getElementById('toc-list');
    const headers = document.querySelectorAll('.article-content h2');
    
    if (!tocList || headers.length === 0) return;

    headers.forEach((header, index) => {
        if (!header.id) header.id = `section-${index}`;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${header.id}`;
        a.textContent = header.textContent;
        a.className = 'toc-link';
        
        a.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById(header.id).scrollIntoView({ behavior: 'smooth' });
        });

        li.appendChild(a);
        tocList.appendChild(li);
    });
}

// --- Utilitários Básicos ---
function setupCurrentYear() {
    const el = document.getElementById('current-year');
    if(el) el.textContent = new Date().getFullYear();
}

function setupReadingTime() {
    const text = document.querySelector('.article-content').innerText;
    const time = Math.ceil(text.split(/\s+/).length / 200);
    const el = document.getElementById('reading-time');
    if (el) el.textContent = `⏱️ ${time} min leitura`;
}

function setupProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (bar) {
        window.addEventListener('scroll', () => {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            bar.style.width = (scrollTop / scrollHeight) * 100 + "%";
        });
    }
}

function setupCopyButtons() {
    document.querySelectorAll('pre').forEach(pre => {
        if (pre.parentNode.classList.contains('code-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        wrapper.style.position = 'relative';
        
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Copiar';
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(pre.innerText);
            btn.textContent = 'Copiado!';
            setTimeout(() => btn.textContent = 'Copiar', 2000);
        });
        wrapper.appendChild(btn);
    });
}