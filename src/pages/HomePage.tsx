import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Casa Estudiantil San Martín, inicio">
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none"><path d="M4 14.5 16 5l12 9.5M8 13v12h16V13M12 25v-7h8v7M11 15h10M13 15l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span className="brand-copy"><strong>Casa Estudiantil</strong><small>SAN MARTÍN · PEREIRA</small></span>
    </Link>
  );
}

function FeatureIcon({ type }: { type: 'bed' | 'cap' | 'wifi' }) {
  if (type === 'bed') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 24V11m0 10h24v5m0-5v-7a3 3 0 0 0-3-3h-8v10m-13-5h21M8 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (type === 'cap') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m3 12 13-7 13 7-13 7-13-7Zm5 3v7c5 4 11 4 16 0v-7M29 12v9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 12a18 18 0 0 1 24 0M8 17a12 12 0 0 1 16 0m-12 5a6 6 0 0 1 8 0m-4 5h.01" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>;
}

export function HomePage() {
  const [showingProcess, setShowingProcess] = useState(false);

  useEffect(() => {
    const section = document.getElementById('proceso');
    if (!section) return;

    const observer = new IntersectionObserver(([entry]) => {
      setShowingProcess(entry.isIntersecting);
    }, { rootMargin: '-15% 0px -55% 0px' });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const scrollToProcess = (event: React.MouseEvent<HTMLAnchorElement>) => {
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
            <a className={!showingProcess ? 'active' : undefined} href="#la-casa"><span aria-hidden="true">⌂</span> La residencia</a>
            <a className={showingProcess ? 'active' : undefined} href="#proceso" onClick={scrollToProcess}><span aria-hidden="true">ⓘ</span> Cómo solicitar</a>
          </nav>
          <Link className="login-link" to="/login"><span aria-hidden="true">↪</span> Iniciar sesión</Link>
        </header>

        <div className="photo-hero-copy">
          <p className="photo-eyebrow"><span aria-hidden="true">⌖</span> ALOJAMIENTO UNIVERSITARIO · PEREIRA</p>
          <h1>Un lugar para vivir.<br /><em>Un espacio para<br className="hero-mobile-break" /> avanzar.</em></h1>
          <p className="photo-intro">Un hogar para estudiantes que llegan a Pereira<br className="desktop-break" /> con ganas de aprender, crecer y construir su futuro.</p>
        </div>

        <div className="hero-bottom-row">
          <div className="hero-feature-strip">
            <article><FeatureIcon type="bed" /><div><strong>Habitaciones</strong><span>cómodas y seguras</span></div></article>
            <article><FeatureIcon type="cap" /><div><strong>Ambiente universitario</strong><span>ideal para estudiar</span></div></article>
            <article><FeatureIcon type="wifi" /><div><strong>Servicios incluidos</strong><span>Internet, aseo, etc.</span></div></article>
          </div>
          <div className="public-actions">
            <Link className="apply-button" to="/solicitar-cupo"><span aria-hidden="true">▣</span> Solicitar un cupo <b aria-hidden="true">→</b></Link>
            <a className="scroll-cue" href="#proceso" onClick={scrollToProcess} aria-label="Desplazarse a cómo solicitar"><span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>

      <section className="process-section" id="proceso">
        <div className="home-facts" aria-label="La residencia en cifras">
          <div className="fact-intro"><span className="fact-emblem" aria-hidden="true">↔</span><div><strong>Un hogar compartido</strong><span>Un entorno pensado para acompañar tu<br className="desktop-break" /> vida universitaria.</span></div></div>
          <div className="fact"><span className="fact-icon" aria-hidden="true">▰</span><div><strong>48</strong><small>cupos de alojamiento</small></div></div>
          <div className="fact"><span className="fact-icon" aria-hidden="true">⌂</span><div><strong>24</strong><small>habitaciones dobles</small></div></div>
          <div className="fact"><span className="fact-icon" aria-hidden="true">▥</span><div><strong>3</strong><small>pisos de residencia</small></div></div>
        </div>

        <div className="process-content">
          <p className="process-kicker"><span /> EMPIEZA AQUÍ</p>
          <h2>¿Buscas alojamiento<br /><em>en Pereira?</em></h2>
          <p className="process-intro">Cuéntanos sobre ti y tus estudios. El equipo de la residencia revisará tu<br className="desktop-break" /> solicitud y podrás consultar su estado con el radicado.</p>
          <div className="process-steps">
            <article><span className="step-number">01</span><div><strong>Envía tu solicitud</strong><p>Completa tus datos personales, universidad y programa académico.</p></div><span className="step-icon" aria-hidden="true">▤</span></article>
            <article><span className="step-number">02</span><div><strong>El equipo la revisa</strong><p>Tu solicitud queda en revisión por el personal autorizado.</p></div><span className="step-icon" aria-hidden="true">⌕</span></article>
            <article><span className="step-number">03</span><div><strong>Consulta el estado</strong><p>Guarda el radicado para consultar el avance de tu solicitud.</p></div><span className="step-icon" aria-hidden="true">✓</span></article>
          </div>
          <Link className="apply-button process-button" to="/solicitar-cupo"><span className="button-round-arrow" aria-hidden="true">→</span> Comenzar solicitud</Link>
        </div>
      </section>

      <footer className="public-footer"><Brand /><span>Un espacio para estudiar, convivir y crecer.</span><a href="#la-casa">Volver arriba ↑</a></footer>
    </main>
  );
}
