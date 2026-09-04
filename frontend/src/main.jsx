import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, ArrowRight, BarChart3, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Database, Cloud, CreditCard,
  Code2, Download, ExternalLink, Eye, FileText, FolderKanban, Globe2, Heart,
  Image as ImageIcon, Instagram, LayoutDashboard, Linkedin, Loader2, LogOut, Mail,
  Menu, MessageSquare, Pencil, Plus, RefreshCw, Save, Search, Settings, Sparkles, Sun, Moon, Clock,
  Star, Trash2, Upload, Users, WalletCards, X, Zap, Palette, ShieldCheck, LockKeyhole, History, Bell, UserRoundCheck, Maximize2, Minimize2, Keyboard, Terminal, Play, Square, Minus, Plus as PlusIcon
} from 'lucide-react';
import { api } from './api';
import './styles.css';

const ASSET = (name) => `/assets/${name}`;
const GithubIcon = ({size=18}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .6a11.4 11.4 0 0 0-3.6 22.2c.57.1.78-.25.78-.55v-2.13c-3.18.69-3.85-1.34-3.85-1.34-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.24.73-1.52-2.54-.29-5.21-1.27-5.21-5.66 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.8 1.18 1.83 1.18 3.08 0 4.4-2.67 5.36-5.22 5.64.41.35.78 1.05.78 2.12v3.14c0 .3.21.66.79.55A11.4 11.4 0 0 0 12 .6Z"/></svg>;
const normalizeImage = (url) => (!url || url.includes('/images/photoweb.jpg')) ? ASSET('photoweb.png') : url;

const DEFAULT_THEME = { mode:'dark', primary:'#6d5dfc', secondary:'#08b7d4', accent:'#f04f9d', cardBackground:'#17122f', cardBorder:'#ffffff', heading:'#f8f7ff', body:'#a9a5c0' };
const THEME_PRESETS = {
  Midnight:{mode:'dark',primary:'#6d5dfc',secondary:'#08b7d4',accent:'#f04f9d',cardBackground:'#17122f',cardBorder:'#ffffff',heading:'#f8f7ff',body:'#a9a5c0'},
  Ocean:{mode:'dark',primary:'#1677ff',secondary:'#06b6d4',accent:'#22d3ee',cardBackground:'#0d1b2a',cardBorder:'#5ee7ff',heading:'#f4fbff',body:'#a8c5d8'},
  Aurora:{mode:'dark',primary:'#7c3aed',secondary:'#10b981',accent:'#ec4899',cardBackground:'#141526',cardBorder:'#8bffdc',heading:'#f7f5ff',body:'#b5b2c8'},
  Sunset:{mode:'dark',primary:'#f97316',secondary:'#ef4444',accent:'#ec4899',cardBackground:'#24131a',cardBorder:'#ff9b76',heading:'#fff8f4',body:'#d2b5ae'},
  Emerald:{mode:'dark',primary:'#10b981',secondary:'#14b8a6',accent:'#84cc16',cardBackground:'#071a16',cardBorder:'#64f5c1',heading:'#f2fff9',body:'#a6c9bd'},
  Amethyst:{mode:'dark',primary:'#a855f7',secondary:'#6366f1',accent:'#e879f9',cardBackground:'#160e28',cardBorder:'#d8b4fe',heading:'#fbf7ff',body:'#c1b4d7'},
  Cyber:{mode:'dark',primary:'#00f0ff',secondary:'#7c3aed',accent:'#ff2bd6',cardBackground:'#080b18',cardBorder:'#00f0ff',heading:'#f5ffff',body:'#9db7c7'},
  DeepSpace:{mode:'dark',primary:'#38bdf8',secondary:'#6366f1',accent:'#c084fc',cardBackground:'#070b17',cardBorder:'#7dd3fc',heading:'#f4f8ff',body:'#9aa8c0'},
  RoyalGold:{mode:'light',primary:'#a87518',secondary:'#d4a72c',accent:'#8f5b12',cardBackground:'#fffdf7',cardBorder:'#d8bd74',heading:'#24190b',body:'#6d5b3e'},
  Pearl:{mode:'light',primary:'#4f46e5',secondary:'#0891b2',accent:'#db2777',cardBackground:'#ffffff',cardBorder:'#d8ddea',heading:'#182033',body:'#667085'},
  Sakura:{mode:'light',primary:'#e11d74',secondary:'#8b5cf6',accent:'#f59e0b',cardBackground:'#fffafd',cardBorder:'#f2c7df',heading:'#32172a',body:'#806276'},
  Mint:{mode:'light',primary:'#0f766e',secondary:'#14b8a6',accent:'#65a30d',cardBackground:'#f8fffc',cardBorder:'#b8ddd6',heading:'#102a28',body:'#5f7773'}
};
function applyTheme(theme={}){
  const t={...DEFAULT_THEME,...theme};
  const root=document.documentElement;
  root.dataset.theme=t.mode==='light'?'light':'dark';
  root.style.setProperty('--theme-primary',t.primary);
  root.style.setProperty('--theme-secondary',t.secondary);
  root.style.setProperty('--theme-accent',t.accent);
  root.style.setProperty('--theme-card-bg',t.cardBackground);
  root.style.setProperty('--theme-card-border',t.cardBorder);
  root.style.setProperty('--theme-heading',t.heading);
  root.style.setProperty('--theme-body',t.body);
  // Derive the rest of the site's surfaces from the selected mode + palette.
  // This prevents the old hard-coded light/dark CSS from overriding presets.
  if(t.mode==='light') {
    root.style.setProperty('--theme-page-bg', `color-mix(in srgb, ${t.cardBackground} 10%, #ffffff)`);
    root.style.setProperty('--theme-panel-bg', `color-mix(in srgb, ${t.cardBackground} 92%, #ffffff)`);
    root.style.setProperty('--theme-panel-2', `color-mix(in srgb, ${t.cardBackground} 72%, #ffffff)`);
    root.style.setProperty('--theme-on-panel', t.heading);
    root.style.setProperty('--theme-muted', t.body);
  } else {
    root.style.setProperty('--theme-page-bg', `color-mix(in srgb, ${t.cardBackground} 78%, #05040d)`);
    root.style.setProperty('--theme-panel-bg', `color-mix(in srgb, ${t.cardBackground} 94%, ${t.primary})`);
    root.style.setProperty('--theme-panel-2', `color-mix(in srgb, ${t.cardBackground} 82%, ${t.secondary})`);
    root.style.setProperty('--theme-on-panel', t.heading);
    root.style.setProperty('--theme-muted', t.body);
  }
  root.style.setProperty('--blue',t.primary); root.style.setProperty('--cyan',t.secondary); root.style.setProperty('--pink',t.accent); root.style.setProperty('--purple',t.primary);
  return t;
}

function toggleThemePalette(currentMode){
  const root=document.documentElement;
  const read=(name,fallback)=>root.style.getPropertyValue(name).trim()||fallback;
  const nextMode=currentMode==='dark'?'light':'dark';
  const next={
    mode:nextMode,
    primary:read('--theme-primary',DEFAULT_THEME.primary),
    secondary:read('--theme-secondary',DEFAULT_THEME.secondary),
    accent:read('--theme-accent',DEFAULT_THEME.accent),
    cardBackground:read('--theme-card-bg',DEFAULT_THEME.cardBackground),
    cardBorder:read('--theme-card-border',DEFAULT_THEME.cardBorder),
    heading:read('--theme-heading',DEFAULT_THEME.heading),
    body:read('--theme-body',DEFAULT_THEME.body)
  };
  if(nextMode==='light' && /^#(0|1|2)[0-9a-f]{5}$/i.test(next.cardBackground)){
    next.cardBackground='#fffdf7'; next.cardBorder='#d8ddea'; next.heading='#182033'; next.body='#667085';
  }
  if(nextMode==='dark' && /^#(f|e|d|c)[0-9a-f]{5}$/i.test(next.cardBackground)){
    next.cardBackground='#17122f'; next.cardBorder='#ffffff'; next.heading='#f8f7ff'; next.body='#a9a5c0';
  }
  applyTheme(next);
  try{localStorage.setItem('portfolio-theme',JSON.stringify(next));localStorage.setItem('portfolio-theme-mode',nextMode)}catch{}
  return nextMode;
}

const fallbackContent = {
  profileImage: ASSET('photoweb.png'),
  hero: { name: 'Ritik Verma', typing: 'B.Tech CSE Student · Developer', tagline: 'Learning by building things that actually work.' },
  education: [{ title: 'B.Tech in Computer Science Engineering', institute: 'PSIT Kanpur', status: 'Computer Science student' }],
  counters: { problemsSolved: 500, problemsLabel: 'Problems Solved', yearsLabel: 'Years Coding', projectsLabel: 'Projects Completed', hoursLabel: 'Hours on Website', startDate: '2024-05-01' },
  skills: ['C', 'C++', 'Data Structures', 'Problem Solving', 'Git'],
  progressSkills: [{ name: 'C', percentage: 100 }, { name: 'C++', percentage: 80 }, { name: 'Data Structures', percentage: 75 }],
  about: { title: 'About me', text: "I'm a B.Tech Computer Science student who enjoys writing code, figuring out how things work, and turning small ideas into working projects. Right now, I'm spending most of my time with C, C++, data structures, and backend development." },
  contact: { title: 'Send me a message', namePlaceholder: 'Your Name', emailPlaceholder: 'Your Email', messagePlaceholder: 'Your Message', buttonText: 'Send Message' },
  donation: { title: 'Support a project 💙', goal: 10000, donorNamePlaceholder: 'Your Name', donorEmailPlaceholder: 'Your Email', customAmountPlaceholder: 'Enter custom amount', buttonText: 'Donate Now', leaderboardTitle: '🏆 Supporters', milestoneTitle: '🎯 Goal' },
  thankYou: { title: 'Thanks for stopping by' }
};

const navItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/compiler', label: 'Compiler', icon: Code2 },
  { to: '/gallery', label: 'Gallery', icon: ImageIcon },
  { to: '/attendance', label: 'Attendance', icon: CalendarDays },
  { to: '/resume', label: 'Resume', icon: FileText },
  { to: '/contact', label: 'Contact', icon: MessageSquare },
];

function AppShell({ children }) {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('portfolio-theme-mode') || 'dark'; } catch { return 'dark'; } });
  const location = useLocation();
  useEffect(() => { try { localStorage.setItem('portfolio-theme-mode', theme); } catch {} }, [theme]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    api.get('/api/theme').then(d => {
      if(d?.theme){
        const t=applyTheme(d.theme);
        setTheme(t.mode);
        try { localStorage.setItem('portfolio-theme', JSON.stringify(t)); } catch {}
      }
    }).catch(()=>{ applyTheme({mode:theme}); });
  }, []);
  const toggleTheme = () => setTheme(toggleThemePalette(theme));
  useEffect(() => {
    document.body.classList.toggle('drawer-open', menu);
    return () => document.body.classList.remove('drawer-open');
  }, [menu]);
  useEffect(() => setMenu(false), [location.pathname]);
  useEffect(() => {
    // Lifetime visitor deduplication is handled by the server.
    api.send('/api/analytics/page','POST',{path:location.pathname}).catch(()=>{});
  }, [location.pathname]);
  useEffect(() => {
    const cleanups = [];
    const addMagnetic = (el) => {
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / r.width;
        const y = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.setProperty('--mx', `${x * 8}px`);
        el.style.setProperty('--my', `${y * 7}px`);
      };
      const leave = () => { el.style.setProperty('--mx','0px'); el.style.setProperty('--my','0px'); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
      cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
    };
    const addTilt = (el) => {
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--tilt-x', `${(-y * 4.5).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(x * 4.5).toFixed(2)}deg`);
        el.style.setProperty('--spot-x', `${((x + .5) * 100).toFixed(1)}%`);
        el.style.setProperty('--spot-y', `${((y + .5) * 100).toFixed(1)}%`);
      };
      const leave = () => { el.style.setProperty('--tilt-x','0deg'); el.style.setProperty('--tilt-y','0deg'); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
      cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
    };
    document.querySelectorAll('.magnetic').forEach(addMagnetic);
    document.querySelectorAll('.tilt-card').forEach(addTilt);
    return () => cleanups.forEach(fn => fn());
  }, [location.pathname]);
  return <div className="app-shell">
    <div className="ambient ambient-a" /><div className="ambient ambient-b" /><div className="grid-bg" />
    <header className={`site-topbar glass ${scrolled ? 'is-scrolled' : ''}`}>
      <NavLink to="/" className="brand" aria-label="Ritik Verma home">
        <span className="brand-image"><img src={ASSET('main.png')} alt="Ritik Verma" /></span>
        <span><strong>Ritik Verma</strong><small>Developer · Student</small></span>
      </NavLink>
      <nav className="desktop-nav">{navItems.map(({ to, label }) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>
      <button className={`theme-toggle ${theme}`} onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}><span className="theme-toggle-track"><span className="theme-toggle-thumb">{theme === 'dark' ? <Moon size={15}/> : <Sun size={15}/>}</span></span><span className="theme-toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span></button>
      <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu size={22}/></button>
    </header>
    <AnimatePresence>{menu && <>
      <motion.div className="drawer-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setMenu(false)} />
      <motion.aside className="drawer glass" initial={{x:380}} animate={{x:0}} exit={{x:380}} transition={{type:'spring', stiffness:280, damping:28}}>
        <div className="drawer-head"><div><strong>Explore</strong><span>Ritik Verma</span></div><button className="icon-btn" onClick={() => setMenu(false)}><X/></button></div>
        <div className="drawer-links">{navItems.map(({to,label,icon:Icon}) => <NavLink key={to} to={to}><Icon size={19}/><span>{label}</span><ChevronRight size={16}/></NavLink>)}</div>
        <button className="drawer-theme" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>} {theme === 'dark' ? 'Light theme' : 'Dark theme'}</button>
      </motion.aside>
    </>}</AnimatePresence>
    <main>{children}</main>
    <footer className="site-footer"><div><strong>Ritik Verma</strong><span>Computer Science Student · Developer</span></div><span>© {new Date().getFullYear()} Ritik Verma. All rights reserved.</span></footer>
  </div>
}

function Page({ eyebrow, title, subtitle, children, narrow=false }) {
  return <motion.section className={`page ${narrow ? 'page-narrow' : ''}`} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.45}}>
    <div className="page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    {children}
  </motion.section>
}

function usePortfolioData() {
  const [content, setContent] = useState(fallbackContent);
  const [projects, setProjects] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [donationStats, setDonationStats] = useState({totalAmount:0,totalDonors:0,donations:[]});
  const [rating, setRating] = useState({average:0,count:0,hasRated:false});
  const [visitors, setVisitors] = useState(0);
  useEffect(() => {
    Promise.allSettled([
      api.get('/api/portfolio-content'), api.get('/api/projects'), api.get('/api/gallery'), api.get('/donation-stats'), api.get('/api/portfolio-rating'), api.get('/visitor-count')
    ]).then(([c,p,g,d,r,v]) => {
      if(c.status==='fulfilled') setContent({...fallbackContent, ...c.value.content});
      if(p.status==='fulfilled') setProjects(p.value || []);
      if(g.status==='fulfilled') setGallery(g.value.images || []);
      if(d.status==='fulfilled') setDonationStats(d.value);
      if(r.status==='fulfilled') setRating(r.value);
      if(v.status==='fulfilled') setVisitors(v.value.count || 0);
    });
  }, []);
  return {content,projects,gallery,donationStats,rating,setRating,visitors};
}


