/**
 * Cloud by MCN — Main JS
 * Loading, parallax, split text, typing effect, tilt cards, glow, stagger,
 * active nav, scroll progress, circular BTT, magnetic buttons, filters, i18n
 */

// ═══ LOADING SCREEN ═══
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('done');
    setTimeout(() => {
      initSplitText();
      setTimeout(initWordReveal, 800);
    }, 400);
  }, 2800);
});

// ═══ SPLIT TEXT HERO ═══
function initSplitText() {
  const title = document.getElementById('heroTitle');
  if (!title) return;

  let wordIndex = 0;
  const fragment = document.createDocumentFragment();

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const tokens = node.textContent.split(/(\s+)/);
      tokens.forEach(token => {
        if (token.trim() === '') {
          fragment.appendChild(document.createTextNode(token));
        } else {
          const span = document.createElement('span');
          span.className = 'word go';
          span.style.animationDelay = (wordIndex * 0.12) + 's';
          span.textContent = token;
          wordIndex++;
          fragment.appendChild(span);
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'BR') {
        fragment.appendChild(document.createElement('br'));
      } else {
        const wrapper = document.createElement(node.tagName.toLowerCase());
        for (const attr of node.attributes) {
          wrapper.setAttribute(attr.name, attr.value);
        }
        wrapper.classList.add('word', 'go');
        wrapper.style.animationDelay = (wordIndex * 0.12) + 's';
        wrapper.textContent = node.textContent;
        wordIndex++;
        fragment.appendChild(wrapper);
      }
    }
  }

  const children = [...title.childNodes];
  children.forEach(processNode);
  title.innerHTML = '';
  title.appendChild(fragment);
}

// ═══ WORD-BY-WORD REVEAL (6) ═══
function initWordReveal() {
  const el = document.getElementById('heroSub');
  if (!el) return;

  // Get the HTML content (preserves <strong>, <em>, etc.)
  const lang = currentLang || 'pt';
  const key = el.dataset.i18nHtml || el.dataset.i18n;
  const fullHTML = (key && i18n[lang] && i18n[lang][key]) || el.innerHTML;

  // Parse and wrap each text word in a reveal span, preserving HTML tags
  const temp = document.createElement('div');
  temp.innerHTML = fullHTML;

  function wrapWords(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const tokens = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      tokens.forEach(token => {
        if (token.trim() === '') {
          frag.appendChild(document.createTextNode(token));
        } else {
          const span = document.createElement('span');
          span.className = 'rw';
          span.textContent = token;
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Process children in reverse to avoid mutation issues
      [...node.childNodes].forEach(child => wrapWords(child));
    }
  }

  wrapWords(temp);
  el.innerHTML = temp.innerHTML;
  el.classList.add('ready');

  // Stagger reveal each word
  const words = el.querySelectorAll('.rw');
  words.forEach((w, i) => {
    setTimeout(() => w.classList.add('vis'), i * 70);
  });
}

// ═══ PARALLAX (2) ═══
const skyVideo = document.getElementById('skyVideo');
function updateParallax() {
  if (!skyVideo) return;
  const y = window.scrollY;
  skyVideo.style.transform = `translate(-50%, calc(-50% + ${y * 0.25}px))`;
}

// ═══ SCROLL: Nav, Progress, BTT Progress, Parallax ═══
const nav = document.getElementById('nav');
const btt = document.getElementById('bttBtn');
const progressBar = document.getElementById('scrollProgress');
const bttFill = document.getElementById('bttFill');
const sections = document.querySelectorAll('section[id]');

// BTT circle circumference
const BTT_CIRCUMFERENCE = 2 * Math.PI * 18; // r=18
if (bttFill) {
  bttFill.style.strokeDasharray = BTT_CIRCUMFERENCE;
  bttFill.style.strokeDashoffset = BTT_CIRCUMFERENCE;
}

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = Math.min((y / docHeight) * 100, 100);

  // Nav background
  nav.classList.toggle('scrolled', y > 40);
  btt.classList.toggle('vis', y > 500);

  // Scroll progress bar (4)
  progressBar.style.width = progress + '%';

  // BTT circular progress (19)
  if (bttFill) {
    const offset = BTT_CIRCUMFERENCE - (progress / 100) * BTT_CIRCUMFERENCE;
    bttFill.style.strokeDashoffset = offset;
  }

  // Active nav link
  let current = '';
  sections.forEach(sec => {
    const top = sec.offsetTop - 150;
    if (y >= top) current = sec.id;
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.section === current);
  });

  // Nav dark mode when over dark sections
  const nlEl = document.querySelector('.nl');
  const footerEl = document.querySelector('footer');
  const navBot = nav.offsetHeight + nav.offsetTop;
  const inDark = (nlEl && y + navBot >= nlEl.offsetTop && y < (footerEl ? footerEl.offsetTop + footerEl.offsetHeight : Infinity));
  nav.classList.toggle('nav-dark', inDark);

  // Parallax (2)
  updateParallax();
}, { passive: true });

