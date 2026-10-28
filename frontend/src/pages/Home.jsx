
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  GraduationCap,
  UserRound,
  Building2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const portals = [
  {
    icon: GraduationCap,
    title: "Student Portal",
    description: "Find internships, fresher jobs, and opportunities to start your career.",
    link: "/register?role=student",
  },
  {
    icon: UserRound,
    title: "Professional Portal",
    description: "Explore career opportunities that match your skills and experience.",
    link: "/register?role=professional",
  },
  {
    icon: Building2,
    title: "Recruiter Portal",
    description: "Post jobs, manage applicants, and streamline your hiring process.",
    link: "/register?role=recruiter",
  },
];
const currentYear = new Date().getFullYear();

export default function Home() {
  return (
    <div className="site">
      <nav className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <BriefcaseBusiness size={22} />
          </span>
          SmartHire
        </Link>

        <div className="nav-links">
          <a href="#portals">Explore Portals</a>
          <a href="#features">Features</a>
          <Link to="/login">Log in</Link>
          <Link to="/register" className="nav-button">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">YOUR NEXT OPPORTUNITY STARTS HERE</span>

            <h1>
              Find your next
              <br />
              <span>big opportunity.</span>
            </h1>

            <p className="hero-description">
              One intelligent platform connecting ambitious candidates
              with companies shaping tomorrow.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="primary-button">
                Start your journey <ArrowRight size={18} />
              </Link>
              <a href="#portals" className="secondary-button">
                Explore portals
              </a>
            </div>

            <div className="hero-points">
              <span><CheckCircle2 size={17} /> Career opportunities</span>
              <span><CheckCircle2 size={17} /> Smarter applications</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <span className="section-label">CAREER DASHBOARD</span>
              <h2>Your future, in focus.</h2>

              <div className="mini-stat">
                <BriefcaseBusiness size={25} />
                <div>
                  <strong>Find your fit</strong>
                  <p>Discover relevant opportunities</p>
                </div>
              </div>

              <div className="mini-stat">
                <UserRound size={25} />
                <div>
                  <strong>Build your profile</strong>
                  <p>Showcase your skills and experience</p>
                </div>
              </div>

              <div className="visual-footer">
                <CheckCircle2 size={17} />
                A smarter way to get hired
              </div>
            </div>
          </div>
        </section>

        <section className="portals-section" id="portals">
          <div className="section-heading">
            <span className="section-label">BUILT FOR EVERY CAREER STAGE</span>
            <h2>One platform. Three pathways.</h2>
            <p>Choose the experience that fits your goals.</p>
          </div>

          <div className="portal-grid">
            {portals.map((portal) => {
              const Icon = portal.icon;

              return (
                <article className="portal-card" key={portal.title}>
                  <div className="portal-icon"><Icon size={26} /></div>
                  <h3>{portal.title}</h3>
                  <p>{portal.description}</p>
                  <Link to={portal.link} className="card-link">
                    Get started <ArrowRight size={17} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="features-section" id="features">
          <span className="section-label">THE SMARTHIRE ADVANTAGE</span>
          <h2>Less friction. More possibilities.</h2>

          <div className="feature-grid">
            <article>
              <CheckCircle2 />
              <h3>Simple applications</h3>
              <p>Keep your job search organized.</p>
            </article>
            <article>
              <GraduationCap />
              <h3>Dedicated portals</h3>
              <p>Experiences tailored to every career stage.</p>
            </article>
            <article>
              <Building2 />
              <h3>Recruitment tools</h3>
              <p>Help hiring teams manage candidates.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <Link to="/" className="brand">SmartHire</Link>
        <span>Connecting talent with opportunity.</span>
        <span>© {currentYear} SmartHire</span>
      </footer>
    </div>
  );
}