function AnimatedNumber({value, duration=900}){
  const ref=React.useRef(null);
  const target=Number(value)||0;
  const [display,setDisplay]=useState(0);
  useEffect(()=>{
    let raf=0, started=false;
    const el=ref.current;
    const start=()=>{
      if(started) return; started=true;
      const from=0, t0=performance.now();
      const tick=(now)=>{
        const p=Math.min(1,(now-t0)/duration);
        const eased=1-Math.pow(1-p,4);
        const current=from+(target-from)*eased;
        setDisplay(current);
        if(p<1) raf=requestAnimationFrame(tick); else setDisplay(target);
      };
      raf=requestAnimationFrame(tick);
    };
    if(!el) return;
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting){start();io.disconnect();}},{threshold:.45});
      io.observe(el); return ()=>{io.disconnect();cancelAnimationFrame(raf)};
    }
    start(); return ()=>cancelAnimationFrame(raf);
  },[target,duration]);
  const formatted=Number.isInteger(target)?Math.round(display).toLocaleString('en-IN'):display.toFixed(1);
  return <strong ref={ref}>{formatted}</strong>;
}

const revealUp = { hidden: { opacity: 0, y: 45, scale: 0.985 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };
const revealItem = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };

function RevealSection({children, className=''}) {
  return <motion.section className={className} variants={revealUp} initial="hidden" whileInView="visible" viewport={{once:true, amount:0.16}}>{children}</motion.section>;
}

function Home() {
  const {content,projects,gallery,donationStats,rating,setRating,visitors} = usePortfolioData();
  const [feedback,setFeedback]=useState(''); const [chosenRating,setChosenRating]=useState(0); const [ratingBusy,setRatingBusy]=useState(false); const [toast,setToast]=useState('');
  const [yearNow,setYearNow]=useState(0); const [roleIndex,setRoleIndex]=useState(0); const [scrollProgress,setScrollProgress]=useState(0); const [mouse,setMouse]=useState({x:0,y:0}); const [selectedProject,setSelectedProject]=useState(null);
  const roles=(content.hero?.roles||['Developer','Problem Solver','Builder','Lifelong Learner']).filter(Boolean);
  const safeRoles=roles.length?roles:['Developer'];
  useEffect(()=>{const start=new Date(content.counters?.startDate||'2024-05-01'); setYearNow(Math.max(1,Math.floor((Date.now()-start.getTime())/31557600000*10)/10));},[content.counters?.startDate]);
  useEffect(()=>{const timer=setInterval(()=>setRoleIndex(i=>(i+1)%safeRoles.length),2600);return()=>clearInterval(timer)},[]);
  useEffect(()=>{const onScroll=()=>{const max=document.documentElement.scrollHeight-window.innerHeight;setScrollProgress(max>0?window.scrollY/max:0)};const onMove=e=>{setMouse({x:(e.clientX/window.innerWidth-.5)*2,y:(e.clientY/window.innerHeight-.5)*2})};window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('mousemove',onMove,{passive:true});onScroll();return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('mousemove',onMove)}},[]);
  const progress = Math.min(100, Math.round((donationStats.totalAmount/(content.donation?.goal||10000))*100));
  async function submitRating(){if(!chosenRating)return; setRatingBusy(true); try{await api.send('/api/portfolio-rating','POST',{rating:chosenRating,feedback}); const next=await api.get('/api/portfolio-rating'); setRating(next); setToast('Thanks — I appreciate the feedback!'); setFeedback('');}catch(e){setToast(e.message)} finally{setRatingBusy(false);}}
  return <>
    <div className="scroll-progress"><span style={{transform:`scaleX(${scrollProgress})`}} /></div>
    <section className="hero container-wide" style={{'--mx':mouse.x,'--my':mouse.y}}>
      <motion.div className="hero-cursor-glow" animate={{x:mouse.x*35,y:mouse.y*35}} transition={{type:'spring',stiffness:80,damping:25}} />
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={14}/> Open to learning and building</span>
        <h1>Hello,<br></br>My name is<br></br><span>RITIK VERMA.</span></h1>
        <p className="hero-lead"><span className="hero-role"><span className="hero-role-stage"><span className="hero-role-sizer" aria-hidden="true">{safeRoles.reduce((longest, role) => role.length > longest.length ? role : longest, '')}</span><AnimatePresence initial={false} mode="wait"><motion.span key={safeRoles[roleIndex]} className="hero-role-word" initial={{opacity:0,filter:'blur(3px)',y:2}} animate={{opacity:1,filter:'blur(0px)',y:0}} exit={{opacity:0,filter:'blur(3px)',y:-2}} transition={{duration:.5,ease:[.22,1,.36,1]}}>{safeRoles[roleIndex]}</motion.span></AnimatePresence></span><span className="hero-role-cursor" aria-hidden="true" /></span><span className="hero-dot"> · </span>{content.hero?.tagline}</p>
        <div className="hero-actions"><NavLink className="btn btn-primary magnetic" to="/projects">Explore projects <ArrowRight size={17}/></NavLink><NavLink className="btn btn-ghost magnetic" to="/contact">Start a conversation <Mail size={17}/></NavLink><NavLink className="text-link magnetic" to="/resume">View resume <ExternalLink size={15}/></NavLink></div>
        <div className="chip-row"><span>React</span><span>Node.js</span><span>C & C++</span><span>Still learning</span></div>
      </div>
      <div className="hero-art">
        <motion.div className="orbit" animate={{rotate:360}} transition={{duration:22,repeat:Infinity,ease:'linear'}} />
        <motion.div className="portrait-wrap" style={{'--parallax-x':`${mouse.x*10}px`,'--parallax-y':`${mouse.y*8}px`}}><div className="portrait-card"><img alt={content.hero?.name || 'Ritik Verma'} src={normalizeImage(content.profileImage)} onError={(e)=>e.currentTarget.src=ASSET('photoweb.png')} /><div className="portrait-label"><strong>{content.hero?.name || 'Ritik Verma'}</strong><span>{content.hero?.typing}</span></div></div></motion.div>
      </div>
    </section>

    <RevealSection className="section container-wide"><div className="section-head"><div><span className="eyebrow">A little about how I work</span><h2>Learn. Build. Get Better.</h2></div><p>I prefer simple, useful software. I learn by building, fixing what breaks, and trying again.</p></div>
      <div className="feature-grid">{[
        ['01','Solving problems','Breaking a problem down until the solution starts to make sense.', Code2],
        ['02','Building projects','Taking an idea from a rough start to something you can actually use.', Zap],
        ['03','Still learning','Trying new tools, making mistakes, and getting a little better with each project.', Activity]
      ].map(([n,t,d,Icon],i)=><motion.article initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.18}} transition={{duration:.55,delay:i*.09,ease:[.22,1,.36,1]}} whileHover={{y:-7}} className="feature-card tilt-card" key={t}><div className={`feature-icon gradient-${i}`}><Icon size={20}/></div><span className="feature-no">{n}</span><h3>{t}</h3><p>{d}</p></motion.article>)}</div>
    </RevealSection>

    <RevealSection className="section container-wide"><div className="stat-strip">{[
      ['Visitors', visitors], [content.counters?.problemsLabel || 'Problems Solved', content.counters?.problemsSolved || 500], [content.counters?.projectsLabel || 'Projects Completed', projects.length], [content.counters?.yearsLabel || 'Years Coding', yearNow]
    ].map(([label,value])=><div className="mini-stat" key={label}>{typeof value==='number'?<AnimatedNumber value={value}/>:<strong>{value}</strong>}<span>{label}</span></div>)}</div></RevealSection>

    <RevealSection className="section container-wide split-section"><div><span className="eyebrow">About</span><h2>{content.about?.title || 'About me'}</h2><p>{content.about?.text}</p><div className="pill-list">{(content.skills||[]).map(s=><span key={s}>{s}</span>)}</div></div><div className="glass info-card"><div className="info-row"><BookOpen size={19}/><div><strong>Education</strong><span>{content.education?.[0]?.title}</span><small>{content.education?.[0]?.institute} · {content.education?.[0]?.status}</small></div></div><div className="progress-list">{(content.progressSkills||[]).map(s=><div key={s.name}><div><span>{s.name}</span><b>{s.percentage}%</b></div><div className="progress"><span style={{width:`${s.percentage}%`}} /></div></div>)}</div></div></RevealSection>

    <RevealSection className="section container-wide"><div className="section-head"><div><span className="eyebrow">Featured work</span><h2>Selected projects</h2></div><NavLink className="text-link" to="/projects">View all <ArrowRight size={15}/></NavLink></div><div className="project-grid">{projects.slice(0,4).map(p=><ProjectCard key={p._id} project={p} onOpen={setSelectedProject} tilt />)}</div></RevealSection>

    <RevealSection className="section container-wide"><div className="section-head"><div><span className="eyebrow">Visual archive</span><h2>Moments & work</h2></div><NavLink className="text-link" to="/gallery">Open gallery <ArrowRight size={15}/></NavLink></div><div className="gallery-grid">{gallery.filter(g=>g.featured).slice(0,6).map((g,i)=><motion.div className={`gallery-tile tile-${i%3} tilt-card`} key={g._id} initial={{opacity:0,y:25}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.15}} transition={{duration:.55,delay:i*.07,ease:[.22,1,.36,1]}} whileHover={{scale:1.02}}><img src={g.imageUrl} /><div><strong>{g.title}</strong><span>{g.description}</span></div></motion.div>)}</div></RevealSection>

    <RevealSection className="section container-wide support-grid"><div className="glass support-panel"><div><span className="eyebrow">If you want to help</span><h2>{content.donation?.title}</h2><p>If you find my work useful and would like to support a future project, you can do that here.</p></div><DonationWidget content={content.donation} stats={donationStats} /></div>
      <div className="glass rating-panel"><span className="eyebrow">Tell me what you think</span><h3>How was the portfolio?</h3><div className="stars">{[1,2,3,4,5].map(s=><button key={s} className={chosenRating>=s?'star active':'star'} onClick={()=>setChosenRating(s)} aria-label={`${s} stars`}><Star fill={chosenRating>=s?'currentColor':'none'} /></button>)}</div><textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Optional feedback..." disabled={rating.hasRated}/><button className="btn btn-primary" onClick={submitRating} disabled={ratingBusy||rating.hasRated}>{ratingBusy?<Loader2 className="spin"/>:rating.hasRated?'Already rated':<>Submit rating <Check size={16}/></>}</button><div className="rating-summary"><strong>{rating.average || 0}</strong><span>/ 5 average · {rating.count} ratings</span></div></div></RevealSection>
    {selectedProject&&<ProjectDetail project={selectedProject} onClose={()=>setSelectedProject(null)}/>}
    {toast && <Toast text={toast} onClose={()=>setToast('')} />}
  </>
}

