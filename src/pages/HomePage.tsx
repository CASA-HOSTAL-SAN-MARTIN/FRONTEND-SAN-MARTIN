import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type IconName =
  | 'home' | 'info' | 'login' | 'sparkle' | 'bed' | 'cap' | 'wifi'
  | 'arrows' | 'building' | 'layers' | 'document' | 'search'
  | 'check' | 'down' | 'right' | 'up';

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5M9 21v-7h6v7" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  login: <><path d="M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" /><path d="M3 12h12m-4-4 4 4-4 4" /></>,
  sparkle: <><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
  bed: <><path d="M3 18V6m0 9h18v6m0-6V11a2 2 0 0 0-2-2h-7v6" /><path d="M3 12h18M7 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></>,
  cap: <><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c3.5 2.7 8.5 2.7 12 0v-5m4-2v6" /></>,
  wifi: <><path d="M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M10 16a4 4 0 0 1 4 0" /><path d="M12 20h.01" /></>,
  arrows: <><path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4 4-4-4 4-4" /></>,
  building: <><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20" /><path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2m-5 6v-4h2v4" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  document: <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M9 13h6m-6 4h6" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /></>,
  check: <path d="m4 12 5 5L20 6" />,
  down: <><path d="M12 3v17m-7-7 7 7 7-7" /></>,
  right: <><path d="M3 12h17m-7-7 7 7-7 7" /></>,
  up: <><path d="M12 21V4m-7 7 7-7 7 7" /></>,
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {iconPaths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Casa Estudiantil San Martín, inicio">
      <span className="brand-symbol" aria-hidden="true"><Icon name="home" /></span>
      <span className="brand-copy"><strong>Casa Estudiantil</strong><small>SAN MARTÍN · PEREIRA</small></span>
    </Link>
  );
}

export function HomePage() {
  const [showingProcess, setShowingProcess] = useState(false);

  useEffect(() => {
    const section = document.getElementById('proceso');
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setShowingProcess(entry.isIntersecting), {
      rootMargin: '-15% 0px -55% 0px',
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const scrollToProcess = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById('proceso')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <main className="public-home">
      <section className="photo-hero" id="la-casa">
        <header className="public-header">
          <Brand />
          <nav className="public-nav" aria-label="Navegación principal">
            <a className={!showingProcess ? 'active' : undefined} href="#la-casa"><Icon name="home" /> La residencia</a>
            <a className={showingProcess ? 'active' : undefined} href="#proceso" onClick={scrollToProcess}><Icon name="info" /> Cómo solicitar</a>
          </nav>
          <Link className="login-link" to="/login"><Icon name="login" /> Iniciar sesión</Link>
        </header>

        <div className="photo-hero-copy">
          <p className="photo-eyebrow"><Icon name="sparkle" /> ALOJAMIENTO UNIVERSITARIO · PEREIRA</p>
          <h1>Un lugar para vivir.<br /><em>Un espacio para<br className="hero-mobile-break" /> avanzar.</em></h1>
          <p className="photo-intro">Un hogar para estudiantes que llegan a Pereira<br className="desktop-break" /> con ganas de aprender, crecer y construir su futuro.</p>
        </div>

        <div className="hero-bottom-row">
          <div className="hero-feature-strip">
            <article><Icon name="bed" /><div><strong>Habitaciones</strong><span>cómodas y seguras</span></div></article>
            <article><Icon name="cap" /><div><strong>Ambiente universitario</strong><span>ideal para estudiar</span></div></article>
            <article><Icon name="wifi" /><div><strong>Servicios incluidos</strong><span>Internet, aseo, etc.</span></div></article>
          </div>
          <div className="public-actions">
            <Link className="apply-button" to="/solicitar-cupo"><Icon name="document" /> Solicitar un cupo <Icon className="button-arrow" name="right" /></Link>
            <Link className="scroll-cue" to="/consultar-cupo"><Icon name="search" /> Consultar cupo</Link>
          </div>
        </div>
      </section>

      <section className="process-section" id="proceso">
        <div className="home-facts" aria-label="La residencia en cifras">
          <div className="fact-intro"><span className="fact-emblem"><Icon name="arrows" /></span><div><strong>Un hogar compartido</strong><span>Un entorno pensado para acompañar tu<br className="desktop-break" /> vida universitaria.</span></div></div>
          <div className="fact"><span className="fact-icon"><Icon name="building" /></span><div><strong>48</strong><small>cupos de alojamiento</small></div></div>
          <div className="fact"><span className="fact-icon"><Icon name="home" /></span><div><strong>24</strong><small>habitaciones dobles</small></div></div>
          <div className="fact"><span className="fact-icon"><Icon name="layers" /></span><div><strong>3</strong><small>pisos de residencia</small></div></div>
        </div>

        <div className="process-content">
          <div className="process-intro-grid">
            <div className="process-title-block">
              <p className="process-kicker"><span /> EMPIEZA AQUÍ</p>
              <h2>¿Buscas alojamiento<br /><em>en Pereira?</em></h2>
              <p className="process-intro">Cuéntanos sobre ti y tus estudios. El equipo de la residencia revisará tu solicitud; podrás seguir el proceso con tu radicado y el correo registrado.</p>
            </div>
            <img className="process-photo" src="/loginfondo2.png" alt="Patio interior de la residencia con zonas verdes y espacios para estudiantes" />
          </div>

          <div className="process-steps">
            <article><span className="step-number">01</span><div><strong>Envía tu solicitud</strong><p>Completa tus datos personales, universidad y programa académico.</p></div><Icon className="step-icon" name="document" /></article>
            <article><span className="step-number">02</span><div><strong>El equipo la revisa</strong><p>Tu solicitud queda en revisión por el personal autorizado.</p></div><Icon className="step-icon" name="search" /></article>
            <article><span className="step-number">03</span><div><strong>Consulta el estado</strong><p>Usa tu radicado y el correo que registraste.</p></div><Icon className="step-icon" name="check" /></article>
          </div>
          <Link className="apply-button process-button" to="/solicitar-cupo">Comenzar solicitud <Icon name="right" /></Link>
          <Link className="home-status-link" to="/consultar-cupo">Ya tengo un radicado · Consultar estado</Link>
        </div>
      </section>

      <footer className="public-footer"><Brand /><span>Un espacio para estudiar, convivir y crecer.</span><a href="#la-casa">Volver arriba <Icon name="up" /></a></footer>
    </main>
  );
}
