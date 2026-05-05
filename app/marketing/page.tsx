import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "misu — stay genuinely close",
  description:
    "misu helps you actually show up for the people who matter — with AI-crafted messages, hangout planning, and smart cadences that fit your life.",
};

const APP_URL = "https://app.misu.care";

export default function MarketingPage() {
  return (
    <div className={styles.page}>
      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <a href="#" className={styles.wordmark}>
            <MisuMark size={28} />
            <span className={styles.wordmarkText}>misu</span>
          </a>
          <a href={APP_URL} className={styles.navCta}>
            open the app →
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.inner}>
          <div className={styles.heroEyebrow}>your relationship co-pilot</div>

          <h1 className={styles.heroHeading}>
            actually show up for
            <br />
            the people who <span className={styles.accentWord}>matter</span>
          </h1>

          <p className={styles.heroSub}>
            misu helps you stay genuinely close — with AI-crafted check-ins,
            hangout planning, and smart cadences that fit around your life.
          </p>

          <div className={styles.heroActions}>
            <a href={APP_URL} className={styles.btnPrimary}>
              get started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href={APP_URL} className={styles.btnAccent}>
              <span className={styles.btnAccentLabel}>open misu</span>
            </a>
          </div>
          <div className={styles.heroNote}>free to use · no credit card needed · works with SMS, iMessage &amp; more</div>

          {/* Hero mini-UI mockup */}
          <div className={styles.heroIllo}>
            <div className={`${styles.illoTile} ${styles.large}`}>
              <FriendsIllo />
            </div>
            <div className={styles.avatarStack}>
              <div className={styles.avatarRow}>
                <div className={styles.avatar} style={{ background: "#FFE93E" }}>
                  <span className={styles.avatarLabel}>SR</span>
                </div>
                <div className={styles.avatarInfo}>
                  <div className={styles.avatarName}>Sarah R.</div>
                  <div className={styles.avatarSub}>every 2 weeks</div>
                </div>
                <div className={styles.overdueBadge}>Overdue</div>
              </div>
              <div className={styles.avatarRow}>
                <div className={styles.avatar} style={{ background: "#5BC4F5" }}>
                  <span className={styles.avatarLabel}>DK</span>
                </div>
                <div className={styles.avatarInfo}>
                  <div className={styles.avatarName}>Dad</div>
                  <div className={styles.avatarSub}>every week</div>
                </div>
                <div className={styles.dueBadge}>Today</div>
              </div>
              <div className={styles.avatarRow}>
                <div className={styles.avatar} style={{ background: "#7EE8A2" }}>
                  <span className={styles.avatarLabel}>JL</span>
                </div>
                <div className={styles.avatarInfo}>
                  <div className={styles.avatarName}>Jamie L.</div>
                  <div className={styles.avatarSub}>monthly</div>
                </div>
                <div className={styles.checkBadge}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1F2024" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.features}>
        <div className={styles.inner}>
          <div className={styles.sectionEyebrow}>what misu does</div>
          <h2 className={styles.sectionHeading}>thoughtful by design</h2>

          <div className={styles.featureGrid}>
            {/* Card 1 — AI messages */}
            <div className={`${styles.featureCard} ${styles.accentCard}`}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className={styles.featureTitle}>AI writes the message</div>
              <div className={styles.featureBody}>
                misu drafts a warm, natural check-in based on what you know about the person. Review it, tweak it, send it — or let it go automatically.
              </div>
              <div className={styles.freqRow}>
                <div className={`${styles.freqChip} ${styles.freqChipActive}`}>casual</div>
                <div className={styles.freqChip}>warm</div>
                <div className={styles.freqChip}>playful</div>
              </div>
            </div>

            {/* Card 2 — Hangout planning */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className={styles.featureTitle}>plan real hangouts</div>
              <div className={styles.featureBody}>
                Set up recurring hangouts or one-off plans. misu sends the invite at the right time, so you don&apos;t have to remember to.
              </div>
              <div className={styles.formatPills}>
                <span className={styles.formatPill} style={{ background: "#7EE8A2" }}>In-person</span>
                <span className={styles.formatPill} style={{ background: "#5BC4F5" }}>FaceTime</span>
                <span className={styles.formatPill} style={{ background: "#FFB347" }}>Zoom</span>
              </div>
            </div>

            {/* Card 3 — Cadence */}
            <div className={`${styles.featureCard} ${styles.yellowCard}`}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.featureTitle}>your cadence, per person</div>
              <div className={styles.featureBody}>
                Weekly with your parents. Monthly with old friends. misu tracks each relationship at its own rhythm, no spreadsheet needed.
              </div>
            </div>

            {/* Card 4 — Multi-platform */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.1 3.4 2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className={styles.featureTitle}>send where they are</div>
              <div className={styles.featureBody}>
                SMS, iMessage, WhatsApp, Instagram, Messenger — misu meets each person on the platform they actually use.
              </div>
              <div className={styles.formatPills}>
                <span className={styles.formatPill} style={{ background: "#BCE8DC" }}>iMessage</span>
                <span className={styles.formatPill} style={{ background: "#7EE8A2" }}>WhatsApp</span>
                <span className={styles.formatPill} style={{ background: "#FF6B9D", color: "#fff" }}>Instagram</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.how}>
        <div className={styles.inner}>
          <div className={styles.sectionEyebrow}>how it works</div>
          <h2 className={styles.sectionHeading}>three steps, then magic</h2>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>01</div>
              <div>
                <div className={styles.stepTitle}>add your people</div>
                <div className={styles.stepDesc}>
                  Add the friends and family you want to stay close to. Set their preferred platform — iMessage, SMS, WhatsApp, and more.
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>02</div>
              <div>
                <div className={styles.stepTitle}>set a cadence or plan a hangout</div>
                <div className={styles.stepDesc}>
                  Schedule recurring check-ins or real hangouts at whatever frequency feels right. misu tracks it all so nothing falls through the cracks.
                </div>
                <div className={styles.miniCal}>
                  <div className={styles.miniCalHeader}>MAY 2026</div>
                  <div className={styles.miniCalRow}>
                    <div className={styles.miniDot} style={{ background: "#FFE93E" }} />
                    <div className={styles.miniName}>Sarah R.</div>
                    <div className={styles.miniDate}>May 3</div>
                    <div className={styles.overdueBadgeSm}>Overdue</div>
                  </div>
                  <div className={styles.miniCalRow}>
                    <div className={styles.miniDot} style={{ background: "#5BC4F5" }} />
                    <div className={styles.miniName}>Dad</div>
                    <div className={styles.miniDate}>May 5</div>
                    <div className={styles.dueBadgeSm}>Upcoming</div>
                  </div>
                  <div className={styles.miniCalRow}>
                    <div className={styles.miniDot} style={{ background: "#7EE8A2" }} />
                    <div className={styles.miniName}>Jamie L.</div>
                    <div className={styles.miniDate}>May 12</div>
                    <div className={styles.miniIn}>in 9 days</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>03</div>
              <div>
                <div className={styles.stepTitle}>misu drafts it, you send it</div>
                <div className={styles.stepDesc}>
                  When it&apos;s time, misu generates a personal message or hangout invite. Review, approve, and send — or let it go automatically.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.inner}>
          <div className={styles.ctaIllo}>
            <SunnyDayIllo />
          </div>
          <h2 className={styles.ctaHeading}>who have you been meaning to reach out to?</h2>
          <p className={styles.ctaSub}>
            Start with one person. Set a cadence. misu handles the rest.
          </p>
          <a href={APP_URL} className={`${styles.btnPrimary} ${styles.ctaBtn}`}>
            start catching up
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <a href="#" className={styles.footerWordmark}>
            <MisuMark size={20} />
            <span className={styles.footerWordmarkText}>misu</span>
          </a>
          <span className={styles.footerNote}>
            your relationship co-pilot — AI messages, hangout planning, and smart cadences.
          </span>
        </div>
      </footer>
    </div>
  );
}

function MisuMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" rx="24" fill="#BCE8DC"/>
      <g transform="translate(27.25, 25) scale(0.75)">
        <rect x="46" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="82" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="94" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="106" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="118" y="22" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="82" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="94" y="34" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="46" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="58" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="70" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="82" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="82" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="82" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="82" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="94" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="94" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="94" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="94" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="106" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="106" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="106" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="106" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="118" width="12" height="12" fill="#1F2024"/>
        <rect x="10" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="130" width="12" height="12" fill="#1F2024"/>
        <rect x="22" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="142" width="12" height="12" fill="#1F2024"/>
        <rect x="34" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="82" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="94" y="154" width="12" height="12" fill="#1F2024"/>
        <rect x="46" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="58" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="70" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="82" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="94" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="106" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="118" y="166" width="12" height="12" fill="#1F2024"/>
        <rect x="142" y="22" width="24" height="24" fill="#1F2024"/>
        <rect x="166" y="46" width="18" height="18" fill="#1F2024"/>
        <rect x="142" y="70" width="12" height="12" fill="#1F2024"/>
      </g>
    </svg>
  );
}

function FriendsIllo() {
  return (
    <svg width="130" height="126" viewBox="0 0 104 100" fill="none">
      <defs>
        <pattern id="fd" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill="#1F2024" opacity="0.18" />
        </pattern>
        <pattern id="fh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#1F2024" strokeWidth="1" opacity="0.22" />
        </pattern>
      </defs>
      <rect width="104" height="100" fill="url(#fd)" />
      <circle cx="26" cy="22" r="12" fill="#BCE8DC" stroke="#1F2024" strokeWidth="2" />
      <circle cx="22" cy="21" r="1.8" fill="#1F2024" /><circle cx="30" cy="21" r="1.8" fill="#1F2024" />
      <path d="M22 26 Q26 29 30 26" stroke="#1F2024" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="16" y="36" width="20" height="24" rx="4" fill="#FFFFFF" stroke="#1F2024" strokeWidth="2" />
      <rect x="16" y="36" width="20" height="24" rx="4" fill="url(#fh)" />
      <rect x="18" y="58" width="7" height="18" rx="3" fill="#1F2024" />
      <rect x="27" y="58" width="7" height="18" rx="3" fill="#1F2024" />
      <path d="M36 44 Q50 38 54 34" stroke="#1F2024" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="78" cy="22" r="12" fill="#BCE8DC" stroke="#1F2024" strokeWidth="2" />
      <circle cx="74" cy="21" r="1.8" fill="#1F2024" /><circle cx="82" cy="21" r="1.8" fill="#1F2024" />
      <path d="M74 26 Q78 29 82 26" stroke="#1F2024" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="68" y="36" width="20" height="24" rx="4" fill="#FFFFFF" stroke="#1F2024" strokeWidth="2" />
      <rect x="68" y="36" width="20" height="24" rx="4" fill="url(#fh)" />
      <rect x="70" y="58" width="7" height="18" rx="3" fill="#1F2024" />
      <rect x="79" y="58" width="7" height="18" rx="3" fill="#1F2024" />
      <path d="M68 44 Q54 38 50 34" stroke="#1F2024" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 56 C52 56 40 48 40 41 C40 36.5 44 34 48 36 C50 37 52 39 52 39 C52 39 54 37 56 36 C60 34 64 36.5 64 41 C64 48 52 56 52 56Z" fill="#BCE8DC" stroke="#1F2024" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="46" cy="40" r="2.5" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

function SunnyDayIllo() {
  return (
    <svg width="104" height="100" viewBox="0 0 104 100" fill="none">
      <defs>
        <pattern id="sky2" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#1F2024" opacity="0.12" />
        </pattern>
        <pattern id="sh2" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#1F2024" strokeWidth="1" opacity="0.2" />
        </pattern>
      </defs>
      <rect width="104" height="100" fill="url(#sky2)" />
      <circle cx="52" cy="30" r="14" fill="#FFE93E" stroke="#1F2024" strokeWidth="2" />
      <circle cx="47" cy="26" r="4" fill="#FFFFFF" opacity="0.55" />
      <line x1="52" y1="10" x2="52" y2="5"  stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="52" y1="50" x2="52" y2="55" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="30" x2="27" y2="30" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="72" y1="30" x2="77" y2="30" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="16" x2="34" y2="12" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="66" y1="16" x2="70" y2="12" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="44" x2="34" y2="48" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <line x1="66" y1="44" x2="70" y2="48" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="52" cy="100" rx="70" ry="34" fill="#F0F0F0" stroke="#1F2024" strokeWidth="2" />
      <ellipse cx="20" cy="100" rx="55" ry="28" fill="#BCE8DC" stroke="#1F2024" strokeWidth="2" />
      <ellipse cx="20" cy="100" rx="55" ry="28" fill="url(#sh2)" />
      <ellipse cx="84" cy="100" rx="42" ry="24" fill="#FFFFFF" stroke="#1F2024" strokeWidth="2" />
      <ellipse cx="84" cy="100" rx="42" ry="24" fill="url(#sky2)" />
      <path d="M74 52 Q78 48 82 52" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M84 50 Q88 46 92 50" stroke="#1F2024" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