function DonationWidget({content,stats}){
 const [amount,setAmount]=useState(''); const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
 const presets=[100,250,500,1000];
 async function donate(){const n=Number(amount); if(!n||n<1){setMsg('Enter a valid amount.');return;} setBusy(true);setMsg(''); try{if(!window.Razorpay){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=resolve;s.onerror=reject;document.body.appendChild(s)});} const order=await api.send('/create-order','POST',{amount:n}); const opts={key:order.key_id||undefined,amount:order.amount,currency:order.currency,name:'Ritik Verma',description:'Support my work',order_id:order.id,prefill:{name,email},theme:{color:'#8b5cf6'},handler:async response=>{await api.send('/verify-payment','POST',{...response,amount:order.amount,name,email});setMsg('Thank you for your support!');setAmount('');}}; const r=new window.Razorpay(opts);r.open();}catch(e){setMsg(e.message||'Donation could not be started.')}finally{setBusy(false)}}
 return <div><div className="preset-row">{presets.map(p=><button key={p} className={String(p)===amount?'selected':''} onClick={()=>setAmount(String(p))}>₹{p}</button>)}</div><div className="form-grid two"><input value={name} onChange={e=>setName(e.target.value)} placeholder={content?.donorNamePlaceholder||'Your Name'}/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder={content?.donorEmailPlaceholder||'Your Email'}/></div><input value={amount} onChange={e=>setAmount(e.target.value)} placeholder={content?.customAmountPlaceholder||'Enter custom amount'} type="number" min="1"/><button className="btn btn-primary full" onClick={donate} disabled={busy}>{busy?<Loader2 className="spin"/>:<WalletCards size={17}/>} {content?.buttonText||'Donate Now'}</button>{msg&&<small className="form-msg">{msg}</small>}<div className="goal"><div><span>{content?.milestoneTitle||'Support goal'}</span><b>₹{stats.totalAmount.toLocaleString('en-IN')} / ₹{(content?.goal||10000).toLocaleString('en-IN')}</b></div><div className="progress"><span style={{width:`${Math.min(100,(stats.totalAmount/(content?.goal||10000))*100)}%`}} /></div></div><div className="leaderboard"><div className="leaderboard-title">{content?.leaderboardTitle||'Top Supporters'} <span>{stats.totalDonors} donors</span></div>{stats.donations.slice(0,5).map((d,i)=><div className="donor" key={d._id}><span>#{i+1}</span><strong>{d.name||'Anonymous'}</strong><b>₹{Number(d.amount||0).toLocaleString('en-IN')}</b></div>)}</div></div>
}

function ProjectCard({project,onOpen,tilt=false}){const image=(project.images?.[0]||project.imageUrl||ASSET('img1.png'));return <motion.article className={`project-card ${tilt ? 'tilt-card' : ''}`} whileHover={{y:-8}} onClick={()=>{onOpen?.(project);api.send('/api/analytics/event','POST',{type:'project',id:project._id,name:project.title}).catch(()=>{})}}><div className="project-media"><img src={image} /><span>{project.category||'Project'}</span>{project.featured&&<em>★ Featured</em>}</div><div className="project-body"><div className="project-top"><h3>{project.title}</h3><button className="icon-btn small" onClick={e=>{e.stopPropagation();onOpen?.(project)}} aria-label="Open project details"><ExternalLink size={17}/></button></div><p>{project.description}</p><div className="tech-row">{(project.technologies||[]).slice(0,6).map(t=><span key={t}>{t}</span>)}</div><div className="project-links">{project.liveUrl&&<a href={project.liveUrl} onClick={e=>e.stopPropagation()} target="_blank" rel="noreferrer">Live <Globe2 size={14}/></a>}{project.githubUrl&&<a href={project.githubUrl} onClick={e=>e.stopPropagation()} target="_blank" rel="noreferrer">GitHub <GithubIcon size={14}/></a>}</div></div></motion.article>}

function Projects(){const [projects,setProjects]=useState([]);const [q,setQ]=useState('');const [cat,setCat]=useState('all');const [selected,setSelected]=useState(null);useEffect(()=>{ api.get('/api/projects').then(setProjects).catch(()=>{}); },[]); const cats=['all',...new Set(projects.map(p=>p.category).filter(Boolean))];const filtered=projects.filter(p=>`${p.title} ${p.description} ${(p.technologies||[]).join(' ')}`.toLowerCase().includes(q.toLowerCase())&&(cat==='all'||p.category===cat));return <Page eyebrow="Portfolio" title="Things I've built" subtitle="A collection of projects I've worked on, along with the tools and ideas behind them."><div className="toolbar glass"><div className="search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search my projects..."/></div><div className="filter-pills">{cats.map(c=><button key={c} className={cat===c?'active':''} onClick={()=>setCat(c)}>{c}</button>)}</div></div><div className="project-grid project-grid-large">{filtered.map(p=><ProjectCard key={p._id} project={p} onOpen={setSelected}/>)}</div>{selected&&<ProjectDetail project={selected} onClose={()=>setSelected(null)}/>}</Page>}

function ProjectDetail({project,onClose}){const image=(project.images?.[0]||project.imageUrl||ASSET('img1.png'));return <Modal onClose={onClose} title={project.title}><div className="project-detail"><img src={image} alt={project.title}/><div className="project-detail-copy"><span className="eyebrow">{project.category||'Project'}</span><p>{project.description}</p><div className="tech-row">{(project.technologies||[]).map(t=><span key={t}>{t}</span>)}</div><div className="project-detail-actions">{project.liveUrl&&<a className="btn btn-primary" href={project.liveUrl} target="_blank" rel="noreferrer">Live demo <Globe2 size={15}/></a>}{project.githubUrl&&<a className="btn btn-ghost" href={project.githubUrl} target="_blank" rel="noreferrer">GitHub <GithubIcon size={15}/></a>}</div>{project.images?.length>1&&<div className="project-detail-gallery">{project.images.map((src,i)=><img key={i} src={src} alt={`${project.title} ${i+1}`}/>)}</div>}</div></div></Modal>}

const COMPILER_TEMPLATES = {
  c: {
    'Hello World': '#include <stdio.h>\n\nint main() {\n    printf("Hello, Ritik!\\n");\n    return 0;\n}\n',
    'Input / Output': '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("Sum = %d\\n", a + b);\n    return 0;\n}\n',
    'Loop': '#include <stdio.h>\n\nint main() {\n    for (int i = 1; i <= 10; i++) {\n        printf("%d\\n", i);\n    }\n    return 0;\n}\n'
  },
  cpp: {
    'Hello World': '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Ritik!\\n";\n    return 0;\n}\n',
    'Input / Output': '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << "Sum = " << a + b << "\\n";\n    return 0;\n}\n',
    'Vector': '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> values = {1, 2, 3, 4, 5};\n    for (int x : values) cout << x << " ";\n    cout << "\\n";\n    return 0;\n}\n'
  }
};

function escapeHtml(value=''){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function highlightCode(source='', language='cpp'){
  const tokenized=escapeHtml(source);
  const pattern=/(&quot;[^&]*?&quot;|'[^']*'|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?\b|\b(?:int|float|double|char|void|bool|long|short|unsigned|signed|auto|const|static|return|if|else|for|while|do|switch|case|break|continue|struct|class|public|private|protected|using|namespace|include|define|true|false|nullptr|new|delete|vector|string|cout|cin|printf|scanf)\b)/g;
  return tokenized.replace(pattern, token => {
    if(token.startsWith('&quot;') || token.startsWith("'")) return `<span class="tok-string">${token}</span>`;
    if(token.startsWith('//') || token.startsWith('/*')) return `<span class="tok-comment">${token}</span>`;
    if(/^\d/.test(token)) return `<span class="tok-number">${token}</span>`;
    return `<span class="tok-keyword">${token}</span>`;
  });
}

function Compiler(){
  const initialC=COMPILER_TEMPLATES.c['Hello World'];
  const initialCpp=COMPILER_TEMPLATES.cpp['Hello World'];
  const [tabs,setTabs]=useState([{id:1,name:'main.cpp',language:'cpp',code:initialCpp}]);
  const [activeTab,setActiveTab]=useState(1);
  const [output,setOutput]=useState('Ready.');
  const [busy,setBusy]=useState(false);
  const [session,setSession]=useState(null);
  const [input,setInput]=useState('');
  const [fontSize,setFontSize]=useState(14);
  const [fullscreen,setFullscreen]=useState(false);
  const [template,setTemplate]=useState('');
  const editorRef=React.useRef(null);
  const active=tabs.find(t=>t.id===activeTab)||tabs[0];
  const updateCode=(code)=>setTabs(prev=>prev.map(t=>t.id===activeTab?{...t,code}:t));
  const updateLanguage=(language)=>setTabs(prev=>prev.map(t=>t.id===activeTab?{...t,language,name:t.name.replace(/\.(c|cpp)$/,'')+(language==='cpp'?'.cpp':'.c')}:t));
  const addTab=()=>{const id=Date.now();const language='cpp';setTabs(prev=>[...prev,{id,name:`main${prev.length+1}.cpp`,language,code:initialCpp}]);setActiveTab(id);};
  const closeTab=(id)=>{if(tabs.length===1)return;const next=tabs.filter(t=>t.id!==id);setTabs(next);if(id===activeTab)setActiveTab(next[Math.max(0,next.length-1)].id);};
  const run=async()=>{setBusy(true);setOutput('Compiling…');try{const r=await api.send('/run','POST',{code:active.code,language:active.language,input});if(r.sessionId){setSession(r.sessionId);setOutput(r.output||'Program started. Waiting for output…');const poll=async()=>{try{const x=await api.get(`/run/${r.sessionId}`);setOutput(x.output||'');if(x.status==='running')setTimeout(poll,450);else{setBusy(false);setSession(null)}}catch(e){setOutput(e.message);setBusy(false);setSession(null)}};poll();}else{setOutput(r.output||'');setBusy(false)}}catch(e){setOutput(e.message);setBusy(false)}};
  const stop=async()=>{if(session)await api.send(`/run/${session}/stop`,'POST',{});setBusy(false);setSession(null);setOutput(o=>o+'\nProcess stopped by user.');};
  const sendInput=async(value=input)=>{if(!session || !value)return;try{await api.send(`/run/${session}/input`,'POST',{input:value});setInput('')}catch(e){setOutput(o=>o+`\n${e.message}`)}};
  const saveLocal=()=>{try{localStorage.setItem('compiler-tabs',JSON.stringify(tabs))}catch{}};
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('compiler-tabs')||'null');if(Array.isArray(saved)&&saved.length){setTabs(saved);setActiveTab(saved[0].id)}}catch{}},[]);
  useEffect(()=>{saveLocal()},[tabs]);
  useEffect(()=>{const onKey=(e)=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();if(!busy)run();}if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();saveLocal();}if(e.key==='F11'){e.preventDefault();setFullscreen(v=>!v);}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[active,busy,session,input,tabs]);
  const onEditorKey=(e)=>{if(e.key==='Tab'){e.preventDefault();const el=e.currentTarget,start=el.selectionStart,end=el.selectionEnd;updateCode(active.code.slice(0,start)+'    '+active.code.slice(end));requestAnimationFrame(()=>{el.selectionStart=el.selectionEnd=start+4});}if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();if(!busy)run();}};
  const changeTemplate=(name)=>{setTemplate(name);if(name){updateCode(COMPILER_TEMPLATES[active.language][name]);}};
  const syncScroll=(e)=>{const layer=e.currentTarget.parentElement.querySelector('.code-highlight');if(layer){layer.scrollTop=e.currentTarget.scrollTop;layer.scrollLeft=e.currentTarget.scrollLeft;}};
  return <Page eyebrow="Programming lab" title="Code like a Pro." subtitle="A focused C/C++ playground with tabs, live syntax highlighting, templates, runtime input and a real terminal-style output console.">
    <div className={`compiler-ide ${fullscreen?'compiler-fullscreen':''}`}>
      <div className="compiler-ide-bar">
        <div className="compiler-window-dots"><span className="dot red"/><span className="dot yellow"/><span className="dot green"/></div>
        <div className="compiler-file-tabs">{tabs.map(tab=><button key={tab.id} className={`compiler-tab ${tab.id===activeTab?'active':''}`} onClick={()=>setActiveTab(tab.id)}><span>{tab.name}</span>{tabs.length>1&&<X size={12} onClick={(e)=>{e.stopPropagation();closeTab(tab.id)}}/>}</button>)}<button className="compiler-new-tab" onClick={addTab}><PlusIcon size={15}/></button></div>
        <div className="compiler-toolbar">
          <select value={active.language} onChange={e=>updateLanguage(e.target.value)} aria-label="Language"><option value="c">C</option><option value="cpp">C++17</option></select>
          <select value={template} onChange={e=>changeTemplate(e.target.value)} aria-label="Template"><option value="">Templates</option>{Object.keys(COMPILER_TEMPLATES[active.language]).map(x=><option key={x}>{x}</option>)}</select>
          <button className="icon-btn small" title="Save locally (Ctrl+S)" onClick={saveLocal}><Save size={15}/></button>
          <button className="icon-btn small" title={fullscreen?'Exit fullscreen':'Fullscreen (F11)'} onClick={()=>setFullscreen(v=>!v)}>{fullscreen?<Minimize2 size={15}/>:<Maximize2 size={15}/>}</button>
        </div>
      </div>
      <div className="compiler-ide-body">
        <section className="compiler-editor-pane">
          <div className="editor-header"><span><span className="file-dot"/> {active.name}</span><span className="editor-hints"><Keyboard size={13}/> Ctrl+Enter Run · Ctrl+S Save · Tab Indent</span></div>
          <div className="editor-wrap ide-editor" style={{fontSize}}>
            <div className="line-numbers">{active.code.split('\n').map((_,i)=><span key={i}>{i+1}</span>)}</div>
            <div className="code-stage">
              <pre className="code-highlight" aria-hidden="true" dangerouslySetInnerHTML={{__html:highlightCode(active.code,active.language)+'\n'}} />
              <textarea ref={editorRef} value={active.code} onChange={e=>updateCode(e.target.value)} onScroll={syncScroll} onKeyDown={onEditorKey} spellCheck="false" autoCapitalize="off" autoCorrect="off" aria-label="Code editor" />
            </div>
          </div>
          <div className="compiler-actions">
            <button className="btn btn-primary" onClick={run} disabled={busy}>{busy?<Loader2 className="spin" size={16}/>:<Play size={16} fill="currentColor"/>}{busy?'Running…':'Run code'}<span className="shortcut">Ctrl+Enter</span></button>
            <button className="btn btn-ghost" onClick={stop} disabled={!session}><Square size={14} fill="currentColor"/> Stop</button>
            <button className="btn btn-ghost" onClick={()=>navigator.clipboard?.writeText(active.code)}>Copy</button>
            <div className="font-controls"><button className="icon-btn small" onClick={()=>setFontSize(v=>Math.max(11,v-1))}><Minus size={13}/></button><span>{fontSize}px</span><button className="icon-btn small" onClick={()=>setFontSize(v=>Math.min(22,v+1))}><PlusIcon size={13}/></button></div>
          </div>
        </section>
        <aside className="compiler-terminal-pane">
          <div className="terminal-section input-terminal">
            <div className="terminal-title"><span><Terminal size={15}/> INPUT</span><small>{session?'Process is waiting for input':'Input can be sent while running'}</small></div>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&session){e.preventDefault();sendInput()}}} placeholder={session?'Type input and press Enter…':'stdin — enter input before or during a run…'}/>
            <div className="terminal-input-actions"><button className="btn btn-ghost full" onClick={()=>sendInput()} disabled={!session||!input}><span>Send input</span><span className="shortcut">Enter</span></button></div>
          </div>
          <div className="terminal-section output-terminal">
            <div className="terminal-title"><span><Terminal size={15}/> OUTPUT</span><div><span className={`status-dot ${busy?'running':''}`}/>{busy?'Running':'Ready'}<button className="icon-btn small" title="Clear output" onClick={()=>setOutput('Ready.')}><RefreshCw size={13}/></button></div></div>
            <pre className="terminal-output">{output}</pre>
          </div>
        </aside>
      </div>
    </div>
  </Page>}

function Gallery(){const [images,setImages]=useState([]);const [selected,setSelected]=useState(null);useEffect(()=>{ api.get('/api/gallery').then(x=>setImages(x.images||[])).catch(()=>{}); },[]);return <Page eyebrow="Visual archive" title="Gallery" subtitle="Your existing gallery records and Cloudinary images, refreshed as an immersive masonry-like archive."><div className="gallery-wall">{images.map((g,i)=><motion.button key={g._id} className={`gallery-card g-${i%4}`} whileHover={{y:-5}} onClick={()=>{setSelected(g);api.send('/api/analytics/event','POST',{type:'gallery',id:g._id,name:g.title}).catch(()=>{})}}><img src={g.imageUrl}/><span><strong>{g.title}</strong><small>{g.description}</small></span></motion.button>)}</div>{!images.length&&<EmptyState icon={ImageIcon} text="No gallery images yet."/>}{selected&&<Modal onClose={()=>setSelected(null)} title={selected.title}>{<div><img className="modal-image" src={selected.imageUrl}/><p>{selected.description}</p></div>}</Modal>}</Page>}

function Attendance(){const [attended,setAttended]=useState(0), [total,setTotal]=useState(0), [futureAttended,setFutureAttended]=useState(0), [futureMissed,setFutureMissed]=useState(0); const current=total?attended/total*100:0; const after=(total+futureAttended+futureMissed)?(attended+futureAttended)/(total+futureAttended+futureMissed)*100:0; const need= Math.max(0,Math.ceil((0.75*total-attended)/0.25)); return <Page eyebrow="For students" title="Keep track of attendance" subtitle="Check your current percentage and see what happens if you attend or miss the next few classes."><div className="attendance-layout"><div className="glass calc-card"><div className="form-grid two"><Field label="Classes attended"><input type="number" min="0" value={attended} onChange={e=>setAttended(+e.target.value)}/></Field><Field label="Total classes"><input type="number" min="0" value={total} onChange={e=>setTotal(+e.target.value)}/></Field><Field label="Future attended"><input type="number" min="0" value={futureAttended} onChange={e=>setFutureAttended(+e.target.value)}/></Field><Field label="Future missed"><input type="number" min="0" value={futureMissed} onChange={e=>setFutureMissed(+e.target.value)}/></Field></div><div className="calc-note">{current<75&&total>0?`You need about ${need} consecutive attended classes to reach 75% from your current total.`:'You are at or above the 75% target.'}</div></div><div className="attendance-result glass"><div className="score-ring" style={{'--p':`${Math.min(100,current)}%`,'--ring-active':'var(--theme-secondary)','--ring-track':'color-mix(in srgb,var(--theme-card-border) 10%,transparent)'}}><div><strong>{current.toFixed(1)}%</strong><span>Current</span></div></div><div className="future-score"><span>Projected</span><strong>{after.toFixed(1)}%</strong><small>after planned classes</small></div><div className="legend"><span><i className="dot green"/> Attended</span><span><i className="dot red"/> Missed</span></div></div></div></Page>}

