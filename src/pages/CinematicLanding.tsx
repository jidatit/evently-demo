import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './cinematic-landing.css';

const COLORS_HEX = [0xFF5C1A, 0x1AABFF, 0x9B5CFF, 0xFFB830, 0x00E5A0];

const CinematicLanding: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({ v: 0, e: 0, c: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  // Cursor
  useEffect(() => {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: mouse.x, y: mouse.y };
    const glow = { x: mouse.x, y: mouse.y };
    let raf = 0;
    const move = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const tick = () => {
      ring.x += (mouse.x - ring.x) * 0.18;
      ring.y += (mouse.y - ring.y) * 0.18;
      glow.x += (mouse.x - glow.x) * 0.08;
      glow.y += (mouse.y - glow.y) * 0.08;
      if (dotRef.current) dotRef.current.style.transform = `translate(${mouse.x - 3}px, ${mouse.y - 3}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${ring.x - 18}px, ${ring.y - 18}px)`;
      if (glowRef.current) glowRef.current.style.transform = `translate(${glow.x - 150}px, ${glow.y - 150}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', move);
    raf = requestAnimationFrame(tick);
    const over = () => ringRef.current?.classList.add('cursor-ring-hover');
    const out = () => ringRef.current?.classList.remove('cursor-ring-hover');
    document.querySelectorAll('a, button, .cl-card').forEach(el => {
      el.addEventListener('mouseenter', over);
      el.addEventListener('mouseleave', out);
    });
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);

  // Scroll for nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Stats counters via IntersectionObserver
  useEffect(() => {
    if (!statsRef.current) return;
    const targets = { v: 500, e: 2400, c: 12 };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const duration = 1600;
          const start = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const ease = 1 - Math.pow(1 - t, 3);
            setStats({
              v: Math.round(targets.v * ease),
              e: Math.round(targets.e * ease),
              c: Math.round(targets.c * ease),
            });
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('reveal-in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Three.js
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, parent.clientWidth / parent.clientHeight, 0.1, 100);
    camera.position.z = 5;

    // Particles
    const pCount = 240;
    const positions = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      const c = new THREE.Color(COLORS_HEX[Math.floor(Math.random() * COLORS_HEX.length)]);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.55 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Orbs
    const orbSpecs = [
      { color: 0xFF5C1A, size: 1.4, pos: [-3.5, 1, -2], phase: 0 },
      { color: 0x9B5CFF, size: 1.1, pos: [3.5, -1, -3], phase: Math.PI },
      { color: 0x1AABFF, size: 0.9, pos: [0.5, -2.5, -1.5], phase: Math.PI / 2 },
    ];
    const orbs = orbSpecs.map(s => {
      const group = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(s.size, 32, 32),
        new THREE.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.12 })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(s.size * 2.8, 32, 32),
        new THREE.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.035 })
      );
      group.add(core); group.add(halo);
      group.position.set(s.pos[0], s.pos[1], s.pos[2]);
      scene.add(group);
      return { group, base: [...s.pos] as number[], phase: s.phase };
    });

    // Octahedrons
    const shapes: { mesh: THREE.Mesh; baseY: number; offset: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28),
        new THREE.MeshPhongMaterial({ color: COLORS_HEX[i % COLORS_HEX.length], transparent: true, opacity: 0.25, shininess: 120 })
      );
      mesh.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
      scene.add(mesh);
      shapes.push({ mesh, baseY: mesh.position.y, offset: Math.random() * Math.PI * 2 });
    }

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const d1 = new THREE.DirectionalLight(0xFF5C1A, 0.9); d1.position.set(5, 5, 5); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x1AABFF, 0.5); d2.position.set(-5, -3, 3); scene.add(d2);
    const d3 = new THREE.DirectionalLight(0x9B5CFF, 0.3); d3.position.set(0, 5, -4); scene.add(d3);

    const mouse = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouse);

    const resize = () => {
      renderer.setSize(parent.clientWidth, parent.clientHeight, false);
      camera.aspect = parent.clientWidth / parent.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    const start = performance.now();
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      particles.rotation.y = t * 0.04;
      orbs.forEach((o, i) => {
        o.group.position.x = o.base[0] + Math.sin(t * 0.5 + o.phase) * 0.4;
        o.group.position.y = o.base[1] + Math.cos(t * 0.4 + o.phase) * 0.4;
      });
      shapes.forEach(s => {
        s.mesh.rotation.x += 0.003; s.mesh.rotation.y += 0.004;
        s.mesh.position.y = s.baseY + Math.sin(t + s.offset) * 0.15;
      });
      camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.04;
      camera.position.y += (mouse.y * 0.4 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      renderer.dispose();
      pGeo.dispose(); pMat.dispose();
    };
  }, []);

  const vendors = [
    { id: 'v1', name: "Symboll Wedding Photography", cat: 'Photography', icon: '📸', rating: '4.9', reviews: '180', price: '$2,400', accent: 'orange', bg: 'linear-gradient(135deg,#1a0d05,#2d1a08)', large: true },
    { id: 'v2', name: 'DJ Wrex — Synergy Events', cat: 'DJ & Entertainment', icon: '🎧', rating: '5.0', reviews: '36', price: '$800', accent: 'blue', bg: 'linear-gradient(135deg,#040d1a,#081a2d)' },
    { id: 'v3', name: 'Luxe Bites LA', cat: 'Catering', icon: '🍽️', rating: '4.9', reviews: '255', price: '$35/head', accent: 'green', bg: 'linear-gradient(135deg,#0a1a0a,#0d2d0d)' },
    { id: 'v4', name: 'Brickroom LA', cat: 'Venue', icon: '🏛️', rating: '4.9', reviews: '37', price: '$3,200', accent: 'purple', bg: 'linear-gradient(135deg,#100a1a,#1a0d2d)' },
    { id: 'v5', name: 'Fiore Designs LA', cat: 'Floral & Decor', icon: '🌸', rating: '5.0', reviews: '126', price: '$600', accent: 'gold', bg: 'linear-gradient(135deg,#1a0808,#2d0d10)' },
  ];

  const steps = [
    { n: '01', icon: '🔍', color: 'orange', t: 'Search Vendors', d: 'Browse hundreds of verified vendors across Los Angeles. Filter by category, price, rating, and availability in seconds.' },
    { n: '02', icon: '⚖️', color: 'blue', t: 'Compare Options', d: 'View detailed profiles, packages, real reviews, and transparent pricing. No hidden fees, no surprises.' },
    { n: '03', icon: '⚡', color: 'purple', t: 'Book Instantly', d: 'Send a booking request, get accepted, and pay securely through Stripe. Confirmed in minutes, not days.' },
    { n: '04', icon: '🎉', color: 'green', t: 'Manage Your Event', d: 'Track all your bookings from one dashboard. Everything confirmed, paid, and handled so you can celebrate.' },
  ];

  const reviews = [
    { a: '👰', n: 'Jessica M.', e: 'Wedding · Venice Beach', q: 'Booked our entire wedding vendor team through Book\'D in under an hour. Photographer, DJ, florist — all confirmed same day. Absolutely incredible.' },
    { a: '🎉', n: 'Marcus T.', e: 'Birthday Party · Malibu', q: 'My caterer cancelled 3 days before the party. Found a replacement on Book\'D in 4 minutes. The platform literally saved my event.' },
    { a: '📸', n: 'DJ Wrex', e: 'Vendor · DJ & Entertainment', q: 'As a vendor, Book\'D changed everything. I went from chasing clients on Instagram to having confirmed bookings land in my dashboard. Revenue up 40%.' },
    { a: '💼', n: 'Sofia R.', e: 'Corporate Event · Beverly Hills', q: 'Planned our corporate retreat for 200 people using Book\'D. Venue, catering, AV, photography — all from one platform.' },
  ];

  const marqueeItems = ['Photography', 'DJ & Music', 'Catering', 'Jumper Rentals', 'Venues', 'Floral & Decor', 'Bartenders', 'Table & Chair Rentals', 'Photo Booths', 'Videography'];

  return (
    <div className="cl-root">
      <div ref={dotRef} className="cl-cursor-dot" />
      <div ref={ringRef} className="cl-cursor-ring" />
      <div ref={glowRef} className="cl-cursor-glow" />

      <nav className={`cl-nav ${scrolled ? 'cl-nav-scrolled' : ''}`}>
        <a href="#" className="cl-logo">Book<span className="cl-logo-accent">'D</span></a>
        <div className="cl-nav-links">
          <a href="#vendors">Vendors</a>
          <a href="#how">How It Works</a>
          <a href="#join">For Vendors</a>
          <a href="#">Los Angeles</a>
        </div>
        <div className="cl-nav-actions">
          <a href="/auth" className="cl-btn-ghost-sm">Sign In</a>
          <a href="/auth" className="cl-btn-fill-sm">Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="cl-hero">
        <canvas ref={canvasRef} className="cl-canvas" />
        <div className="cl-grid-overlay" />
        <div className="cl-vignette" />
        <div className="cl-hero-content">
          <div className="cl-badge cl-anim-up cl-d2">
            <span className="cl-badge-dot-wrap"><span className="cl-badge-dot" /></span>
            <span className="cl-badge-text">NOW LIVE IN LOS ANGELES · 500+ VENDORS</span>
          </div>
          <h1 className="cl-hero-title cl-anim-up cl-d3">
            <span>Book</span>
            <span className="cl-grad-text">Extraordinary</span>
            <span>Events.</span>
          </h1>
          <p className="cl-hero-sub cl-anim-up cl-d4">
            Connect with elite local vendors for weddings, private parties, birthdays, luxury events, and corporate gatherings — all in one place.
          </p>
          <div className="cl-hero-btns cl-anim-up cl-d5">
            <a href="#vendors" className="cl-btn-primary">Find Vendors →</a>
            <a href="#join" className="cl-btn-ghost">Become a Vendor</a>
          </div>
          <div ref={statsRef} className="cl-stats cl-anim-up cl-d6">
            <div className="cl-stat"><div className="cl-stat-num">{stats.v}<span style={{ color: 'var(--cl-orange)' }}>+</span></div><div className="cl-stat-lbl">Verified Vendors</div></div>
            <div className="cl-stat"><div className="cl-stat-num">{stats.e}<span style={{ color: 'var(--cl-blue)' }}>+</span></div><div className="cl-stat-lbl">Events Booked</div></div>
            <div className="cl-stat"><div className="cl-stat-num">{stats.c}<span style={{ color: 'var(--cl-purple)' }}></span></div><div className="cl-stat-lbl">Cities Served</div></div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="cl-marquee">
        <div className="cl-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((m, i) => (
            <span key={i} className="cl-marquee-item">{m} <span className="cl-marquee-star">✦</span></span>
          ))}
        </div>
      </div>

      {/* VENDORS */}
      <section id="vendors" className="cl-section cl-vendors-section">
        <div className="cl-vendors-bg" />
        <div className="cl-section-head reveal">
          <div className="cl-eyebrow"><span className="cl-eyebrow-line" />Featured Vendors<span className="cl-eyebrow-line" /></div>
          <h2 className="cl-section-title">Elite vendors. <span className="cl-grad-bp">Instant</span> bookings.</h2>
          <p className="cl-section-sub">Every vendor on Book'D is verified, rated, and ready to make your event unforgettable.</p>
        </div>
        <div className="cl-vendor-grid">
          {vendors.map((v, i) => (
            <article
              key={v.id}
              className={`cl-card cl-vendor-card reveal cl-d${(i % 3) + 1} ${v.large ? 'cl-vendor-large' : ''}`}
              data-accent={v.accent}
            >
              <div className="cl-card-glow" />
              <div className="cl-vendor-img" style={{ background: v.bg, height: v.large ? 240 : 180 }}>
                <span className="cl-vendor-emoji">{v.icon}</span>
                <div className="cl-vendor-img-fade" />
              </div>
              <div className="cl-vendor-body">
                <div className={`cl-vendor-cat cl-acc-${v.accent}`}>{v.cat}</div>
                <h3 className="cl-vendor-name" style={{ fontSize: v.large ? 17 : 14 }}>{v.name}</h3>
                <div className="cl-vendor-rating">
                  <span>⭐ <strong>{v.rating}</strong> <span className="cl-muted">· {v.reviews} reviews</span></span>
                  <span className="cl-avail"><span className="cl-avail-dot" /> Available</span>
                </div>
                <div className="cl-vendor-foot">
                  <span className="cl-vendor-price">From <strong>{v.price}</strong></span>
                  <button
                    className={`cl-book-btn ${requested[v.id] ? 'cl-book-done' : ''}`}
                    onClick={() => setRequested(p => ({ ...p, [v.id]: true }))}
                  >
                    {requested[v.id] ? '✓ Requested' : 'Book Now'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="cl-section cl-how-section">
        <div className="cl-how-bg" />
        <div className="cl-section-head reveal">
          <div className="cl-eyebrow"><span className="cl-eyebrow-line" />How It Works<span className="cl-eyebrow-line" /></div>
          <h2 className="cl-section-title">From search to <span className="cl-grad-bp">celebration</span> in minutes.</h2>
        </div>
        <div className="cl-steps-grid reveal">
          {steps.map(s => (
            <div key={s.n} className={`cl-step cl-acc-${s.color}`}>
              <div className="cl-step-num">{s.n}</div>
              <div className="cl-step-icon">{s.icon}</div>
              <h3 className="cl-step-title">{s.t}</h3>
              <p className="cl-step-desc">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="cl-section cl-tests-section">
        <div className="cl-section-head reveal">
          <div className="cl-eyebrow"><span className="cl-eyebrow-line" />What People Say<span className="cl-eyebrow-line" /></div>
          <h2 className="cl-section-title">Events people <span className="cl-grad-bp">remember</span>.</h2>
        </div>
        <div className="cl-tests-ticker">
          <div className="cl-tests-track">
            {[...reviews, ...reviews].map((r, i) => (
              <div key={i} className="cl-tc cl-card">
                <div className="cl-tc-q"><span className="cl-tc-mark">"</span>{r.q}</div>
                <div className="cl-tc-author">
                  <span className="cl-tc-avatar">{r.a}</span>
                  <div className="cl-tc-info">
                    <div className="cl-tc-name">{r.n}</div>
                    <div className="cl-tc-event">{r.e}</div>
                  </div>
                  <span className="cl-tc-stars">★★★★★</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN */}
      <section id="join" className="cl-section cl-join-section">
        <div className="cl-join-grid">
          <div className="reveal">
            <div className="cl-eyebrow cl-eyebrow-left">For Vendors</div>
            <h2 className="cl-join-title">Turn your audience into <span className="cl-grad-op">revenue</span>.</h2>
            <p className="cl-join-sub">Join Book'D as a founding vendor in Los Angeles. Get a premium profile, QR code for real-world promotion, and a direct booking link for your social bio.</p>
            <div className="cl-perks">
              {[
                ['🔗', 'Your own profile with a direct booking link'],
                ['📱', 'Downloadable QR code for events and expos'],
                ['💳', 'Automatic payouts via Stripe — no chasing payments'],
                ['🏆', 'Performance tiers — earn featured placement and lower fees'],
                ['📊', 'Analytics dashboard to track views and revenue'],
              ].map(([i, t]) => (
                <div key={t} className="cl-perk">
                  <span className="cl-perk-icon">{i}</span>
                  <span className="cl-perk-text">{t}</span>
                </div>
              ))}
            </div>
            <div className="cl-hero-btns" style={{ justifyContent: 'flex-start', marginTop: 32 }}>
              <a href="/auth" className="cl-btn-primary">Apply as a Vendor</a>
              <a href="#how" className="cl-btn-ghost">Learn More</a>
            </div>
          </div>
          <div className="reveal cl-d2 cl-dash">
            <div className="cl-dash-bar">
              <span className="cl-dot-r" /><span className="cl-dot-y" /><span className="cl-dot-g" />
              <span className="cl-dash-label">Vendor Dashboard — Book'D</span>
            </div>
            <div className="cl-dash-body">
              <div className="cl-dash-stats">
                <div className="cl-dash-stat"><div className="cl-ds-num" style={{ color: 'var(--cl-green)' }}>$18.2K</div><div className="cl-ds-lbl">This Month</div></div>
                <div className="cl-dash-stat"><div className="cl-ds-num" style={{ color: 'var(--cl-orange)' }}>12</div><div className="cl-ds-lbl">Bookings</div></div>
                <div className="cl-dash-stat"><div className="cl-ds-num" style={{ color: 'var(--cl-blue)' }}>4.9★</div><div className="cl-ds-lbl">Rating</div></div>
              </div>
              <div className="cl-dash-list">
                <div className="cl-dash-row"><div><div className="cl-dr-name">Jessica Martinez</div><div className="cl-dr-meta">Wedding · Jun 14 · Venice Beach</div></div><span className="cl-pill cl-pill-orange">New Request</span></div>
                <div className="cl-dash-row"><div><div className="cl-dr-name">Kevin Chen</div><div className="cl-dr-meta">Corporate · May 30 · Beverly Hills</div></div><span className="cl-pill cl-pill-green">Paid ✓</span></div>
                <div className="cl-dash-row"><div><div className="cl-dr-name">Sofia Andrade</div><div className="cl-dr-meta">Birthday · Jul 4 · Downtown LA</div></div><span className="cl-pill cl-pill-blue">Pending</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cl-final">
        <div className="cl-final-bg" />
        <div className="reveal cl-final-content">
          <h2 className="cl-final-title">
            <span>Ready to be</span>
            <span className="cl-grad-text">Book'D?</span>
          </h2>
          <p className="cl-final-sub">Los Angeles vendors are ready and waiting. Find the right ones and confirm your event in minutes, not days.</p>
          <div className="cl-hero-btns">
            <a href="#vendors" className="cl-btn-primary">Find Vendors Now</a>
            <a href="/auth" className="cl-btn-ghost">Join as a Vendor</a>
          </div>
        </div>
      </section>

      <footer className="cl-footer">
        <a href="#" className="cl-logo cl-footer-logo">Book<span className="cl-logo-accent">'D</span></a>
        <div className="cl-footer-links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="#join">For Vendors</a>
          <a href="/support">Support</a>
          <a href="#">Los Angeles</a>
        </div>
        <div className="cl-footer-copy">© 2026 Book'D · All rights reserved.</div>
      </footer>
    </div>
  );
};

export default CinematicLanding;
