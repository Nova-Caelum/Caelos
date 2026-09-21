/* Nova Caelum — orbital loading mark v6. No dependencies. */
(function (global) {
  'use strict';
  const TAU = Math.PI * 2;
  const DURATION = 12;
  const NS = 'http://www.w3.org/2000/svg';
  // a, eccentricity, inclination, roll, periapsis, phase, length, width, laps
  const orbits = [
    [65, .23, .72, -.36, .35, .10, 2.26, 15.5, 3],
    [55, .31, .55, -.80, 2.40, 2.04, 1.42, 7.8, 4],
    [69, .19, .75, .25, 4.10, 3.42, 1.86, 11.2, 3],
    [52, .26, -.35, .12, 1.10, 4.89, 1.38, 6.0, 2],
    [90, .17, .40, -.48, 3.20, 5.70, 1.02, 4.5, 2]
  ];
  function point(o, u) {
    const [a,e,tilt,roll,peri] = o;
    // Closed, gently nonplanar ellipses with the orb at their common focus.
    const r = a * (1 - e * e) / (1 + e * Math.cos(u));
    const v = u + peri;
    const x = r * Math.cos(v);
    const y = r * Math.sin(v);
    const warp = a * .055 * Math.sin(2*u + peri);
    const yy = y * Math.cos(tilt) - warp * Math.sin(tilt);
    const z = y * Math.sin(tilt) + warp * Math.cos(tilt);
    const xx = x * Math.cos(roll) - yy * Math.sin(roll);
    const ry = x * Math.sin(roll) + yy * Math.cos(roll);
    const perspective = 200 / (200 - z);
    return { x:120+xx*perspective, y:120+ry*perspective, z, scale:perspective };
  }
  function ray(o, seconds, samples=64, weight=1) {
    const m = o[5] + TAU * o[8] * seconds / DURATION;
    // Periodic speed modulation; derivative stays positive everywhere.
    const head = m + .20 * Math.sin(m-o[4]);
    const pts = [], left = [], right = [];
    for(let i=0;i<=samples;i++) {
      const s=i/samples;
      const u=head-o[6]+o[6]*s;
      const p=point(o,u), a=point(o,u-.001), b=point(o,u+.001);
      const dx=b.x-a.x, dy=b.y-a.y, norm=Math.hypot(dx,dy);
      // A curved, filled ribbon: thin tail, fuller leading shoulder, pointed tip.
      const taper=Math.pow(Math.sin(Math.PI*s),.72) * (.24+.76*s);
      const width=weight*o[7]*taper*p.scale*(.84+.16*Math.cos(u-o[4]));
      const nx=-dy/norm*width/2, ny=dx/norm*width/2;
      left.push([p.x+nx,p.y+ny]); right.push([p.x-nx,p.y-ny]);
      pts.push(p);
    }
    const outline=left.concat(right.reverse());
    const d=outline.map((p,i)=>(i?'L':'M')+p[0].toFixed(3)+','+p[1].toFixed(3)).join('')+'Z';
    return {d,points:pts,outline,depth:pts.reduce((s,p)=>s+p.z,0)/pts.length};
  }
  function frame(seconds,samples=64,weight=1) {
    const t=((seconds%DURATION)+DURATION)%DURATION;
    return orbits.map((o,id)=>({id,...ray(o,t,samples,weight)}));
  }
  function svgMarkup(seconds=0) {
    const rays=frame(seconds);
    return '<svg xmlns="'+NS+'" viewBox="0 0 240 240" fill="currentColor" role="img" aria-label="Loading" style="display:block;width:100%;height:100%;overflow:visible">'+
      rays.map(r=>'<path data-ray="'+r.id+'" d="'+r.d+'"/>').join('')+
      '<circle cx="120" cy="120" r="18.7"/></svg>';
  }
  function mount(host,{autoplay=true}={}) {
    host.innerHTML=svgMarkup();
    const svg=host.querySelector('svg');
    const paths=[...svg.querySelectorAll('path')];
    const orb=svg.querySelector('circle');
    let weight=1;
    const reduced=global.matchMedia('(prefers-reduced-motion: reduce)');
    let running=autoplay, elapsed=0, last=null, raf=0, disposed=false;
    function render(seconds) {
      elapsed=seconds;
      frame(seconds,64,weight).forEach(r=>paths[r.id].setAttribute('d',r.d));
    }
    function tick(now) {
      raf=0;
      if(disposed || !running || reduced.matches || document.hidden) {last=null;return;}
      if(last!==null) elapsed+=(now-last)/1000;
      last=now; render(elapsed); raf=requestAnimationFrame(tick);
    }
    function schedule() {
      cancelAnimationFrame(raf); raf=0;last=null;
      if(running&&!reduced.matches&&!document.hidden&&!disposed)raf=requestAnimationFrame(tick);
    }
    function resize(){
      const size=host.getBoundingClientRect().width||240;
      weight=Math.min(1.7,Math.max(1,Math.pow(100/size,.45)));
      orb.setAttribute('r',String(Math.max(18.7,734.4/size)));
      render(elapsed);
    }
    const observer=new ResizeObserver(resize);
    observer.observe(host);resize();
    reduced.addEventListener('change',schedule);
    document.addEventListener('visibilitychange',schedule);
    schedule();
    return {
      render,
      play(){running=true;schedule();},
      pause(){running=false;schedule();},
      destroy(){disposed=true;observer.disconnect();cancelAnimationFrame(raf);reduced.removeEventListener('change',schedule);document.removeEventListener('visibilitychange',schedule);host.innerHTML='';},
      get time(){return elapsed;}
    };
  }
  global.NovaLoader={duration:DURATION,frame,svgMarkup,mount};
})(typeof window !== 'undefined' ? window : globalThis);