function Resume(){
 const [data,setData]=useState({
  name:'Ritik Verma',
  title:'B.Tech CSE Student · Developer',
  summary:'Computer science student building practical projects and learning along the way.',
  profileImage:'',
  email:'',phone:'',location:'',website:'',github:'',linkedin:'',
  skills:['C','C++','Data Structures','React','Node.js'],
  education:[{title:'B.Tech in Computer Science Engineering',institute:'PSIT Kanpur',status:'Computer Science student'}],
  experience:[],certifications:[],achievements:[],interests:[],projects:[]
 });
 useEffect(()=>{
  const loadResume=async()=>{
   try{
    const [contentResponse,projectsResponse]=await Promise.all([
     api.get('/api/portfolio-content'),
     api.get('/api/projects')
    ]);
    const content=contentResponse?.content||{};
    const resume=content.resume||{};
    setData(prev=>(
     {
      ...prev,
      name:content.hero?.name||prev.name,
      title:content.hero?.typing||prev.title,
      profileImage:content.profileImage||prev.profileImage,
      summary:resume.summary||content.about?.text||prev.summary,
      email:resume.email||prev.email,
      phone:resume.phone||prev.phone,
      location:resume.location||prev.location,
      website:resume.website||prev.website,
      github:resume.github||prev.github,
      linkedin:resume.linkedin||prev.linkedin,
      skills:Array.isArray(content.skills)&&content.skills.length?content.skills:prev.skills,
      education:Array.isArray(resume.education)&&resume.education.length?resume.education:(Array.isArray(content.education)&&content.education.length?content.education:prev.education),
      experience:Array.isArray(resume.experience)?resume.experience:[],
      certifications:Array.isArray(resume.certifications)?resume.certifications:[],
      achievements:Array.isArray(resume.achievements)?resume.achievements:[],
      interests:Array.isArray(resume.interests)?resume.interests:[],
      projects:Array.isArray(projectsResponse)?projectsResponse.slice(0,5):[]
     }
    ));
   }catch(e){
    console.error('Resume load failed:',e);
   }
  };
  loadResume();
 },[]);
 return <Page eyebrow="My resume" title={<>A quick look at my <span className="gradient-text">experience.</span></>} subtitle="A clean, print-ready resume using the same information saved in the dashboard.">
  <div className="resume-toolbar">
   <button className="btn btn-primary" onClick={()=>window.print()}><Download size={16}/> Print / Save PDF</button>
  </div>
  <div className="resume-sheet" id="resume">
   <header>
    <div>
     <h2>{data.name}</h2>
     <p>{data.title}</p>
     <div className="resume-contact">{[data.email,data.phone,data.location,data.website].filter(Boolean).map((item,index)=><span key={index}>{item}</span>)}</div>
    </div>
    <img src={normalizeImage(data.profileImage||ASSET('photoweb.png'))} alt={data.name}/>
   </header>
   <section><h3>Profile</h3><p>{data.summary}</p></section>
   <section><h3>Skills</h3><div className="resume-tags">{(data.skills||[]).map(skill=><span key={skill}>{skill}</span>)}</div></section>
   {data.experience?.length>0&&<section><h3>Experience</h3>{data.experience.map((item,index)=><div key={index} className="resume-project"><strong>{item.role}{item.company?' · '+item.company:''}</strong><small>{item.period||''}</small><p>{item.description||''}</p></div>)}</section>}
   <section><h3>Education</h3>{(data.education||[]).map((item,index)=><div key={index}><strong>{item.title}</strong><p>{item.institute}{item.status?' · '+item.status:''}</p></div>)}</section>
   {data.certifications?.length>0&&<section><h3>Certifications</h3>{data.certifications.map((item,index)=><div key={index}><strong>{item.name}</strong><p>{item.issuer}{item.year?' · '+item.year:''}</p></div>)}</section>}
   {data.achievements?.length>0&&<section><h3>Achievements</h3><ul>{data.achievements.map((item,index)=><li key={index}>{item}</li>)}</ul></section>}
   {data.interests?.length>0&&<section><h3>Interests</h3><div className="resume-tags">{data.interests.map(item=><span key={item}>{item}</span>)}</div></section>}
   <section><h3>Projects</h3>{(data.projects||[]).map((project,index)=><div key={index} className="resume-project"><strong>{project.title}</strong><p>{project.description}</p></div>)}</section>
  </div>
 </Page>;
}
function Contact(){const [form,setForm]=useState({name:'',email:'',message:''});const [state,setState]=useState('');const submit=async e=>{e.preventDefault();setState('Sending…');try{await api.send('/api/messages','POST',form);setState("Message sent — I'll get back to you soon.");setForm({name:'',email:'',message:''})}catch(err){setState(err.message)}};return <Page eyebrow="Get in touch" title={<>Have an idea? <span className="gradient-text">Let's talk.</span></>} subtitle="Send me a message about a project, collaboration, internship, or anything you'd like to discuss."><div className="contact-layout"><div className="contact-copy"><div className="glass contact-card"><h2>Let's talk.</h2><p>Have a project in mind, want to work together, or just want to say hello? Drop me a message.</p><div className="contact-links"><a href="mailto:vermaritik9911@gmail.com"><Mail/>vermaritik9911@gmail.com</a><a href="https://www.linkedin.com/in/vermaritik/" target="_blank" rel="noreferrer"><Linkedin/>LinkedIn</a><a href="https://github.com/ritikvermaai" target="_blank" rel="noreferrer"><GithubIcon/>GitHub</a><a href="https://www.instagram.com/its__ritikverma/" target="_blank" rel="noreferrer"><Instagram/>Instagram</a></div></div></div><form className="glass contact-form" onSubmit={submit}><Field label="Your name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Enter your name"/></Field><Field label="Email address"><input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></Field><Field label="Message"><textarea required value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Write your message here..."/></Field><button className="btn btn-primary" type="submit"><Mail size={16}/>Send message</button>{state&&<small className="form-msg">{state}</small>}</form></div></Page>}

function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function EmptyState({icon:Icon,text}){return <div className="empty glass"><Icon size={30}/><strong>{text}</strong></div>}
function Toast({text,onClose}){useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t)},[onClose]);return <div className="toast glass" onClick={onClose}><Check size={17}/>{text}</div>}
function Modal({title,children,onClose}){return <div className="modal-backdrop" onMouseDown={onClose}><motion.div className="modal glass" initial={{scale:.96,opacity:0}} animate={{scale:1,opacity:1}} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Preview</span><h3>{title}</h3></div><button className="icon-btn" onClick={onClose}><X/></button></div>{children}</motion.div></div>}

// ---------------- ADMIN ----------------
const adminGroups = [
 {label:'Overview',items:[['dashboard','Dashboard',LayoutDashboard],['analytics','Analytics',BarChart3],['visitors','Visitors',Users]]},
 {label:'Content',items:[['projects','Projects',FolderKanban],['gallery','Gallery',ImageIcon],['resume','Resume',FileText],['builder','Website Builder',Sparkles]]},
 {label:'Engagement',items:[['messages','Messages',MessageSquare],['ratings','Ratings',Star],['donations','Donations',WalletCards]]},
 {label:'System',items:[['settings','Settings',Settings],['theme','Theme Designer',Palette],['security','Security',ShieldCheck],['health','System Health',Activity],['activity','Activity Log',History]]}
];
const adminNav = adminGroups.flatMap(g=>g.items);

