import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from './services/api';
import serviceGridCollage from './assets/service_grid_collage.png';

// ─── SVG Icons ──────────────────────────────────────────────────────────────
const ElectricianIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="url(#amber-grad)" stroke="url(#amber-grad-stroke)" />
    <defs>
      <linearGradient id="amber-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="amber-grad-stroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

const PlumberIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" fill="url(#blue-grad)" stroke="url(#blue-grad-stroke)" />
    <path d="M12 12v6" stroke="url(#blue-grad-stroke)" />
    <path d="M9 15h6" stroke="url(#blue-grad-stroke)" />
    <defs>
      <linearGradient id="blue-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="blue-grad-stroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
  </svg>
);

const CarpenterIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 3 3 18v3h3L21 6z" fill="url(#emerald-grad)" stroke="url(#emerald-grad-stroke)" />
    <path d="M14 7 7 14" stroke="url(#emerald-grad-stroke)" />
    <path d="M17 10l-3-3" stroke="url(#emerald-grad-stroke)" />
    <defs>
      <linearGradient id="emerald-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#047857" stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="emerald-grad-stroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
  </svg>
);

const AcTechIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="url(#cyan-grad)" stroke="url(#cyan-grad-stroke)" />
    <path d="M12 2v20" stroke="url(#cyan-grad-stroke)" />
    <path d="M2 12h20" stroke="url(#cyan-grad-stroke)" />
    <path d="m16.2 7.8-8.4 8.4" stroke="url(#cyan-grad-stroke)" />
    <path d="m7.8 7.8 8.4 8.4" stroke="url(#cyan-grad-stroke)" />
    <defs>
      <linearGradient id="cyan-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="cyan-grad-stroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>
    </defs>
  </svg>
);

const CleaningIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-14.7-6.3 2.1 2.1m9.2 9.2 2.1 2.1m-13.4 0 2.1-2.1m9.2-9.2 2.1-2.1" fill="url(#violet-grad)" stroke="url(#violet-grad-stroke)" />
    <circle cx="12" cy="12" r="3" fill="url(#violet-grad)" stroke="url(#violet-grad-stroke)" />
    <defs>
      <linearGradient id="violet-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="violet-grad-stroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
    </defs>
  </svg>
);

const PaintingIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m14 6-2-2-4 4V10h12V8z" fill="url(#red-grad)" stroke="url(#red-grad-stroke)" />
    <path d="M6 10v4c0 3.3 2.7 6 6 6s6-2.7 6-6v-4H6Z" stroke="url(#red-grad-stroke)" />
    <path d="M12 20v2" stroke="url(#red-grad-stroke)" />
    <defs>
      <linearGradient id="red-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="red-grad-stroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
    </defs>
  </svg>
);

const VerifiedIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 11 2 2 4-4" />
  </svg>
);

const PricingIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 11 2 2 4-4" />
  </svg>
);