// ═══ REVEAL ON SCROLL + STAGGER ═══
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      if (el.classList.contains('stagger')) {
        const parent = el.parentElement;
        const siblings = [...parent.querySelectorAll('.stagger')];
        const index = siblings.indexOf(el);
        el.style.transitionDelay = (index * 0.12) + 's';
      }
      el.classList.add('vis');
      revealObs.unobserve(el);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.rv').forEach(el => revealObs.observe(el));

// ═══ TIMELINE SEQUENTIAL ═══
const tlObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.tl-item').forEach((item, i) => {
        setTimeout(() => item.classList.add('vis'), i * 180);
      });
      tlObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

const tl = document.getElementById('tl');
if (tl) tlObs.observe(tl);

// ═══ 3D TILT CARDS (desktop only) ═══
const isTouchDevice = window.matchMedia('(hover: none)').matches;
if (!isTouchDevice) document.querySelectorAll('.tilt-card').forEach(card => {
  const glow = card.querySelector('.card-glow');

  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;

    if (glow) {
      glow.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(232,137,12,.08), transparent 60%)`;
    }
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    card.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
    if (glow) glow.style.background = 'transparent';
  });

  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform .1s ease-out';
  });
});

// ═══ MAGNETIC BUTTONS (desktop only) ═══
if (!isTouchDevice) document.querySelectorAll('.mag').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
  });
});

// ═══ PROJECT FILTER — Improved micro-interactions (7) ═══
document.querySelectorAll('.f-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');

    const cards = document.querySelectorAll('.pj');
    let visibleIndex = 0;

    cards.forEach(card => {
      const show = filter === 'all' || card.dataset.cat === filter;
      if (!show) {
        card.classList.add('hiding');
        setTimeout(() => card.classList.add('hidden'), 350);
      } else {
        // Stagger the reveal of visible cards
        const delay = visibleIndex * 80;
        visibleIndex++;
        card.classList.remove('hidden');
        card.style.transitionDelay = delay + 'ms';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            card.classList.remove('hiding');
            // Clear delay after animation
            setTimeout(() => { card.style.transitionDelay = '0ms'; }, 500);
          });
        });
      }
    });
  });
});

// ═══ PROJECT SORT ═══
const sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
  sortSelect.addEventListener('change', function () {
    const grid = document.getElementById('projGrid');
    const cards = [...grid.querySelectorAll('.pj')];
    cards.sort((a, b) => {
      const da = new Date(a.dataset.date), db = new Date(b.dataset.date);
      return this.value === 'newest' ? db - da : da - db;
    });
    cards.forEach(card => grid.appendChild(card));
  });
}

// ═══ MOBILE NAV ═══
const navLinksEl = document.getElementById('navLinks');
const navTogEl = document.getElementById('navTog');
navTogEl.addEventListener('click', () => {
  navLinksEl.classList.toggle('open');
  // Prevent body scroll when menu open
  document.body.style.overflow = navLinksEl.classList.contains('open') ? 'hidden' : '';
});
// Close on link click
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    navLinksEl.classList.remove('open');
    document.body.style.overflow = '';
  });
});
// Close on outside tap
document.addEventListener('click', e => {
  if (navLinksEl.classList.contains('open') && !navLinksEl.contains(e.target) && !navTogEl.contains(e.target)) {
    navLinksEl.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ═══ VIEW TRANSITIONS (1) ═══
if (document.startViewTransition) {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    // Only intercept local page navigations (not anchors, not external)
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
    e.preventDefault();
    document.startViewTransition(() => {
      window.location.href = href;
    });
  });
}

// ═══ I18N SYSTEM ═══
const i18n = {
  pt: {
    nav_proj: 'Projetos', nav_about: 'Sobre', nav_contact: 'Contato',
    nav_cta: 'Fale comigo',
    hero_title: 'beyond<br>the <em>cloud</em>',
    hero_sub: 'arquiteturas AWS reais. decisões técnicas. <strong>casos de estudo e projetos.</strong>',
    hero_btn1: 'Ver Projetos →', hero_btn2: 'Sobre mim',
    proj_title: 'Projetos', proj_desc: 'Case studies de produção com arquitetura e implementação completa.',
    filter_all: 'Todos', sort_new: 'Mais recente', sort_old: 'Mais antigo',
    read_case: 'Ler case study →',
    about_title: 'Quem sou eu?',
    about_role: 'Engenheiro de Infraestrutura Cloud',
    about_postgrad: 'Pós-graduando em Arquitetura Cloud',
    about_focus: 'IA · Escalabilidade · Sistemas Distribuídos',
    about_studying: 'Estudando agora',
    about_study_desc: 'AWS Solutions Architect Professional (SAP-C02). Foco em multi-account e DR cross-region.',
    about_what: 'O que faço',
    about_what_p1: 'Engenheiro de infraestrutura focado em <strong>AWS</strong>, com experiência em soluções cloud reais. Pós-graduando em Arquitetura Cloud, com foco em IA, escalabilidade e sistemas distribuídos.',
    about_what_p2: 'Este blog documenta <strong>arquiteturas reais, decisões técnicas e implementações completas</strong>. Automação, otimização de custos, pipelines de mídia e infraestrutura que funciona.',
    about_why: 'Por que contribuo',
    about_why_p: 'Cada vez que resolvo um problema em produção, documento. Cada vez que erro, documento melhor ainda. Se meu erro pode evitar que outra pessoa perca 4 horas debugando, o post já valeu.',
    tl_launch: 'Lançamento do Cloud by MCN',
    tl_postgrad: 'Pós-graduação em Arquitetura Cloud →',
    nl_title: 'Receba 1 arquitetura real por semana.',
    nl_desc: 'Sem spam. Só decisões técnicas, diagramas e lições de produção.',
    nl_btn: 'Assinar →',
    contact_title: 'Vamos conversar',
    contact_channels: 'Canais',
    contact_channels_desc: 'Email para propostas formais, LinkedIn para networking.',
    contact_form_title: 'Envie uma mensagem',
    form_name: 'Nome', form_email: 'Email', form_subject: 'Assunto', form_msg: 'Mensagem',
    form_opt1: 'Palestra / workshop', form_opt2: 'Colaboração técnica', form_opt3: 'Consultoria AWS', form_opt4: 'Outro',
    form_send: 'Enviar mensagem →',
    ft_desc: 'Arquiteturas AWS reais. Decisões técnicas documentadas para a comunidade.',
    ft_nav: 'Navegação', ft_tech: 'Tecnologias',
    ft_nl_desc: '1 arquitetura real por semana.',
    ft_rights: 'Todos os direitos reservados.'
  },
  en: {
    nav_proj: 'Projects', nav_about: 'About', nav_contact: 'Contact',
    nav_cta: 'Get in touch',
    hero_title: 'beyond<br>the <em>cloud</em>',
    hero_sub: 'real AWS architectures. technical decisions. <strong>case studies & projects.</strong>',
    hero_btn1: 'View Projects →', hero_btn2: 'About me',
    proj_title: 'Projects', proj_desc: 'Production case studies with full architecture and implementation.',
    filter_all: 'All', sort_new: 'Newest', sort_old: 'Oldest',
    read_case: 'Read case study →',
    about_title: 'Who am I?',
    about_role: 'Cloud Infrastructure Engineer',
    about_postgrad: 'Postgrad in Cloud Architecture',
    about_focus: 'AI · Scalability · Distributed Systems',
    about_studying: 'Currently studying',
    about_study_desc: 'AWS Solutions Architect Professional (SAP-C02). Focus on multi-account and cross-region DR.',
    about_what: 'What I do',
    about_what_p1: 'Infrastructure engineer focused on <strong>AWS</strong>, with experience in real cloud solutions. Postgrad in Cloud Architecture, focused on AI, scalability and distributed systems.',
    about_what_p2: 'This blog documents <strong>real architectures, technical decisions and full implementations</strong>. Automation, cost optimization, media pipelines and infrastructure that works.',
    about_why: 'Why I contribute',
    about_why_p: 'Every time I solve a problem in production, I document it. Every time I fail, I document it even better. If my mistake can save someone 4 hours of debugging, the post was worth it.',
    tl_launch: 'Cloud by MCN launch',
    tl_postgrad: 'Postgrad in Cloud Architecture →',
    nl_title: 'Get 1 real architecture per week.',
    nl_desc: 'No spam. Just technical decisions, diagrams and production lessons.',
    nl_btn: 'Subscribe →',
    contact_title: "Let's talk",
    contact_channels: 'Channels',
    contact_channels_desc: 'Email for formal proposals, LinkedIn for networking.',
    contact_form_title: 'Send a message',
    form_name: 'Name', form_email: 'Email', form_subject: 'Subject', form_msg: 'Message',
    form_opt1: 'Talk / workshop', form_opt2: 'Technical collaboration', form_opt3: 'AWS consulting', form_opt4: 'Other',
    form_send: 'Send message →',
    ft_desc: 'Real AWS architectures. Technical decisions documented for the community.',
    ft_nav: 'Navigation', ft_tech: 'Technologies',
    ft_nl_desc: '1 real architecture per week.',
    ft_rights: 'All rights reserved.'
  }
};

let currentLang = 'pt';

function setLang(lang) {
  currentLang = lang;
  const t = i18n[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (t[key]) el.innerHTML = t[key];
  });
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  // Re-run split text and typing when language changes
  initSplitText();
  setTimeout(initWordReveal, 600);
}

document.querySelectorAll('.lang-b').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-b').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    setLang(btn.dataset.lang);
  });
});