function AdminLogin(){
 const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 const [checkingSession,setCheckingSession]=useState(true);
 const [lockedUntil,setLockedUntil]=useState(0); const [failed,setFailed]=useState(0); const [profileImage,setProfileImage]=useState(ASSET('photoweb.png')); const [clockNow,setClockNow]=useState(Date.now());
 const navigate=useNavigate();
 const syncLock=()=>{api.get('/admin/login-status').then(d=>{if(d.locked)setLockedUntil(Date.now()+Number(d.retryAfter||0)*1000);else setLockedUntil(0);setFailed(Number(d.failures||0))}).catch(()=>{})};
 useEffect(()=>{
   let active=true;
   try{const cached=localStorage.getItem('portfolio-theme');if(cached)applyTheme(JSON.parse(cached));}catch{}
   Promise.all([api.get('/admin/status').catch(()=>({loggedIn:false})),api.get('/api/theme').catch(()=>null),api.get('/api/portfolio-content').catch(()=>null)])
     .then(([status,themeData,contentData])=>{
       if(!active)return;
       if(status?.loggedIn){navigate('/admin/dashboard',{replace:true});return;}
       if(themeData?.theme){const t=applyTheme(themeData.theme);try{localStorage.setItem('portfolio-theme',JSON.stringify(t));localStorage.setItem('portfolio-theme-mode',t.mode)}catch{}}
       if(contentData?.content?.profileImage)setProfileImage(normalizeImage(contentData.content.profileImage));
       syncLock();
       setCheckingSession(false);
     })
     .catch(()=>{if(active){syncLock();setCheckingSession(false)}});
   return()=>{active=false};
 },[navigate]);
 useEffect(()=>{if(!lockedUntil){setClockNow(Date.now());return;}setClockNow(Date.now());const id=setInterval(()=>{const now=Date.now();setClockNow(now);if(now>=lockedUntil){setLockedUntil(0);syncLock()}},250);return()=>clearInterval(id)},[lockedUntil]);
 const remaining=Math.max(0,Math.ceil((lockedUntil-clockNow)/1000)); const minutes=Math.floor(remaining/60); const seconds=remaining%60; const timeLabel=`${minutes?`${minutes}m `:''}${String(seconds).padStart(2,'0')}s`;
 async function submit(e){e.preventDefault();if(lockedUntil>Date.now())return;setBusy(true);setError('');try{await api.send('/api/admin/login','POST',{password});setFailed(0);setLockedUntil(0);setError('');navigate('/admin/dashboard',{replace:true})}catch(e){const nextFailures=Number(e.failures||failed+1);setFailed(nextFailures);setError(e.message);if(Number(e.retryAfter||0)>0)setLockedUntil(Date.now()+Number(e.retryAfter)*1000);else setLockedUntil(0)}finally{setBusy(false)}}
 if(checkingSession)return <div className="admin-login-page"><div className="admin-login-card glass"><div className="admin-login-avatar"><img src={profileImage} alt="Ritik Verma"/></div><Loader2 className="spin" size={22}/><p>Checking your admin session…</p></div></div>;
 return <div className="admin-login-page"><div className="admin-login-card glass"><div className="admin-login-avatar"><img src={profileImage} alt="Ritik Verma"/></div><span className="eyebrow">Secure workspace</span><h1>Admin dashboard</h1><p>Manage your portfolio, content, media, messages and website settings from one focused workspace.</p><form onSubmit={submit}><Field label="Admin password"><input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" disabled={remaining>0}/></Field>{error&&<div className="error-box">{error}</div>}{remaining>0&&<div className="login-lockout"><div><Clock size={16}/><strong>Try again in {timeLabel}</strong></div><span>Security cooldown · failed attempt {failed} · maximum wait is 5 minutes</span><div className="login-lockout-bar"><i style={{width:`${Math.min(100,Math.max(4,(remaining/Math.min(300,Math.max(60,failed*60)))*100))}%`}}/></div></div>}<button className="btn btn-primary full" disabled={busy||remaining>0}>{busy?<Loader2 className="spin"/>:remaining>0?<Clock size={17}/>:<Settings size={17}/>} {remaining>0?`Locked for ${timeLabel}`:'Sign in'}</button></form><a href="/">← Back to website</a></div></div>}
function Admin(){const [logged,setLogged]=useState(null);useEffect(()=>{ api.get('/admin/status').then(d=>setLogged(Boolean(d.loggedIn))).catch(()=>setLogged(false)); },[]);if(logged===null)return <div className="center-loader"><Loader2 className="spin"/></div>;return logged?<AdminWorkspace/>:<Navigate to="/admin/login" replace/>}
function AdminWorkspace(){
 const [section,setSection]=useState('dashboard');
 const [mobile,setMobile]=useState(false);
 const [toast,setToast]=useState('');
 const [theme,setTheme]=useState(()=>{try{return localStorage.getItem('portfolio-theme-mode')||'dark'}catch{return'dark'}});
 const [stats,setStats]=useState({visitors:0,projects:0,gallery:0,donations:0,messages:0});
 const [profileImage,setProfileImage]=useState(ASSET('photoweb.png'));
 const [query,setQuery]=useState('');
 useEffect(()=>{api.get('/api/portfolio-content').then(d=>setProfileImage(normalizeImage(d.content?.profileImage))).catch(()=>{});},[]);
 useEffect(()=>{api.get('/admin/api/theme').then(d=>{if(d?.theme){applyTheme(d.theme);setTheme(d.theme.mode==='light'?'light':'dark');try{localStorage.setItem('portfolio-theme',JSON.stringify(d.theme));localStorage.setItem('portfolio-theme-mode',d.theme.mode)}catch{}}}).catch(()=>{});},[]);
 const loadStats=()=>Promise.allSettled([api.get('/admin/visitor-stats'),api.get('/admin/projects'),api.get('/admin/api/gallery'),api.get('/admin/api/donations'),api.get('/admin/api/messages')]).then(r=>setStats({visitors:r[0].status==='fulfilled'?Number(r[0].value?.count||0):0,projects:r[1].status==='fulfilled'?(r[1].value?.projects||[]).length:0,gallery:r[2].status==='fulfilled'?(r[2].value?.images||[]).length:0,donations:r[3].status==='fulfilled'?(r[3].value?.donations||[]).reduce((sum,d)=>sum+Number(d.amount||0),0):0,messages:r[4].status==='fulfilled'?(r[4].value?.messages||[]).filter(m=>!m.read).length:0}));
 useEffect(()=>{loadStats()},[]);
 useEffect(()=>{
   document.body.classList.toggle('admin-drawer-open', mobile);
   return ()=>document.body.classList.remove('admin-drawer-open');
 },[mobile]);
 const logout=async()=>{await api.send('/admin/logout','POST',{});location.href='/admin/login'};
 const current=adminNav.find(x=>x[0]===section);
 const filteredGroups=adminGroups.map(g=>({...g,items:g.items.filter(([,label])=>label.toLowerCase().includes(query.toLowerCase()))})).filter(g=>g.items.length);
 const navigate=(id)=>{setSection(id);setMobile(false);setQuery('');};
 return <div className="admin-app">
  <aside className={`admin-sidebar ${mobile?'open':''}`}>
   <div className="admin-brand"><div className="admin-logo"><img src={profileImage} alt="Ritik Verma"/></div><div><strong>Ritik Verma</strong><span>CONTROL CENTER</span></div></div>
   <div className="admin-sidebar-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tools..."/></div>
   <nav className="admin-nav-groups">{filteredGroups.map(group=><div className="admin-nav-group" key={group.label}><span className="admin-nav-label">{group.label}</span>{group.items.map(([id,label,Icon])=><button key={id} className={section===id?'active':''} onClick={()=>navigate(id)}><Icon size={17}/><span>{label}</span>{id==='messages'&&stats.messages>0?<b>{stats.messages}</b>:null}</button>)}</div>)}{!filteredGroups.length&&<div className="admin-nav-empty">No tools found.</div>}</nav>
   <div className="admin-bottom"><a href="/" target="_blank" rel="noreferrer"><Globe2 size={17}/>View website</a><button onClick={logout}><LogOut size={17}/>Logout</button></div>
  </aside>
  <div className="admin-main">
   <header className="admin-topbar glass"><div className="admin-top-left"><button className="icon-btn mobile-only" onClick={()=>setMobile(!mobile)}><Menu/></button><div className="admin-breadcrumb"><span>Admin</span><ChevronRight size={13}/><strong>{current?.[1]||'Dashboard'}</strong></div><h1>{current?.[1]||'Dashboard'}</h1></div><div className="admin-top-actions"><div className="admin-command-hint"><Search size={14}/> Search</div><button className={`theme-toggle ${theme}`} onClick={()=>setTheme(toggleThemePalette(theme))} aria-label={`Switch to ${theme==='dark'?'light':'dark'} theme`}><span className="theme-toggle-track"><span className="theme-toggle-thumb">{theme==='dark'?<Moon size={15}/>:<Sun size={15}/>}</span></span><span className="theme-toggle-label">{theme==='dark'?'Dark':'Light'}</span></button><div className="admin-status"><span/>Online</div></div></header>
   <main className="admin-content">{section==='dashboard'&&<AdminDashboard stats={stats} onNavigate={navigate} onRefresh={loadStats}/>} {section==='analytics'&&<AdminAnalytics/>} {section==='projects'&&<AdminProjects onChanged={()=>{loadStats();setToast('Project list updated')}}/>}{section==='gallery'&&<AdminGallery onChanged={()=>{loadStats();setToast('Gallery updated')}}/>}{section==='donations'&&<AdminDonations onChanged={()=>{loadStats();setToast('Donation records updated')}}/>}{section==='visitors'&&<AdminVisitors onChanged={loadStats}/>} {section==='messages'&&<AdminMessages onChanged={()=>{loadStats();setToast('Message updated')}}/>}{section==='ratings'&&<AdminRatings/>}{section==='resume'&&<AdminResume/>}{section==='builder'&&<WebsiteBuilder onSaved={()=>setToast('Website content saved')}/>} {section==='settings'&&<AdminSettings onSaved={(data)=>{if(data?.profileImage)setProfileImage(normalizeImage(data.profileImage));setToast('Settings saved')}}/>}{section==='theme'&&<ThemeDesigner onSaved={()=>setToast('Theme saved and published')}/>} {section==='security'&&<AdminSecurity/>}{section==='health'&&<AdminSystemHealth/>}{section==='activity'&&<AdminActivity/>}</main>
  </div>
  {mobile&&<button className="admin-mobile-backdrop" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}
  <nav className="admin-mobile-nav">{[['dashboard','Home',LayoutDashboard],['analytics','Analytics',BarChart3],['projects','Projects',FolderKanban],['gallery','Gallery',ImageIcon],['security','Security',ShieldCheck]].map(([id,label,Icon])=><button key={id} className={section===id?'active':''} onClick={()=>navigate(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
  {toast&&<Toast text={toast} onClose={()=>setToast('')}/>} 
 </div>
}

function AdminAnalytics(){
  const empty={totalVisitors:0,periodVisits:0,totalEvents:0,daily:[],topPages:[],projects:[],gallery:[]};
  const [data,setData]=useState(empty);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState('');
  const load=()=>{setBusy(true);setError('');api.get('/admin/analytics').then(r=>setData({...empty,...r,daily:Array.isArray(r?.daily)?r.daily:[],topPages:Array.isArray(r?.topPages)?r.topPages:[],projects:Array.isArray(r?.projects)?r.projects:[],gallery:Array.isArray(r?.gallery)?r.gallery:[]})).catch(e=>{setError(e.message||'Unable to load analytics');setData(empty)}).finally(()=>setBusy(false))};
  useEffect(()=>{load()},[]);
  if(busy)return <AdminSection title="Analytics" subtitle="Traffic and content engagement at a glance."><div className="analytics-loading glass"><Loader2 className="spin"/><span>Loading analytics…</span></div></AdminSection>;
  const max=Math.max(...data.daily.map(x=>Number(x.visits)||0),1);
  return <AdminSection title="Analytics" subtitle="A clear view of visitors, popular pages and what people interact with.">
    {error&&<div className="error-box analytics-error">{error}<button className="btn btn-ghost" onClick={load}>Try again <RefreshCw size={14}/></button></div>}
    <div className="analytics-summary">{[['Total visitors',data.totalVisitors,Users,'cyan'],['7 day visits',data.periodVisits,Eye,'violet'],['Tracked events',data.totalEvents,Activity,'pink'],['Top page',data.topPages[0]?.path||'—',Globe2,'orange']].map(([l,v,I,c])=><div className={`analytics-card ${c}`} key={l}><I size={19}/><span>{l}</span><strong>{typeof v==='number'?v.toLocaleString('en-IN'):v}</strong></div>)}</div>
    <div className="analytics-grid"><div className="glass analytics-panel"><div className="analytics-head"><div><span className="eyebrow">Last 7 days</span><h3>Visitor activity</h3></div><button className="icon-btn small" onClick={load} title="Refresh analytics"><RefreshCw size={15}/></button></div>{data.daily.length?<div className="bar-chart">{data.daily.map(d=><div className="bar-col" key={d.date} title={`${d.date}: ${d.visits} visits`}><span style={{height:`${Math.max(8,(Number(d.visits)||0)/max*100)}%`}}/><small>{d.label}</small><b>{d.visits}</b></div>)}</div>:<div className="analytics-empty"><Activity size={28}/><strong>No visits recorded yet</strong><span>Browse the public website to start collecting activity.</span></div>}</div>
      <div className="glass analytics-panel"><div className="analytics-head"><div><span className="eyebrow">Popular pages</span><h3>Where people go</h3></div></div><div className="rank-list">{data.topPages.map((p,i)=><div key={`${p.path}-${i}`}><span>{String(i+1).padStart(2,'0')}</span><strong>{p.path}</strong><b>{p.visits}</b></div>)}{!data.topPages.length&&<div className="analytics-empty compact"><span>No page visits yet.</span></div>}</div></div>
    </div>
    <div className="analytics-grid"><div className="glass analytics-panel"><div className="analytics-head"><div><span className="eyebrow">Projects</span><h3>Most viewed projects</h3></div></div><div className="rank-list">{data.projects.map((p,i)=><div key={`${p.name}-${i}`}><span>{String(i+1).padStart(2,'0')}</span><strong>{p.name}</strong><b>{p.views}</b></div>)}{!data.projects.length&&<div className="analytics-empty compact"><span>No project views yet.</span></div>}</div></div>
      <div className="glass analytics-panel"><div className="analytics-head"><div><span className="eyebrow">Gallery</span><h3>Most viewed images</h3></div></div><div className="rank-list">{data.gallery.map((p,i)=><div key={`${p.name}-${i}`}><span>{String(i+1).padStart(2,'0')}</span><strong>{p.name}</strong><b>{p.views}</b></div>)}{!data.gallery.length&&<div className="analytics-empty compact"><span>No gallery views yet.</span></div>}</div></div></div>
  </AdminSection>
}

function AdminDashboard({stats,onNavigate,onRefresh}){
 const [health,setHealth]=useState({status:'checking',database:'checking'});
 const [restarting,setRestarting]=useState(false);
 const [profile,setProfile]=useState({name:'Ritik Verma',role:'Portfolio admin',image:ASSET('photoweb.png')});
 useEffect(()=>{Promise.allSettled([api.get('/api/health'),api.get('/api/portfolio-content')]).then(([h,c])=>{if(h.status==='fulfilled')setHealth({status:h.value.status||'healthy',database:h.value.database||'connected'});if(c.status==='fulfilled'){const x=c.value.content||{};setProfile({name:x.hero?.name||'Ritik Verma',role:x.hero?.roles?.[0]||x.hero?.typing||'Portfolio admin',image:normalizeImage(x.profileImage)})}})},[]);
 const cards=[['Visitors',stats.visitors,Eye,'cyan','visitors'],['Projects',stats.projects,FolderKanban,'violet','projects'],['Gallery',stats.gallery,ImageIcon,'pink','gallery'],['Donations',`₹${stats.donations.toLocaleString('en-IN')}`,WalletCards,'orange','donations'],['Unread messages',stats.messages,Mail,'green','messages']];
 const controls=[['Website Builder','Shape the homepage, sections and visual layout.','builder',Sparkles],['Resume Studio','Keep your profile and resume information current.','resume',FileText],['Project Manager','Add, edit and feature your best work.','projects',FolderKanban],['Gallery Manager','Upload and organize the images visitors see.','gallery',ImageIcon],['Messages','Read enquiries and clear your inbox.','messages',MessageSquare],['Analytics','See traffic and engagement over time.','analytics',BarChart3],['Visitors','Check the public visitor counter.','visitors',Users],['Settings','Update profile photo, links and site basics.','settings',Settings]];
 const pending=[stats.projects===0&&'Add your first project',stats.gallery===0&&'Upload a gallery image',stats.messages>0&&`${stats.messages} unread message${stats.messages>1?'s':''}`].filter(Boolean);
 return <div className="admin-dashboard-home">
  <section className="admin-hero admin-hero-premium glass">
   <div className="admin-hero-copy"><div className="admin-welcome-line"><div className="admin-mini-avatar"><img src={profile.image} alt=""/></div><div><span className="eyebrow">Good to have you back</span><strong>{profile.name}</strong></div></div><h2>Your portfolio, <span>under control.</span></h2><p>Edit content, publish projects, review messages and keep the whole site looking fresh — without touching the database.</p><div className="admin-hero-actions"><button className="btn btn-primary" onClick={()=>onNavigate('builder')}><Sparkles size={16}/>Edit website</button><button className="btn btn-ghost" onClick={()=>onNavigate('projects')}><Plus size={16}/>New project</button><button className="icon-btn" onClick={onRefresh} title="Refresh overview"><RefreshCw size={17}/></button></div></div>
   <div className="admin-hero-side"><div className="admin-health-card"><div className="health-orb"><Activity size={21}/></div><div><span>System status</span><strong>{health.status==='healthy'?'All systems operational':'Checking systems'}</strong><small><i className={health.status==='healthy'?'healthy':''}></i>Database {health.database}</small></div></div><div className="admin-time-card"><Clock size={16}/><div><span>Today</span><strong>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'})}</strong></div></div></div>
  </section>
  <section className="admin-stat-grid admin-stat-grid-premium">{cards.map(([l,v,I,c,target])=><button className={`admin-stat ${c}`} key={l} onClick={()=>onNavigate(target)}><span className="admin-stat-icon"><I size={19}/></span><span>{l}</span><strong>{v}</strong><small>Open {l.toLowerCase()}</small><ArrowRight className="stat-arrow" size={15}/></button>)}</section>
  <section className="admin-dashboard-columns"><div><div className="admin-section-head-row"><div><span className="eyebrow">Workspace</span><h2>Manage your site</h2><p>Jump straight into the area you want to update.</p></div></div><div className="admin-control-grid">{controls.map(([title,desc,id,I])=><button className="admin-control-card" key={id} onClick={()=>onNavigate(id)}><span className="control-icon"><I size={17}/></span><div><strong>{title}</strong><small>{desc}</small></div><ArrowRight size={15}/></button>)}</div><button className="admin-control-card admin-restart-card" disabled={restarting} onClick={async()=>{if(!(await uiConfirm('Restart the Node server now? It will come back automatically in a few seconds.','Restart server?')))return;setRestarting(true);try{await api.send('/admin/api/server/restart','POST',{})}catch{}setTimeout(()=>location.reload(),3500)}}><span className="control-icon"><RefreshCw size={17}/></span><div><strong>{restarting?'Restarting server…':'Restart server'}</strong><small>One-click restart without manually stopping and starting the server.</small></div><ArrowRight size={15}/></button></div><aside className="admin-dashboard-side"><div className="admin-next-card glass"><div className="side-card-head"><div><span className="eyebrow">Next up</span><h3>Quick check</h3></div><Zap size={17}/></div>{pending.length?<div className="next-list">{pending.map((item,i)=><button key={i} onClick={()=>onNavigate(item.includes('project')?'projects':item.includes('image')?'gallery':'messages')}><span>{i+1}</span><strong>{item}</strong><ArrowRight size={14}/></button>)}</div>:<div className="next-empty"><Check size={18}/><strong>You're all caught up.</strong><span>No obvious admin tasks right now.</span></div>}</div><button className="admin-open-site glass" onClick={()=>window.open('/','_blank')}><Globe2 size={18}/><div><strong>Open live website</strong><small>See the public site in a new tab</small></div><ExternalLink size={15}/></button></aside></section>
 </div>;
}

function AdminProjects({onChanged}){const [items,setItems]=useState([]);const [q,setQ]=useState('');const [modal,setModal]=useState(null);const [loading,setLoading]=useState(true);const load=()=>{setLoading(true);api.get('/admin/projects').then(d=>setItems(d.projects||[])).finally(()=>setLoading(false))};useEffect(()=>{ load(); },[]);const filtered=items.filter(p=>`${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q.toLowerCase()));const remove=async(id)=>{if(!(await uiConfirm('Delete this project?','Delete project?')))return;await api.send(`/admin/projects/${id}`,'DELETE',{});load();onChanged()};return <AdminSection title="Project manager" subtitle="Add, edit, preview and delete portfolio projects with multiple images."><div className="admin-toolbar"><div className="search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search my projects..."/></div><button className="btn btn-primary" onClick={()=>setModal({})}><Plus size={16}/>Add project</button></div>{loading?<Loader2 className="spin"/>:<div className="admin-list-grid">{filtered.map(p=><div className="admin-project" key={p._id}><img src={p.images?.[0]||p.imageUrl||ASSET('img1.png')}/><div><span>{p.category}</span><h3>{p.title}</h3><p>{p.description}</p><div className="tech-row">{(p.technologies||[]).slice(0,5).map(t=><em key={t}>{t}</em>)}</div><div className="admin-actions"><button onClick={()=>setModal(p)}><Pencil/>Edit</button><button onClick={()=>remove(p._id)} className="danger"><Trash2/>Delete</button></div></div></div>)} {!filtered.length&&<EmptyState icon={FolderKanban} text="No projects found."/>}</div>}{modal!==null&&<ProjectEditor project={modal._id?modal:null} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();onChanged()}}/>}</AdminSection>}
function ProjectEditor({project,onClose,onSaved}){const [form,setForm]=useState({title:project?.title||'',category:project?.category||'Web Development',description:project?.description||'',technologies:(project?.technologies||[]).join(', '),liveUrl:project?.liveUrl||'',githubUrl:project?.githubUrl||'',featured:!!project?.featured});const [existing,setExisting]=useState(project?.images?.length?project.images:(project?.imageUrl?[project.imageUrl]:[]));const [files,setFiles]=useState([]);const [busy,setBusy]=useState(false);const submit=async e=>{e.preventDefault();setBusy(true);try{let uploaded=[];if(files.length){const fd=new FormData();files.forEach(f=>fd.append('images',f));const r=await api.form('/admin/projects/upload-images','POST',fd);uploaded=r.images||[]}const body={...form,technologies:form.technologies.split(',').map(s=>s.trim()).filter(Boolean),images:[...existing,...uploaded]};if(project){await api.send(`/admin/projects/${project._id}`,'PUT',body)}else{await api.send('/admin/projects','POST',body)}onSaved()}catch(e){uiAlert(e.message)}finally{setBusy(false)}};return <Modal title={project?'Edit project':'Add project'} onClose={onClose}><form className="editor-form" onSubmit={submit}><div className="form-grid two"><Field label="Title"><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field><Field label="Category"><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></Field></div><Field label="Description"><textarea required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field><Field label="Technologies (comma separated)"><input value={form.technologies} onChange={e=>setForm({...form,technologies:e.target.value})}/></Field><div className="form-grid two"><Field label="Live URL"><input value={form.liveUrl} onChange={e=>setForm({...form,liveUrl:e.target.value})}/></Field><Field label="GitHub URL"><input value={form.githubUrl} onChange={e=>setForm({...form,githubUrl:e.target.value})}/></Field></div><label className="checkbox"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/><span>Featured project</span></label><Field label="Project images (up to 5 new files)"><input type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,5))}/></Field><div className="image-preview-row">{existing.map((url,i)=><div key={url} className="preview-thumb"><img src={url}/><button type="button" onClick={()=>setExisting(existing.filter((_,idx)=>idx!==i))}><X size={13}/></button></div>)}</div><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy?<Loader2 className="spin"/>:<Save size={16}/>}Save project</button></div></form></Modal>}

function AdminGallery({onChanged}){const [items,setItems]=useState([]);const [form,setForm]=useState({title:'',description:'',featured:false});const [file,setFile]=useState(null);const [busy,setBusy]=useState(false);const load=()=>api.get('/admin/api/gallery').then(d=>setItems(d.images||[]));useEffect(()=>{load()},[]);const upload=async e=>{e.preventDefault();if(!file||!form.title)return;setBusy(true);try{const fd=new FormData();fd.append('image',file);fd.append('title',form.title);fd.append('description',form.description);fd.append('featured',String(form.featured));await api.form('/admin/api/gallery','POST',fd);setForm({title:'',description:'',featured:false});setFile(null);e.target.reset();await load();onChanged()}catch(e){uiAlert(e.message)}finally{setBusy(false)}};const update=async item=>{const title=await uiPrompt('Image title',item.title,'Edit gallery image');if(title===null)return;const description=(await uiPrompt('Image description',item.description||'','Edit gallery image'))??'';const featured=await uiConfirm(item.featured?'Remove this image from the homepage?':'Show this image on the homepage?','Homepage featured image');await api.send(`/admin/api/gallery/${item._id}`,'PUT',{title,description,featured});load();onChanged()};const toggleFeatured=async item=>{await api.send(`/admin/api/gallery/${item._id}`,'PUT',{title:item.title,description:item.description||'',featured:!item.featured});load();onChanged()};const remove=async id=>{if(!(await uiConfirm('Delete this gallery image?','Delete gallery image?')))return;await api.send(`/admin/api/gallery/${id}`,'DELETE',{});load();onChanged()};return <AdminSection title="Gallery manager" subtitle="Upload, organize and choose multiple images to feature on the homepage. Everything else stays in the full gallery."><form className="glass upload-form" onSubmit={upload}><div className="drop-zone"><Upload/><div><strong>Upload an image</strong><span>{file?file.name:'PNG, JPG or WEBP · max 10 MB'}</span></div><input required type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)}/></div><div className="form-grid two"><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Image title"/><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Short description"/></div><label className="checkbox featured-check"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/><span>Feature this image on the homepage</span></label><button className="btn btn-primary" disabled={busy}>{busy?<Loader2 className="spin"/>:<Upload size={16}/>}Upload image</button></form><div className="gallery-admin-grid">{items.map(g=><div className={`gallery-admin-card ${g.featured?'is-featured':''}`} key={g._id}><div className="gallery-admin-media"><img src={g.imageUrl}/>{g.featured&&<span className="featured-badge">★ Homepage</span>}</div><div><strong>{g.title}</strong><span>{g.description||'No description yet.'}</span><div className="admin-actions"><button onClick={()=>toggleFeatured(g)}>{g.featured?'★ Featured':'☆ Feature'}</button><button onClick={()=>update(g)}><Pencil/>Edit</button><a href={`/admin/api/gallery/${g._id}/download`} target="_blank" rel="noreferrer"><Download/>Download</a><button className="danger" onClick={()=>remove(g._id)}><Trash2/>Delete</button></div></div></div>)}</div></AdminSection>}
function AdminDonations({onChanged}){const [items,setItems]=useState([]);const [modal,setModal]=useState(null);const load=()=>api.get('/admin/api/donations').then(d=>setItems(d.donations||[]));useEffect(()=>{ load(); },[]);const remove=async id=>{if(!(await uiConfirm('Delete this donation?','Delete donation?')))return;await api.send(`/admin/api/donations/${id}`,'DELETE',{});load();onChanged()};return <AdminSection title="Donation records" subtitle="Review, add, edit and delete donations retained in the existing MongoDB collection."><div className="admin-toolbar"><div className="metric-inline"><WalletCards/><strong>₹{items.reduce((s,d)=>s+Number(d.amount||0),0).toLocaleString('en-IN')}</strong><span>Total recorded</span></div><button className="btn btn-primary" onClick={()=>setModal({})}><Plus size={16}/>Add donation</button></div><div className="table-wrap glass"><table><thead><tr><th>Name</th><th>Email</th><th>Amount</th><th>Date</th><th></th></tr></thead><tbody>{items.map(d=><tr key={d._id}><td>{d.name}</td><td>{d.email}</td><td>₹{Number(d.amount).toLocaleString('en-IN')}</td><td>{new Date(d.date).toLocaleDateString('en-IN')}</td><td><button onClick={()=>setModal(d)}><Pencil/></button><button onClick={()=>remove(d._id)}><Trash2/></button></td></tr>)}</tbody></table></div>{modal&&<DonationEditor donation={modal._id?modal:null} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();onChanged()}}/>}</AdminSection>}
function DonationEditor({donation,onClose,onSaved}){const [f,setF]=useState({name:donation?.name||'',email:donation?.email||'',amount:donation?.amount||''});const [busy,setBusy]=useState(false);const save=async e=>{e.preventDefault();setBusy(true);try{await api.send(donation?`/admin/api/donations/${donation._id}`:'/admin/api/donations',donation?'PUT':'POST',f);onSaved()}catch(e){uiAlert(e.message)}finally{setBusy(false)}};return <Modal title={donation?'Edit donation':'Add donation'} onClose={onClose}><form className="editor-form" onSubmit={save}><Field label="Name"><input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field><Field label="Email"><input required type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></Field><Field label="Amount (₹)"><input required type="number" min="1" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/></Field><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy?<Loader2 className="spin"/>:<Save/>}Save</button></div></form></Modal>}

function AdminVisitors({onChanged}){const [count,setCount]=useState(0);const load=()=>api.get('/admin/visitor-stats').then(d=>setCount(d.count||0));useEffect(()=>{ load(); },[]);const save=async()=>{const r=await api.send('/admin/visitor-count','PUT',{count:Number(count)});setCount(r.count);onChanged()};return <AdminSection title="Visitors" subtitle="View and manually adjust the persistent visitor counter used on the website."><div className="visitor-admin glass"><div className="visitor-big"><Eye/><strong>{Number(count).toLocaleString('en-IN')}</strong><span>Total visitors</span></div><div><Field label="Set visitor count"><input type="number" min="0" value={count} onChange={e=>setCount(e.target.value)}/></Field><button className="btn btn-primary" onClick={save}><Save size={16}/>Save count</button></div></div></AdminSection>}

function AdminMessages({onChanged}){const [items,setItems]=useState([]);const [q,setQ]=useState('');const load=()=>api.get('/admin/api/messages').then(d=>setItems(d.messages||[]));useEffect(()=>{ load(); },[]);const toggle=async id=>{await api.send(`/admin/api/messages/${id}/read`,'PUT',{});load();onChanged()};const remove=async id=>{if(!(await uiConfirm('Delete this message?','Delete message?')))return;await api.send(`/admin/api/messages/${id}`,'DELETE',{});load();onChanged()};const filtered=items.filter(m=>`${m.name} ${m.email} ${m.message}`.toLowerCase().includes(q.toLowerCase()));return <AdminSection title="Message inbox" subtitle="Messages saved from the new contact form appear here with read/unread controls."><div className="admin-toolbar"><div className="search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search messages..."/></div><button className="btn btn-ghost" onClick={load}><RefreshCw size={16}/>Refresh</button></div><div className="message-list">{filtered.map(m=><article className={`message-card glass ${m.read?'':'unread'}`} key={m._id}><div className="message-avatar">{m.name?.slice(0,1).toUpperCase()}</div><div className="message-main"><div className="message-top"><div><strong>{m.name}</strong><span>{m.email}</span></div><time>{new Date(m.createdAt).toLocaleString('en-IN')}</time></div><p>{m.message}</p><div className="admin-actions"><button onClick={()=>toggle(m._id)}>{m.read?'Mark unread':'Mark read'}</button><button className="danger" onClick={()=>remove(m._id)}><Trash2/>Delete</button></div></div></article>)}{!filtered.length&&<EmptyState icon={Mail} text="No messages found."/>}</div></AdminSection>}
function AdminRatings(){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState('');
  const load=()=>{
    setLoading(true);
    api.get('/admin/api/ratings')
      .then(r=>setItems(Array.isArray(r.ratings)?r.ratings:[]))
      .catch(e=>uiAlert(e.message))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load()},[]);
  const avg=items.length?(items.reduce((s,r)=>s+Number(r.rating||0),0)/items.length).toFixed(1):'0.0';
  const filtered=items.filter(r=>`${r.feedback||''} ${r.rating||''}`.toLowerCase().includes(q.toLowerCase()));
  const remove=async id=>{
    if(!(await uiConfirm('This permanently removes the visitor rating.','Remove rating?')))return;
    try{await api.send(`/admin/api/ratings/${id}`,'DELETE',{});load()}catch(e){uiAlert(e.message)}
  };
  return <AdminSection title="Ratings & feedback" subtitle="See visitor ratings in a clean card layout, read feedback and moderate individual reviews.">
    <div className="rating-admin-summary">
      <div className="rating-admin-score"><Star fill="currentColor"/><div><strong>{avg}</strong><span>Average rating</span></div></div>
      <div className="rating-admin-score"><Users/><div><strong>{items.length}</strong><span>Total ratings</span></div></div>
      <div className="rating-admin-score"><MessageSquare/><div><strong>{items.filter(r=>String(r.feedback||'').trim()).length}</strong><span>Written feedback</span></div></div>
    </div>
    <div className="admin-toolbar rating-toolbar">
      <div className="search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search feedback..."/></div>
      <button className="btn btn-ghost" onClick={load}><RefreshCw size={16}/>Refresh</button>
    </div>
    {loading?<div className="rating-loading"><Loader2 className="spin"/><span>Loading ratings...</span></div>:
      <div className="rating-admin-grid">
        {filtered.map((r,index)=>{const stars=Number(r.rating||0);return <article className="rating-admin-card glass" key={r._id}>
          <div className="rating-card-top">
            <div className="rating-score-pill"><Star size={15} fill="currentColor"/><strong>{stars}.0</strong><span>/ 5</span></div>
            <button className="icon-btn small danger" onClick={()=>remove(r._id)} aria-label="Remove rating"><Trash2 size={14}/></button>
          </div>
          <div className="rating-card-stars">{[1,2,3,4,5].map(i=><Star key={i} size={17} fill={i<=stars?'currentColor':'none'} className={i<=stars?'on':''}/>)}</div>
          <div className="rating-card-feedback">{r.feedback?.trim()?<p>“{r.feedback.trim()}”</p>:<p className="muted-feedback">No written feedback.</p>}</div>
          <div className="rating-card-footer"><span><Clock size={13}/>{r.createdAt?new Date(r.createdAt).toLocaleString('en-IN'):''}</span><span className="rating-index">#{String(index+1).padStart(2,'0')}</span></div>
        </article>})}
        {!filtered.length&&<div className="rating-empty-wrap"><EmptyState icon={Star} text="No ratings found."/></div>}
      </div>}
  </AdminSection>
}

function AdminResume(){const [data,setData]=useState(null);const [busy,setBusy]=useState(false);useEffect(()=>{api.get('/admin/api/portfolio-content').then(r=>{const c=r.content||{};const x=c.resume||{};setData({name:c.hero?.name||'Ritik Verma',title:c.hero?.typing||'B.Tech CSE Student · Developer',summary:x.summary||c.about?.text||'',email:x.email||'',phone:x.phone||'',location:x.location||'',website:x.website||'',github:x.github||'',linkedin:x.linkedin||'',experience:x.experience||[],education:x.education?.length?x.education:(c.education||[]),certifications:x.certifications||[],achievements:x.achievements||[],interests:x.interests||[]});}).catch(e=>uiAlert(e.message));},[]);if(!data)return <AdminSection title="Resume editor" subtitle="Loading your resume…"><Loader2 className="spin"/></AdminSection>;const patch=(key,value)=>setData(d=>({...d,[key]:value}));const listChange=(key,i,field,value)=>setData(d=>({...d,[key]:d[key].map((v,j)=>j===i?{...v,[field]:value}:v)}));const add=(key,item)=>setData(d=>({...d,[key]:[...(d[key]||[]),item]}));const remove=(key,i)=>setData(d=>({...d,[key]:d[key].filter((_,j)=>j!==i)}));const save=async()=>{setBusy(true);try{await api.send('/admin/api/portfolio-content','PUT',{resume:data,hero:{...(data.hero||{}),name:data.name,typing:data.title}});uiAlert('Resume saved successfully.','Resume saved');}catch(e){uiAlert(e.message)}finally{setBusy(false)}};return <AdminSection title="Resume editor" subtitle="Edit your resume directly from the dashboard. Changes are saved to the existing MongoDB-backed portfolio content."><div className="resume-editor-grid"><BuilderCard title="Profile"><div className="form-grid two"><Field label="Name"><input value={data.name} onChange={e=>patch('name',e.target.value)}/></Field><Field label="Resume title"><input value={data.title} onChange={e=>patch('title',e.target.value)}/></Field><Field label="Email"><input value={data.email} onChange={e=>patch('email',e.target.value)}/></Field><Field label="Phone"><input value={data.phone} onChange={e=>patch('phone',e.target.value)}/></Field><Field label="Location"><input value={data.location} onChange={e=>patch('location',e.target.value)}/></Field><Field label="Website"><input value={data.website} onChange={e=>patch('website',e.target.value)}/></Field><Field label="GitHub"><input value={data.github} onChange={e=>patch('github',e.target.value)}/></Field><Field label="LinkedIn"><input value={data.linkedin} onChange={e=>patch('linkedin',e.target.value)}/></Field></div><Field label="Professional summary"><textarea value={data.summary} onChange={e=>patch('summary',e.target.value)}/></Field></BuilderCard><BuilderCard title="Experience"><div className="repeat-list">{data.experience.map((e,i)=><div className="resume-edit-row" key={i}><div className="form-grid two"><input placeholder="Role" value={e.role||''} onChange={x=>listChange('experience',i,'role',x.target.value)}/><input placeholder="Company" value={e.company||''} onChange={x=>listChange('experience',i,'company',x.target.value)}/><input placeholder="Period" value={e.period||''} onChange={x=>listChange('experience',i,'period',x.target.value)}/></div><textarea placeholder="What did you do?" value={e.description||''} onChange={x=>listChange('experience',i,'description',x.target.value)}/><button className="danger" onClick={()=>remove('experience',i)}><Trash2/>Remove</button></div>)}</div><button className="btn btn-ghost" onClick={()=>add('experience',{role:'',company:'',period:'',description:''})}><Plus/>Add experience</button></BuilderCard><BuilderCard title="Education"><div className="repeat-list">{data.education.map((e,i)=><div className="resume-edit-row" key={i}><div className="form-grid two"><input placeholder="Degree / title" value={e.title||''} onChange={x=>listChange('education',i,'title',x.target.value)}/><input placeholder="Institute" value={e.institute||''} onChange={x=>listChange('education',i,'institute',x.target.value)}/><input placeholder="Status / year" value={e.status||''} onChange={x=>listChange('education',i,'status',x.target.value)}/></div><button className="danger" onClick={()=>remove('education',i)}><Trash2/>Remove</button></div>)}</div><button className="btn btn-ghost" onClick={()=>add('education',{title:'',institute:'',status:''})}><Plus/>Add education</button></BuilderCard><BuilderCard title="Certifications"><div className="repeat-list">{data.certifications.map((e,i)=><div className="resume-edit-row" key={i}><div className="form-grid two"><input placeholder="Certification" value={e.name||''} onChange={x=>listChange('certifications',i,'name',x.target.value)}/><input placeholder="Issuer" value={e.issuer||''} onChange={x=>listChange('certifications',i,'issuer',x.target.value)}/><input placeholder="Year" value={e.year||''} onChange={x=>listChange('certifications',i,'year',x.target.value)}/></div><button className="danger" onClick={()=>remove('certifications',i)}><Trash2/>Remove</button></div>)}</div><button className="btn btn-ghost" onClick={()=>add('certifications',{name:'',issuer:'',year:''})}><Plus/>Add certification</button></BuilderCard><BuilderCard title="Achievements"><TagEditor values={data.achievements||[]} onChange={v=>patch('achievements',v)}/></BuilderCard><BuilderCard title="Interests"><TagEditor values={data.interests||[]} onChange={v=>patch('interests',v)}/></BuilderCard></div><div className="sticky-save"><button className="btn btn-primary" onClick={save} disabled={busy}>{busy?<Loader2 className="spin"/>:<Save/>}Save resume</button></div></AdminSection>}
function WebsiteBuilder({onSaved}){const [data,setData]=useState(null);const [busy,setBusy]=useState(false);useEffect(()=>{ api.get('/admin/api/portfolio-content').then(r=>setData(r.content)).catch(e=>uiAlert(e.message)); },[]);if(!data)return <AdminSection title="Website builder" subtitle="Loading your content…"><Loader2 className="spin"/></AdminSection>;const patch=(path,value)=>setData(d=>{const n=structuredClone(d);let cur=n;path.slice(0,-1).forEach(k=>cur=cur[k]);cur[path[path.length-1]]=value;return n});const save=async()=>{setBusy(true);try{await api.send('/admin/api/portfolio-content','PUT',data);onSaved()}catch(e){uiAlert(e.message)}finally{setBusy(false)}};return <AdminSection title="Website builder" subtitle="Change the text and details that appear on the site. Your existing saved data stays in the same place."><div className="builder-grid"><BuilderCard title="Hero"><div className="form-grid two"><Field label="Name"><input value={data.hero.name} onChange={e=>patch(['hero','name'],e.target.value)}/></Field><Field label="Typing line"><input value={data.hero.typing} onChange={e=>patch(['hero','typing'],e.target.value)}/></Field></div><Field label="Tagline"><input value={data.hero.tagline} onChange={e=>patch(['hero','tagline'],e.target.value)}/></Field><div className="role-editor"><div className="role-editor-head"><strong>Animated role words</strong><span>These rotate in the hero section.</span></div>{(data.hero.roles||['Developer','Problem Solver','Builder','Lifelong Learner']).map((role,i)=><div className="repeat-row" key={i}><input value={role} placeholder={`Role ${i+1}`} onChange={e=>{const roles=[...(data.hero.roles||[])];roles[i]=e.target.value;setData({...data,hero:{...data.hero,roles}})}}/><button type="button" className="icon-btn small danger" onClick={()=>{const roles=(data.hero.roles||[]).filter((_,j)=>j!==i);setData({...data,hero:{...data.hero,roles}})}}><Trash2 size={14}/></button></div>)}<button type="button" className="btn btn-ghost" onClick={()=>setData({...data,hero:{...data.hero,roles:[...(data.hero.roles||[]),'New role']}})}><Plus size={15}/>Add role</button></div></BuilderCard><BuilderCard title="About"><Field label="Title"><input value={data.about.title} onChange={e=>patch(['about','title'],e.target.value)}/></Field><Field label="Text"><textarea value={data.about.text} onChange={e=>patch(['about','text'],e.target.value)}/></Field></BuilderCard><BuilderCard title="Counters"><div className="form-grid two"><Field label="Problems solved"><input type="number" value={data.counters.problemsSolved} onChange={e=>patch(['counters','problemsSolved'],+e.target.value)}/></Field><Field label="Projects label"><input value={data.counters.projectsLabel} onChange={e=>patch(['counters','projectsLabel'],e.target.value)}/></Field><Field label="Years label"><input value={data.counters.yearsLabel} onChange={e=>patch(['counters','yearsLabel'],e.target.value)}/></Field><Field label="Hours label"><input value={data.counters.hoursLabel} onChange={e=>patch(['counters','hoursLabel'],e.target.value)}/></Field></div><Field label="Coding start date"><input type="date" value={data.counters.startDate} onChange={e=>patch(['counters','startDate'],e.target.value)}/></Field></BuilderCard><BuilderCard title="Education"><div className="repeat-list">{data.education.map((e,i)=><div className="repeat-row" key={i}><input value={e.title||''} onChange={x=>{const a=data.education.map((v,j)=>j===i?{...v,title:x.target.value}:v);setData({...data,education:a})}} placeholder="Degree / title"/><input value={e.institute||''} onChange={x=>{const a=data.education.map((v,j)=>j===i?{...v,institute:x.target.value}:v);setData({...data,education:a})}} placeholder="Institute"/><input value={e.status||''} onChange={x=>{const a=data.education.map((v,j)=>j===i?{...v,status:x.target.value}:v);setData({...data,education:a})}} placeholder="Status"/></div>)}</div><button className="btn btn-ghost" onClick={()=>setData({...data,education:[...data.education,{title:'New education',institute:'Institute',status:'Status'}]})}><Plus/>Add education</button></BuilderCard><BuilderCard title="Skills"><TagEditor values={data.skills||[]} onChange={v=>setData({...data,skills:v})}/></BuilderCard><BuilderCard title="Progress skills"><div className="repeat-list">{(data.progressSkills||[]).map((s,i)=><div className="repeat-row" key={i}><input value={s.name} onChange={e=>{const a=data.progressSkills.map((v,j)=>j===i?{...v,name:e.target.value}:v);setData({...data,progressSkills:a})}}/><input type="number" min="0" max="100" value={s.percentage} onChange={e=>{const a=data.progressSkills.map((v,j)=>j===i?{...v,percentage:+e.target.value}:v);setData({...data,progressSkills:a})}}/><button className="icon-btn small danger" onClick={()=>setData({...data,progressSkills:data.progressSkills.filter((_,j)=>j!==i)})}><Trash2/></button></div>)}</div><button className="btn btn-ghost" onClick={()=>setData({...data,progressSkills:[...(data.progressSkills||[]),{name:'New skill',percentage:50}]})}><Plus/>Add skill</button></BuilderCard><BuilderCard title="Donation"><div className="form-grid two"><Field label="Title"><input value={data.donation.title} onChange={e=>patch(['donation','title'],e.target.value)}/></Field><Field label="Goal"><input type="number" value={data.donation.goal} onChange={e=>patch(['donation','goal'],+e.target.value)}/></Field><Field label="Button text"><input value={data.donation.buttonText} onChange={e=>patch(['donation','buttonText'],e.target.value)}/></Field><Field label="Leaderboard title"><input value={data.donation.leaderboardTitle} onChange={e=>patch(['donation','leaderboardTitle'],e.target.value)}/></Field></div></BuilderCard><BuilderCard title="Contact & thank you"><div className="form-grid two"><Field label="Contact title"><input value={data.contact.title} onChange={e=>patch(['contact','title'],e.target.value)}/></Field><Field label="Button text"><input value={data.contact.buttonText} onChange={e=>patch(['contact','buttonText'],e.target.value)}/></Field><Field label="Name placeholder"><input value={data.contact.namePlaceholder} onChange={e=>patch(['contact','namePlaceholder'],e.target.value)}/></Field><Field label="Email placeholder"><input value={data.contact.emailPlaceholder} onChange={e=>patch(['contact','emailPlaceholder'],e.target.value)}/></Field></div><Field label="Thank-you title"><input value={data.thankYou.title} onChange={e=>patch(['thankYou','title'],e.target.value)}/></Field></BuilderCard></div><div className="sticky-save"><button className="btn btn-primary" onClick={save} disabled={busy}>{busy?<Loader2 className="spin"/>:<Save/>}Save website content</button></div></AdminSection>}
function BuilderCard({title,children}){return <div className="glass builder-card"><div className="builder-card-head"><h3>{title}</h3><Sparkles size={17}/></div>{children}</div>}
function TagEditor({values,onChange}){const [newV,setNewV]=useState('');return <div><div className="tag-editor">{values.map((v,i)=><span key={`${v}-${i}`}>{v}<button onClick={()=>onChange(values.filter((_,j)=>j!==i))}><X size={12}/></button></span>)}</div><div className="inline-add"><input value={newV} onChange={e=>setNewV(e.target.value)} placeholder="Add skill"/><button className="btn btn-ghost" onClick={()=>{if(newV.trim())onChange([...values,newV.trim()]);setNewV('')}}><Plus/>Add</button></div></div>}
function ThemeDesigner({onSaved}){
 const [theme,setTheme]=useState(DEFAULT_THEME);
 const [busy,setBusy]=useState(false);
 const [activePreset,setActivePreset]=useState('Midnight');
 useEffect(()=>{api.get('/admin/api/theme').then(d=>{if(d?.theme){setTheme({...DEFAULT_THEME,...d.theme});applyTheme(d.theme);const hit=Object.entries(THEME_PRESETS).find(([,v])=>Object.keys(v).every(k=>v[k]===d.theme[k]));if(hit)setActivePreset(hit[0])}}).catch(e=>uiAlert(e.message));},[]);
 const update=(key,value)=>{
   let next={...theme,[key]:value};
   if(key==='mode' && value==='light' && /^#(0|1|2)[0-9a-f]{5}$/i.test(next.cardBackground||'')){next.cardBackground='#fffdf7';next.cardBorder='#d8ddea';next.heading='#182033';next.body='#667085'}
   if(key==='mode' && value==='dark' && /^#(f|e|d|c)[0-9a-f]{5}$/i.test(next.cardBackground||'')){next.cardBackground='#17122f';next.cardBorder='#ffffff';next.heading='#f8f7ff';next.body='#a9a5c0'}
   setTheme(next);setActivePreset('Custom');applyTheme(next);try{localStorage.setItem('portfolio-theme',JSON.stringify(next));localStorage.setItem('portfolio-theme-mode',next.mode)}catch{}
 };
 const choosePreset=(name)=>{const next={...THEME_PRESETS[name]};setTheme(next);setActivePreset(name);applyTheme(next);try{localStorage.setItem('portfolio-theme',JSON.stringify(next));localStorage.setItem('portfolio-theme-mode',next.mode)}catch{}};
 const save=async()=>{setBusy(true);try{const r=await api.send('/admin/api/theme','PUT',{theme});const saved=r.theme||theme;applyTheme(saved);setTheme(saved);try{localStorage.setItem('portfolio-theme',JSON.stringify(saved));localStorage.setItem('portfolio-theme-mode',saved.mode)}catch{}onSaved()}catch(e){uiAlert(e.message)}finally{setBusy(false)}};
 return <AdminSection title="Theme Designer" subtitle="Change the visual identity of the entire portfolio without editing CSS. Changes preview instantly and are published when you save.">
   <div className="theme-designer-layout">
    <div className="theme-controls">
      <div className="glass theme-card"><div className="theme-card-head"><div><span className="eyebrow">Mode</span><h3>Choose your base</h3></div><Palette size={19}/></div><div className="theme-mode-grid"><button className={theme.mode==='dark'?'selected':''} onClick={()=>update('mode','dark')}><Moon/><span><strong>Dark</strong><small>Deep and immersive</small></span></button><button className={theme.mode==='light'?'selected':''} onClick={()=>update('mode','light')}><Sun/><span><strong>Light</strong><small>Clean and editorial</small></span></button></div></div>
      <div className="glass theme-card"><div className="theme-card-head"><div><span className="eyebrow">Color system</span><h3>Your palette</h3></div><span className="theme-custom-pill">{activePreset}</span></div><div className="theme-color-grid">
       <ThemeColor label="Primary" value={theme.primary} onChange={v=>update('primary',v)}/><ThemeColor label="Secondary" value={theme.secondary} onChange={v=>update('secondary',v)}/><ThemeColor label="Accent" value={theme.accent} onChange={v=>update('accent',v)}/>
      </div></div>
      <div className="glass theme-card"><div className="theme-card-head"><div><span className="eyebrow">Surfaces</span><h3>Cards & borders</h3></div></div><div className="theme-color-grid"><ThemeColor label="Card background" value={theme.cardBackground} onChange={v=>update('cardBackground',v)}/><ThemeColor label="Card border" value={theme.cardBorder} onChange={v=>update('cardBorder',v)}/></div></div>
      <div className="glass theme-card"><div className="theme-card-head"><div><span className="eyebrow">Typography</span><h3>Text colors</h3></div></div><div className="theme-color-grid"><ThemeColor label="Heading" value={theme.heading} onChange={v=>update('heading',v)}/><ThemeColor label="Body" value={theme.body} onChange={v=>update('body',v)}/></div></div>
      <div className="theme-save-row"><button className="btn btn-primary" onClick={save} disabled={busy}>{busy?<Loader2 className="spin"/>:<Save/>}Save Theme</button><span>Applies to the public website and admin visual system.</span></div>
    </div>
    <div className="theme-preview-wrap"><div className="theme-preview-label"><span className="eyebrow">Live preview</span><strong>{activePreset} theme</strong></div><div className="theme-preview" style={{'--preview-primary':theme.primary,'--preview-secondary':theme.secondary,'--preview-accent':theme.accent,'--preview-card':theme.cardBackground,'--preview-border':theme.cardBorder,'--preview-heading':theme.heading,'--preview-body':theme.body}}><div className="theme-preview-top"><div className="preview-brand"><i></i><span>Ritik Verma</span></div><div className="preview-nav"><b>Home</b><b>Projects</b><b>Resume</b></div><span className="preview-mode">{theme.mode==='dark'?'Dark':'Light'}</span></div><div className="theme-preview-hero"><span className="eyebrow">Developer · Student</span><h4>Build. Learn. <em>Improve.</em></h4><p>A small preview of how your colors work together across the site.</p><div><button>Explore projects</button><button className="secondary">View resume</button></div></div><div className="theme-preview-cards"><div><strong>Projects</strong><span>12 completed</span></div><div><strong>Skills</strong><span>C++ · React · Node</span></div><div><strong>Contact</strong><span>Let's work together</span></div></div></div><div className="theme-presets"><div><span className="eyebrow">Presets</span><p>Start with a palette, then customize every color.</p></div><div className="preset-grid">{Object.entries(THEME_PRESETS).map(([name,preset])=><button key={name} className={activePreset===name?'active':''} onClick={()=>choosePreset(name)}><span className="preset-swatch" style={{background:`linear-gradient(135deg,${preset.primary},${preset.secondary},${preset.accent})`}}/><strong>{name}</strong><small>{preset.mode==='dark'?'Dark':'Light'}</small></button>)}</div></div></div>
   </div>
 </AdminSection>
}
function ThemeColor({label,value,onChange}){const safe=/^#[0-9a-fA-F]{6}$/.test(value||'')?value:'#000000';return <label className="theme-color"><span>{label}</span><div><input type="color" value={safe} onChange={e=>onChange(e.target.value)}/><code>{value}</code></div></label>}

function AdminSettings({onSaved}){const [settings,setSettings]=useState(null);const [busy,setBusy]=useState(false);const [image,setImage]=useState(null);const [preview,setPreview]=useState('');useEffect(()=>{api.get('/admin/api/settings').then(d=>{setSettings(d.settings);setPreview(normalizeImage(d.settings?.profileImage))}).catch(e=>uiAlert(e.message));},[]);useEffect(()=>()=>{if(preview?.startsWith('blob:'))URL.revokeObjectURL(preview)},[preview]);if(!settings)return <AdminSection title="Settings" subtitle="Loading…"><Loader2 className="spin"/></AdminSection>;const choose=e=>{const f=e.target.files?.[0];if(!f)return;setImage(f);const url=URL.createObjectURL(f);setPreview(old=>{if(old?.startsWith('blob:'))URL.revokeObjectURL(old);return url})};const save=async()=>{setBusy(true);try{await api.send('/admin/api/settings','PUT',settings);let profileImage=settings.profileImage;if(image){const fd=new FormData();fd.append('image',image);const r=await api.form('/admin/api/profile-image','POST',fd);profileImage=r.imageUrl||profileImage;setSettings(s=>({...s,profileImage}));setPreview(profileImage);setImage(null)}onSaved({profileImage})}catch(e){uiAlert(e.message)}finally{setBusy(false)}};const remove=async()=>{if(!(await uiConfirm('Reset the profile image to the default photo?','Reset profile photo?')))return;await api.send('/admin/api/profile-image','DELETE',{});const profileImage=ASSET('photoweb.png');setImage(null);setPreview(profileImage);setSettings({...settings,profileImage});onSaved({profileImage})};return <AdminSection title="Website settings" subtitle="Update the basic site information, social links, and profile photo."><div className="settings-grid"><div className="glass settings-card"><div className="settings-profile"><div className="settings-photo-preview"><img src={preview||normalizeImage(settings.profileImage)} alt="Profile preview"/>{image&&<span>Unsaved preview</span>}</div><div><strong>Profile photo</strong><span>Used across the website, admin sidebar and login screen.</span><div className="admin-actions"><label className="btn btn-ghost"><Upload size={15}/>Choose<input type="file" hidden accept="image/*" onChange={choose}/></label><button className="danger" onClick={remove}><Trash2/>Reset</button></div><small className="settings-file-name">{image?image.name:'Choose a new image and the preview updates instantly.'}</small></div></div></div><div className="glass settings-card"><div className="form-grid two"><Field label="Site title"><input value={settings.siteTitle||''} onChange={e=>setSettings({...settings,siteTitle:e.target.value})}/></Field><Field label="Contact email"><input value={settings.contactEmail||''} onChange={e=>setSettings({...settings,contactEmail:e.target.value})}/></Field><Field label="Instagram"><input value={settings.instagram||''} onChange={e=>setSettings({...settings,instagram:e.target.value})}/></Field><Field label="GitHub"><input value={settings.github||''} onChange={e=>setSettings({...settings,github:e.target.value})}/></Field><Field label="LinkedIn"><input value={settings.linkedin||''} onChange={e=>setSettings({...settings,linkedin:e.target.value})}/></Field></div><Field label="Site description"><textarea value={settings.siteDescription||''} onChange={e=>setSettings({...settings,siteDescription:e.target.value})}/></Field></div></div><div className="glass server-control-card"><div><span className="eyebrow">System</span><h3>Server controls</h3><p>Restart the Node server with one click. The server runner brings it back automatically, so you don't need to stop and start it manually.</p></div><button className="btn btn-ghost" onClick={async()=>{if(!(await uiConfirm('Restart the server now? Your website may be unavailable for a few seconds.','Restart server?')))return;try{await api.send('/admin/api/server/restart','POST',{})}catch{}setTimeout(()=>location.reload(),3500)}}><RefreshCw size={16}/>Restart server</button></div><button className="btn btn-primary" onClick={save} disabled={busy}>{busy?<Loader2 className="spin"/>:<Save/>}Save settings</button></AdminSection>}

function AdminSystemHealth(){
 const empty={status:'checking',services:{mongodb:{status:'checking',label:'Checking…'},cloudinary:{status:'checking',label:'Checking…'},razorpay:{status:'checking',label:'Checking…'},api:{status:'checking',label:'Checking…'},frontend:{status:'checking',label:'Checking…'}},responseTimeMs:0,uptime:'—',uptimeSeconds:0,memory:{rss:0,heapUsed:0},timestamp:''};
 const [data,setData]=useState(empty); const [busy,setBusy]=useState(true); const [lastChecked,setLastChecked]=useState(null);
 const load=async()=>{setBusy(true);try{const r=await api.get('/admin/api/system-health');setData({...empty,...r,services:{...empty.services,...r.services}});setLastChecked(new Date())}catch(e){setData(d=>({...d,status:'degraded',services:{...d.services,api:{status:'error',label:'Unavailable'}}}));}finally{setBusy(false)}};
 useEffect(()=>{load();const id=setInterval(load,15000);return()=>clearInterval(id)},[]);
 const service=(key)=>data.services?.[key]||empty.services[key];
 const items=[['mongodb','MongoDB','Database connection',Database],['cloudinary','Cloudinary','Media storage',Cloud],['razorpay','Razorpay','Payments API',CreditCard],['api','API','Backend service',Activity],['frontend','Frontend','Website build',Globe2]];
 const statusLabel=s=>s==='connected'||s==='healthy'?'Connected':s==='development'?'Dev server':s==='not_configured'?'Not configured':s==='checking'?'Checking…':'Error';
 return <AdminSection title="System Health" subtitle="A live view of the services that keep your portfolio running.">
   <div className="health-hero glass"><div><span className="eyebrow">System health</span><h3>{data.status==='healthy'?'Everything looks healthy.':'Some services need attention.'}</h3><p>Checks refresh automatically every 15 seconds. External service checks are cached briefly to keep the dashboard lightweight.</p></div><button className="btn btn-ghost" onClick={load} disabled={busy}><RefreshCw className={busy?'spin':''} size={16}/>Refresh now</button></div>
   <div className="system-health-grid">{items.map(([key,label,desc,Icon])=>{const x=service(key);const ok=x.status==='connected'||x.status==='healthy'||x.status==='development';return <article className={`system-health-card glass ${ok?'healthy':'attention'}`} key={key}><div className="system-health-icon"><Icon size={20}/></div><div className="system-health-copy"><div className="system-health-title"><strong>{label}</strong><span className={`health-dot ${ok?'ok':'bad'}`}/><b>{statusLabel(x.status)}</b></div><span>{desc}</span>{x.error&&<small title={x.error}>{x.error}</small>}</div></article>})}</div>
   <div className="health-metrics"><div className="glass health-metric"><span>Response time</span><strong>{Number(data.responseTimeMs||0)}ms</strong><small>{lastChecked?`Checked ${lastChecked.toLocaleTimeString('en-IN')}`:'Waiting for check'}</small></div><div className="glass health-metric"><span>Uptime</span><strong>{data.uptime||'—'}</strong><small>{Number(data.uptimeSeconds||0).toLocaleString('en-IN')} seconds</small></div><div className="glass health-metric"><span>Memory</span><strong>{Number(data.memory?.rss||0)} MB</strong><small>RSS · heap {Number(data.memory?.heapUsed||0)} MB</small></div><div className="glass health-metric"><span>Node</span><strong>{data.node||'—'}</strong><small>{data.hostname||'Server'}</small></div></div>
 </AdminSection>
}

function AdminSecurity(){
 const [info,setInfo]=useState(null); const [busy,setBusy]=useState(false); const [changing,setChanging]=useState(false);
 const [form,setForm]=useState({currentPassword:'',newPassword:'',confirmPassword:''});
 const load=()=>api.get('/admin/api/security/status').then(setInfo).catch(e=>uiAlert(e.message));
 useEffect(load,[]);
 const logoutAll=async()=>{if(!(await uiConfirm('This will sign out every active admin session, including this browser.','Log out all sessions?')))return;setBusy(true);try{await api.send('/admin/api/security/logout-all','POST',{});location.href='/admin/login'}catch(e){uiAlert(e.message)}finally{setBusy(false)}};
 const changePassword=async(e)=>{e.preventDefault();if(form.newPassword.length<8)return uiAlert('New password must contain at least 8 characters.');if(form.newPassword!==form.confirmPassword)return uiAlert('New passwords do not match.');setChanging(true);try{await api.send('/admin/api/security/change-password','POST',form);uiAlert('Password changed successfully. All sessions were signed out.','Password updated');location.href='/admin/login'}catch(e){uiAlert(e.message)}finally{setChanging(false)}};
 const sessions=info?.activeSessions||[];
 return <AdminSection title="Security" subtitle="Manage your password, active sessions and administrator access.">
  <div className="security-grid">
   <div className="glass security-card"><div className="security-icon"><ShieldCheck/></div><div><span className="eyebrow">Authentication</span><h3>{info?.passwordHashConfigured?'Password hashing enabled':'Password hash migration required'}</h3><p>{info?.passwordHashConfigured?'Admin passwords are verified with bcrypt.':'Use the migration utility or sign in once with the existing password.'}</p></div><span className={`security-badge ${info?.passwordHashConfigured?'good':'warn'}`}>{info?.passwordHashConfigured?'Protected':'Action needed'}</span></div>
   <div className="glass security-card"><div className="security-icon"><LockKeyhole/></div><div><span className="eyebrow">Session timeout</span><h3>4-hour maximum</h3><p>Sessions expire server-side after four hours. Refreshing the dashboard does not reset the absolute timeout.</p></div><span className="security-badge good">Enabled</span></div>
   <div className="glass security-card"><div className="security-icon"><Users/></div><div><span className="eyebrow">Active sessions</span><h3>{sessions.length} active session{sessions.length===1?'':'s'}</h3><p>{sessions.length?'Review the devices currently signed in to the admin panel.':'No active sessions recorded.'}</p></div><span className="security-badge good">Live</span></div>
  </div>
  <div className="security-meta-grid">
   <div className="glass security-meta"><span>Last login</span><strong>{info?.lastLoginAt?new Date(info.lastLoginAt).toLocaleString():'—'}</strong></div>
   <div className="glass security-meta"><span>Current login</span><strong>{info?.loginAt?new Date(info.loginAt).toLocaleString():'—'}</strong></div>
   <div className="glass security-meta"><span>Failed attempts</span><strong>{Number(info?.failedLoginAttempts||0)}</strong></div>
  </div>
  <div className="glass security-session-list"><div className="security-list-head"><div><span className="eyebrow">Devices</span><h3>Active sessions</h3></div><button className="btn btn-ghost" onClick={load}><RefreshCw size={15}/>Refresh</button></div>{sessions.length?sessions.map((s,i)=><div className="security-session" key={s.sessionId||i}><div className="security-session-icon"><Globe2/></div><div><strong>{s.current?'This device':'Admin session'}</strong><span>{s.userAgent||'Unknown browser'} · {s.ip||'Unknown IP'}</span></div><div><small>Signed in</small><b>{s.createdAt?new Date(s.createdAt).toLocaleString():'—'}</b></div><div><small>Expires</small><b>{s.expiresAt?new Date(s.expiresAt).toLocaleString():'—'}</b></div></div>):<div className="empty-state compact"><span>No active sessions.</span></div>}</div>
  <form className="glass security-password" onSubmit={changePassword}><div><span className="eyebrow">Password</span><h3>Change admin password</h3><p>Use a strong password with at least 8 characters. Changing it signs out all existing sessions.</p></div><div className="security-password-grid"><Field label="Current password"><input type="password" value={form.currentPassword} onChange={e=>setForm({...form,currentPassword:e.target.value})} autoComplete="current-password"/></Field><Field label="New password"><input type="password" value={form.newPassword} onChange={e=>setForm({...form,newPassword:e.target.value})} autoComplete="new-password"/></Field><Field label="Confirm new password"><input type="password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} autoComplete="new-password"/></Field></div><div className="sticky-save"><button className="btn btn-primary" disabled={changing}>{changing?<Loader2 className="spin"/>:<LockKeyhole size={16}/>}Change password</button></div></form>
  <div className="glass security-actions"><div><span className="eyebrow">Emergency control</span><h3>Log out all sessions</h3><p>Invalidate every active administrator session immediately.</p></div><button className="btn btn-danger" onClick={logoutAll} disabled={busy}>{busy?<Loader2 className="spin"/>:<LogOut/>}Log out all sessions</button></div>
  <div className="glass security-note"><strong>CSRF protection is enabled</strong><p>State-changing admin requests require a session-bound CSRF token. Secure cookies are enabled in production.</p></div>
 </AdminSection>
}
function AdminActivity(){
 const [logs,setLogs]=useState([]); const [busy,setBusy]=useState(true);
 const load=()=>{setBusy(true);api.get('/admin/api/audit-logs').then(d=>setLogs(d.logs||[])).catch(e=>uiAlert(e.message)).finally(()=>setBusy(false))};
 useEffect(load,[]);
 const clear=async()=>{if(!(await uiConfirm('Delete the entire audit history? This cannot be undone.','Clear activity log?')))return;try{await api.send('/admin/api/audit-logs','DELETE',{});setLogs([])}catch(e){uiAlert(e.message)}};
 return <AdminSection title="Activity Log" subtitle="A secure history of important admin actions."><div className="activity-toolbar"><div><span className="eyebrow">Audit trail</span><h3>{logs.length} recent actions</h3></div><div className="admin-actions"><button className="btn btn-ghost" onClick={load}><RefreshCw/>Refresh</button><button className="btn btn-danger" onClick={clear} disabled={!logs.length}><Trash2/>Clear</button></div></div><div className="activity-list">{busy?<Loader2 className="spin"/>:logs.length?logs.map((log,i)=><div className="activity-item" key={log._id||i}><div className="activity-avatar"><UserRoundCheck/></div><div className="activity-copy"><strong>Ritik Verma <span>{log.action}</span></strong><small>{new Date(log.createdAt).toLocaleString()} · {log.method}</small></div><div className="activity-path">{log.path}</div></div>):<div className="empty-state"><History/><strong>No activity yet</strong><span>Admin changes will appear here automatically.</span></div>}</div></AdminSection>
}

function AdminSection({title,subtitle,children}){return <motion.section className="admin-section" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}><div className="section-head"><div><span className="eyebrow">Manage</span><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</motion.section>}

function portfolioDialog({kind="alert",title="Notice",message="",defaultValue=""}){
  return new Promise(resolve=>{
    const backdrop=document.createElement("div");
    backdrop.className="portfolio-dialog-backdrop";
    const card=document.createElement("div");
    card.className="portfolio-dialog-card";
    const icon=document.createElement("div"); icon.className=`portfolio-dialog-icon ${kind}`; icon.textContent=kind==="confirm"?"?":kind==="prompt"?"✎":"✓";
    const h=document.createElement("h3"); h.textContent=title;
    const p=document.createElement("p"); p.textContent=message;
    card.append(icon,h,p);
    let input=null;
    if(kind==="prompt"){ input=document.createElement("input"); input.className="portfolio-dialog-input"; input.value=defaultValue; card.append(input); setTimeout(()=>input.focus(),40); }
    const actions=document.createElement("div"); actions.className="portfolio-dialog-actions";
    const cancel=document.createElement("button"); cancel.className="btn btn-ghost"; cancel.textContent="Cancel";
    const ok=document.createElement("button"); ok.className="btn btn-primary"; ok.textContent=kind==="alert"?"Got it":kind==="confirm"?"Continue":"Save";
    if(kind!=="alert") actions.append(cancel); actions.append(ok); card.append(actions); backdrop.append(card); document.body.append(backdrop);
    requestAnimationFrame(()=>backdrop.classList.add("show"));
    const close=value=>{backdrop.classList.remove("show");setTimeout(()=>backdrop.remove(),180);resolve(value)};
    cancel.onclick=()=>close(kind==="prompt"?null:false); ok.onclick=()=>close(kind==="prompt"?input.value:true);
    backdrop.onclick=e=>{if(e.target===backdrop)close(kind==="prompt"?null:false)};
  });
}
const uiAlert=(message,title="Something went wrong")=>portfolioDialog({kind:"alert",title,message:String(message||"Unexpected error")});
const uiConfirm=(message,title="Are you sure?")=>portfolioDialog({kind:"confirm",title,message});
const uiPrompt=(message,defaultValue="",title="Edit details")=>portfolioDialog({kind:"prompt",title,message,defaultValue});

class AppErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={error:null}; }
  static getDerivedStateFromError(error){ return {error}; }
  componentDidCatch(error, info){ console.error('Portfolio UI error:', error, info); }
  render(){
    if(this.state.error){
      return <div className="app-error"><div className="glass app-error-card"><span className="eyebrow">Something went wrong</span><h1>This page couldn't be loaded.</h1><p>{this.state.error?.message || 'An unexpected error occurred.'}</p><button className="btn btn-primary" onClick={()=>window.location.reload()}>Reload page</button></div></div>;
    }
    return this.props.children;
  }
}

function App(){return <Routes><Route path="/admin/login" element={<AdminLogin/>}/><Route path="/admin" element={<Admin/>}/><Route path="/admin/dashboard" element={<Admin/>}/><Route path="/dashboard" element={<Admin/>}/><Route path="/" element={<AppShell><Home/></AppShell>}/><Route path="/projects" element={<AppShell><Projects/></AppShell>}/><Route path="/compiler" element={<AppShell><Compiler/></AppShell>}/><Route path="/gallery" element={<AppShell><Gallery/></AppShell>}/><Route path="/attendance" element={<AppShell><Attendance/></AppShell>}/><Route path="/resume" element={<AppShell><Resume/></AppShell>}/><Route path="/contact" element={<AppShell><Contact/></AppShell>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
createRoot(document.getElementById('root')).render(<AppErrorBoundary><BrowserRouter><App/></BrowserRouter></AppErrorBoundary>);