// ─── Service data ────────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: '1',
    name: 'Electrician',
    desc: 'Fan, lights & wiring',
    icon: <ElectricianIcon />,
    accent: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
  },
  {
    id: '2',
    name: 'Plumber',
    desc: 'Taps, pipes & leaks',
    icon: <PlumberIcon />,
    accent: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
  },
  {
    id: '3',
    name: 'Carpenter',
    desc: 'Furniture & doors',
    icon: <CarpenterIcon />,
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
  },
  {
    id: '4',
    name: 'AC Technician',
    desc: 'Service & gas refill',
    icon: <AcTechIcon />,
    accent: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.08)',
  },
  {
    id: '5',
    name: 'Home Cleaning',
    desc: 'Deep & kitchen clean',
    icon: <CleaningIcon />,
    accent: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
  },
  {
    id: '6',
    name: 'Painting',
    desc: 'Interior & exterior',
    icon: <PaintingIcon />,
    accent: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [dbCategories, setDbCategories] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    api
      .get('/api/services/categories/')
      .then((res) => setDbCategories(res.data))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  const handleServiceClick = (serviceName) => {
    const matched = dbCategories.find(
      (c) => c.name.toLowerCase() === serviceName.toLowerCase()
    );
    const catId = matched ? matched.id : null;
    const token = localStorage.getItem('access_token');

    if (!token) {
      toast.error('Please log in first to book a service');
      localStorage.setItem(
        'redirect_after_login',
        catId ? `/customer/book?category=${catId}` : '/customer/book'
      );
      navigate('/customer/login');
    } else {
      navigate(catId ? `/customer/book?category=${catId}` : '/customer/book');
    }
  };

  const handleBookNow = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in first to book a service');
      localStorage.setItem('redirect_after_login', '/customer/book');
      navigate('/customer/login');
    } else {
      navigate('/customer/book');
    }
  };

  // ── Animation Variants ──────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemLeftVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } }
  };

  const itemRightVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } }
  };

  const scrollSectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <>
      {/* ── Global Styles ────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');

        .lp-root *, .lp-root *::before, .lp-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .lp-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f8fafc;
          color: #0f172a;
          position: relative;
          overflow-x: hidden;
        }

        /* ── BACKGROUND GLOWS ─────────────────────────────────────────────────── */
        .lp-bg-glow {
          position: absolute;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(255, 255, 255, 0) 100%);
          top: -150px;
          right: -100px;
          z-index: 0;
          pointer-events: none;
        }

        .lp-bg-glow-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.02) 60%, rgba(255, 255, 255, 0) 100%);
          bottom: 20%;
          left: -150px;
          z-index: 0;
          pointer-events: none;
        }

        /* ── HERO ─────────────────────────────────────────────────────────── */
        .lp-hero-section {
          position: relative;
          z-index: 1;
        }

        .lp-hero {
          display: flex;
          align-items: center;
          min-height: calc(100vh - 64px);
          padding: 80px 60px;
          gap: 72px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .lp-left {
          flex: 0 0 50%;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 9999px;
          color: #4f46e5;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          width: fit-content;
        }

        .lp-badge-dot {
          width: 6px;
          height: 6px;
          background-color: #4f46e5;
          border-radius: 50%;
        }

        .lp-headline {
          font-size: clamp(2.4rem, 4vw, 3.8rem);
          font-weight: 800;
          color: #0f172a;
          line-height: 1.15;
          letter-spacing: -0.02em;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        .lp-headline span {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 50%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Widget Container */
        .lp-widget {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
        }

        .lp-widget-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 20px;
          letter-spacing: -0.01em;
        }

        .lp-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .lp-service-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 12px 18px;
          border: 1.5px solid #f1f5f9;
          border-radius: 20px;
          cursor: pointer;
          background: #ffffff;
          gap: 10px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lp-service-card:hover {
          background: #ffffff;
        }

        .lp-service-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .lp-service-name {
          font-size: 0.82rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.3;
        }

        .lp-service-desc {
          font-size: 0.72rem;
          color: #64748b;
          line-height: 1.4;
        }

        /* Stats */
        .lp-stats {
          display: flex;
          gap: 48px;
        }

        .lp-stat {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .lp-stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
          color: #334155;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }

        .lp-stat-value {
          font-size: 1.35rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
          font-family: 'Outfit', sans-serif;
        }

        .lp-stat-label {
          font-size: 0.78rem;
          color: #64748b;
          margin-top: 4px;
          font-weight: 500;
        }

        /* RIGHT — photo grid */
        .lp-right {
          flex: 1;
          position: relative;
          height: 540px;
        }

        .lp-photo-card {
          position: absolute;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
          border: 8px solid #ffffff;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background-size: 200%;
          background-repeat: no-repeat;
        }

        .lp-photo-card:hover {
          transform: scale(1.05) translateY(-10px) rotate(0deg) !important;
          z-index: 10 !important;
          box-shadow: 0 35px 70px rgba(15, 23, 42, 0.16);
          background-size: 215%;
        }

        .lp-photo-tall {
          width: 270px;
          height: 440px;
          left: 0;
          top: 30px;
        }

        .lp-photo-top-right {
          width: 250px;
          height: 220px;
          left: 250px;
          top: 0;
        }

        .lp-photo-bottom-right {
          width: 260px;
          height: 250px;
          left: 240px;
          top: 250px;
        }

        /* ── SECTIONS BELOW HERO ─────────────────────────────────────────────── */
        .lp-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 60px;
          border-top: 1px solid #e2e8f0;
          position: relative;
          z-index: 1;
        }

        .lp-section-header {
          text-align: center;
          margin-bottom: 56px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .lp-section-label {
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #4f46e5;
          margin-bottom: 12px;
        }

        .lp-section-title {
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin-bottom: 16px;
          font-family: 'Outfit', sans-serif;
        }

        .lp-section-sub {
          font-size: 1rem;
          color: #64748b;
          max-width: 580px;
          line-height: 1.6;
        }

        /* How-it-works */
        .lp-how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 48px;
          position: relative;
        }

        .lp-how-card {
          padding: 36px 30px;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #ffffff;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.02);
          position: relative;
          z-index: 1;
        }

        .lp-how-card:hover {
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
          transform: translateY(-4px);
          border-color: #cbd5e1;
        }

        .lp-how-num-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          font-weight: 800;
          font-size: 1.4rem;
          font-family: 'Outfit', sans-serif;
        }

        .lp-how-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
          font-family: 'Outfit', sans-serif;
        }

        .lp-how-desc {
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.6;
        }

        /* Buttons */
        .lp-btn-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 48px;
          justify-content: center;
        }

        .lp-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 9999px;
          padding: 14px 32px;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
          border: 1.5px solid transparent;
          text-decoration: none;
          letter-spacing: -0.01em;
        }

        .lp-btn-dark {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }

        .lp-btn-dark:hover {
          background: #1e293b;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25);
        }

        .lp-btn-outline {
          background: #ffffff;
          color: #0f172a;
          border-color: #cbd5e1;
          box-shadow: 0 4px 6px rgba(15, 23, 42, 0.02);
        }

        .lp-btn-outline:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
        }

        /* Safety & Quality */
        .lp-safety-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 48px;
        }

        .lp-safety-card {
          padding: 40px 32px;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #ffffff;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.02);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .lp-safety-card:hover {
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
          transform: translateY(-4px);
          border-color: #cbd5e1;
        }

        .lp-safety-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.04);
        }

        .lp-safety-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          font-family: 'Outfit', sans-serif;
        }

        .lp-safety-desc {
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.6;
        }

        /* ── CTA BANNER SECTION ──────────────────────────────────────────────── */
        .lp-cta-wrapper {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 60px 80px;
          position: relative;
          z-index: 1;
        }

        .lp-cta-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 32px;
          padding: 64px;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 48px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
        }

        .lp-cta-glow {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(255, 255, 255, 0) 70%);
          top: -150px;
          right: -150px;
          pointer-events: none;
        }

        .lp-cta-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .lp-cta-title {
          font-size: clamp(1.8rem, 2.5vw, 2.5rem);
          font-weight: 900;
          font-family: 'Outfit', sans-serif;
          line-height: 1.2;
        }

        .lp-cta-desc {
          font-size: 1.05rem;
          color: #94a3b8;
          line-height: 1.6;
          max-width: 560px;
        }

        .lp-cta-action {
          flex-shrink: 0;
        }

        .lp-btn-cta {
          background: #ffffff;
          color: #0f172a;
          border-color: #ffffff;
          font-size: 1rem;
          padding: 16px 36px;
          box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .lp-btn-cta:hover {
          background: #f8fafc;
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(255,255,255,0.25);
        }

        /* ── RESPONSIVE ─────────────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .lp-hero {
            flex-direction: column;
            padding: 40px 24px;
            gap: 40px;
            min-height: auto;
          }
          .lp-left { flex: unset; width: 100%; gap: 24px; }
          .lp-right { display: none; }
          .lp-section { padding: 48px 24px; }
          .lp-cta-wrapper { padding: 0 24px 48px; }
          .lp-how-grid, .lp-safety-grid { gap: 24px; }
        }

        @media (max-width: 900px) {
          .lp-how-grid, .lp-safety-grid { grid-template-columns: 1fr; }
          .lp-how-card, .lp-safety-card { padding: 24px; }
          .lp-cta-card { flex-direction: column; text-align: center; padding: 40px 24px; gap: 24px; }
          .lp-cta-desc { margin: 0 auto; }
        }

        @media (max-width: 640px) {
          .lp-hero { padding: 24px 16px; gap: 24px; }
          .lp-headline { font-size: 2.1rem; }
          .lp-widget { padding: 18px 14px; border-radius: 20px; }
          .lp-services-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .lp-service-card { padding: 14px 8px; border-radius: 14px; }
          .lp-service-icon { width: 44px; height: 44px; border-radius: 12px; }
          .lp-service-name { font-size: 0.8rem; }
          .lp-service-desc { font-size: 0.68rem; }
          .lp-section { padding: 40px 16px; }
          .lp-cta-wrapper { padding: 0 16px 40px; }
          .lp-cta-card { padding: 28px 16px; border-radius: 20px; }
          .lp-stats { flex-direction: column; gap: 16px; }
        }
      `}</style>

      <div className="lp-root">
        {/* Decorative glows */}
        <div className="lp-bg-glow" />
        <div className="lp-bg-glow-2" />

        {/* ══════════════════════════════ HERO */}
        <section className="lp-hero-section">
          <motion.div
            className="lp-hero"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* ── LEFT ── */}
            <div className="lp-left">
              <motion.div className="lp-badge" variants={itemLeftVariants}>
                <span className="lp-badge-dot" />
                <span>Premium Home Services on Demand</span>
              </motion.div>

              <motion.h1 className="lp-headline" variants={itemLeftVariants}>
                Home services <br />
                <span>at your doorstep</span>
              </motion.h1>

              {/* Widget */}
              <motion.div className="lp-widget" variants={itemLeftVariants}>
                <p className="lp-widget-title">What service do you need today?</p>
                <div className="lp-services-grid">
                  {SERVICES.map((svc) => (
                    <motion.div
                      key={svc.id}
                      className="lp-service-card"
                      onMouseEnter={() => setHoveredCard(svc.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => handleServiceClick(svc.name)}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.96 }}
                      style={{
                        borderColor: hoveredCard === svc.id ? svc.accent : undefined,
                        boxShadow: hoveredCard === svc.id ? `0 12px 24px -10px ${svc.accent}40` : undefined,
                      }}
                    >
                      <div
                        className="lp-service-icon"
                        style={{
                          background: hoveredCard === svc.id ? svc.bg : '#f8fafc',
                          color: hoveredCard === svc.id ? svc.accent : '#64748b'
                        }}
                      >
                        {svc.icon}
                      </div>
                      <div className="lp-service-name">{svc.name}</div>
                      <div className="lp-service-desc">{svc.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── RIGHT — Overlapping Collage ── */}
            <div className="lp-right">
              {/* AC Technician */}
              <motion.div
                className="lp-photo-card lp-photo-tall"
                variants={itemRightVariants}
                whileHover={{ rotate: 0, zIndex: 10, scale: 1.05 }}
                style={{
                  backgroundImage: `url(${serviceGridCollage})`,
                  backgroundPosition: '0% 0%',
                  transform: 'rotate(-4deg)',
                  zIndex: 1
                }}
                role="img"
                aria-label="AC Technician at work"
              />
              {/* Plumber */}
              <motion.div
                className="lp-photo-card lp-photo-top-right"
                variants={itemRightVariants}
                whileHover={{ rotate: 0, zIndex: 10, scale: 1.05 }}
                style={{
                  backgroundImage: `url(${serviceGridCollage})`,
                  backgroundPosition: '100% 0%',
                  transform: 'rotate(3deg)',
                  zIndex: 2
                }}
                role="img"
                aria-label="Plumber at work"
              />
              {/* Painter */}
              <motion.div
                className="lp-photo-card lp-photo-bottom-right"
                variants={itemRightVariants}
                whileHover={{ rotate: 0, zIndex: 10, scale: 1.05 }}
                style={{
                  backgroundImage: `url(${serviceGridCollage})`,
                  backgroundPosition: '100% 100%',
                  transform: 'rotate(-2deg)',
                  zIndex: 3
                }}
                role="img"
                aria-label="Painter at work"
              />
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════ HOW IT WORKS */}
        <section className="lp-section">
          <motion.div
            className="lp-section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scrollSectionVariants}
          >
            <p className="lp-section-label">Book in Minutes. Get Help Instantly.</p>
            <h2 className="lp-section-title">How It Works</h2>
            <p className="lp-section-sub">
              From booking to completion, WORKIZO keeps every step simple, transparent, and live.
            </p>
          </motion.div>

          <div className="lp-how-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <motion.div
              className="lp-how-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scrollSectionVariants}
              whileHover={{ y: -4 }}
            >
              <div className="lp-how-num-wrapper" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.08)' }}>01</div>
              <div className="lp-how-title">① Choose a Service</div>
              <div className="lp-how-desc">
                Browse verified professionals across multiple service categories.
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                  📍 Select category → Add address → Describe your issue.
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="lp-how-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scrollSectionVariants}
              whileHover={{ y: -4 }}
              transition={{ delay: 0.1 }}
            >
              <div className="lp-how-num-wrapper" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}>02</div>
              <div className="lp-how-title">② Get Matched Instantly</div>
              <div className="lp-how-desc">
                Your request is broadcast in real time to nearby available service partners.
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                  ⚡ Live notifications &bull; 📍 Instant matching
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="lp-how-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scrollSectionVariants}
              whileHover={{ y: -4 }}
              transition={{ delay: 0.2 }}
            >
              <div className="lp-how-num-wrapper" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)' }}>03</div>
              <div className="lp-how-title">③ Track Everything Live</div>
              <div className="lp-how-desc">
                Watch every stage of your booking.
                <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#64748b', fontWeight: 500, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <span>✓ Accepted</span> &bull; <span>✓ Arrived</span> &bull; <span>✓ Work Started</span> &bull; <span>✓ Completed</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="lp-how-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scrollSectionVariants}
              whileHover={{ y: -4 }}
              transition={{ delay: 0.3 }}
            >
              <div className="lp-how-num-wrapper" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.08)' }}>04</div>
              <div className="lp-how-title">④ Pay Securely & Rate</div>
              <div className="lp-how-desc">
                Review the invoice, pay online with Razorpay or cash, receive your receipt, and rate your partner.
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                  💳 Online &amp; Cash &bull; ⭐ Ratings &amp; Reviews
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="lp-btn-row"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scrollSectionVariants}
          >
            <button className="lp-btn lp-btn-dark" onClick={handleBookNow}>
              Book Service Now →
            </button>
            <button
              className="lp-btn lp-btn-outline"
              onClick={() => navigate('/captain/register')}
            >
              Become a Captain
            </button>
          </motion.div>
        </section>

        {/* ══════════════════════════════ SAFETY */}
        <section className="lp-section">
          <motion.div
            className="lp-section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scrollSectionVariants}
          >
            <p className="lp-section-label">Trust &amp; Quality</p>
            <h2 className="lp-section-title">Workizo Quality &amp; Safety Assurance</h2>
            <p className="lp-section-sub">
              Just like India's top home platforms, we prioritize trust, background verification, and quality of work.
            </p>
          </motion.div>

          <div className="lp-safety-grid">
            <motion.div
              className="lp-safety-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scrollSectionVariants}
              whileHover={{ y: -4 }}
            >
              <div className="lp-safety-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
                <VerifiedIcon />
              </div>
              <div className="lp-safety-title">100% KYC Verified</div>
              <div className="lp-safety-desc">
                Every Captain is verified via Aadhaar &amp; PAN background checks prior to platform listing.
              </div>
            </motion.div>
            
            <motion.div
              className="lp-safety-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scrollSectionVariants}
              whileHover={{ y: -4 }}
              transition={{ delay: 0.1 }}
            >
              <div className="lp-safety-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
                <PricingIcon />
              </div>
              <div className="lp-safety-title">Standardized Pricing</div>
              <div className="lp-safety-desc">
                No bargaining. Get fixed, fair quotes for all categories before work begins.
              </div>
            </motion.div>
            
            <motion.div
              className="lp-safety-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={scrollSectionVariants}
              whileHover={{ y: -4 }}
              transition={{ delay: 0.2 }}
            >
              <div className="lp-safety-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
                <ShieldCheckIcon />
              </div>
              <div className="lp-safety-title">Elite Trained Captains</div>
              <div className="lp-safety-desc">
                Only experienced local experts are matched to guarantee 100% satisfaction.
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════ CAPTAIN CTA BANNER */}
        <section className="lp-cta-wrapper">
          <motion.div
            className="lp-cta-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scrollSectionVariants}
          >
            <div className="lp-cta-glow" />
            <div className="lp-cta-content">
              <h2 className="lp-cta-title">Earn more as a Workizo Partner</h2>
              <p className="lp-cta-desc">
                Are you a skilled electrician, plumber, carpenter, or technician? Register today, get paired with nearby customer requests, and grow your local service business.
              </p>
            </div>
            <div className="lp-cta-action">
              <button
                className="lp-btn lp-btn-cta"
                onClick={() => navigate('/captain/register')}
              >
                Become a Captain
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default LandingPage;
