import React, { useEffect, useRef } from 'react';

export default function CursorAndEmbers() {
  const canvasRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia && window.matchMedia('(pointer:fine)').matches;

    // Custom Cursor
    const dot = dotRef.current;
    const ring = ringRef.current;
    let animId;

    if (isFinePointer && !reduceMotion && dot && ring) {
      let mx = 0, my = 0, rx = 0, ry = 0;
      const onMouseMove = (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
      };
      window.addEventListener('mousemove', onMouseMove);

      const loop = () => {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        animId = requestAnimationFrame(loop);
      };
      loop();

      const hoverables = 'a, button, .cd-card, input, .cd-pill, .cd-chip, .cd-cal-day, .cd-date-trigger, .cd-location-card, .cd-contact-card';
      const onMouseOver = (e) => {
        if (e.target.closest && e.target.closest(hoverables)) {
          ring.classList.add('cd-cursor-active');
        }
      };
      const onMouseOut = (e) => {
        if (e.target.closest && e.target.closest(hoverables)) {
          ring.classList.remove('cd-cursor-active');
        }
      };

      document.addEventListener('mouseover', onMouseOver);
      document.addEventListener('mouseout', onMouseOut);

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseover', onMouseOver);
        document.removeEventListener('mouseout', onMouseOut);
        cancelAnimationFrame(animId);
      };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const ambient = [];
    const ambientCount = reduceMotion ? 0 : 22;
    for (let i = 0; i < ambientCount; i++) {
      ambient.push(makeAmbient());
    }

    function makeAmbient() {
      return {
        x: Math.random() * W,
        y: H + Math.random() * H,
        r: 1 + Math.random() * 1.8,
        speed: 0.25 + Math.random() * 0.55,
        drift: (Math.random() - 0.5) * 0.4,
        alpha: 0.15 + Math.random() * 0.35,
        hue: Math.random() > 0.5 ? '212,175,55' : '201,104,61'
      };
    }

    const bursts = [];
    window.__cindreBurst = function(x, y) {
      for (let i = 0; i < 20; i++) {
        bursts.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 2.6,
          vy: -1.2 - Math.random() * 2.2,
          r: 1.4 + Math.random() * 2,
          life: 1,
          decay: 0.012 + Math.random() * 0.014,
          hue: Math.random() > 0.4 ? '212,175,55' : '224,137,90'
        });
      }
    };

    let emberAnimId;
    function tick() {
      ctx.clearRect(0, 0, W, H);
      ambient.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.hue + ',' + p.alpha + ')';
        ctx.shadowColor = 'rgba(' + p.hue + ',0.9)';
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.02;
        b.life -= b.decay;
        if (b.life <= 0) {
          bursts.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + b.hue + ',' + Math.max(b.life, 0) + ')';
        ctx.shadowColor = 'rgba(' + b.hue + ',0.9)';
        ctx.shadowBlur = 8;
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      emberAnimId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(emberAnimId);
    };
  }, []);

  return (
    <>
      <div className="grain-overlay"></div>
      <div className="cd-cursor" id="cdCursor">
        <div className="cd-cursor-dot" id="cdCursorDot" ref={dotRef}></div>
        <div className="cd-cursor-ring" id="cdCursorRing" ref={ringRef}></div>
      </div>
      <canvas id="emberCanvas" ref={canvasRef}></canvas>
    </>
  );
}
