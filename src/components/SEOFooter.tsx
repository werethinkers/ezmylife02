import { Link } from "react-router-dom";

const SEOFooter = () => {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">EZYOURLIFE</h3>
            <p className="text-sm text-muted-foreground">
              The Future's First AI App Store. 200+ live AI apps today, 2,000+ launching within a year — for productivity, content creation, business automation and education.
            </p>
            <p className="text-xs text-muted-foreground">
              ezyourlife — Making digital AI Apps accessible to everyone.
            </p>
          </div>

          {/* AI App Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">AI App Categories</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/ai-apps" className="hover:text-primary transition-colors">AI Image Apps — Background Remover, Compressor</Link></li>
              <li><Link to="/ai-apps" className="hover:text-primary transition-colors">AI Business Apps — Invoice, Contract, Tax</Link></li>
              <li><Link to="/ai-apps" className="hover:text-primary transition-colors">AI Content Creator — Captions, Social Posts</Link></li>
              <li><Link to="/ai-apps" className="hover:text-primary transition-colors">AI Education Apps — Quiz, Flashcards, Planner</Link></li>
              <li><Link to="/ai-apps" className="hover:text-primary transition-colors">AI Productivity — Notebook, Prompt Master</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Platform</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/ai-apps" className="hover:text-primary transition-colors">Browse All AI Apps</Link></li>
              <li><Link to="/explore" className="hover:text-primary transition-colors">Explore by Use Case & Industry</Link></li>
              <li><Link to="/credits" className="hover:text-primary transition-colors">Pricing — Credits</Link></li>
              <li><Link to="/startup-analyser" className="hover:text-primary transition-colors">AI Startup Analyser</Link></li>
              <li><Link to="/notebook" className="hover:text-primary transition-colors">Speedy Notebook</Link></li>
              <li><Link to="/promptmaster" className="hover:text-primary transition-colors">Prompt Master</Link></li>
              <li><Link to="/meet-nudge" className="hover:text-primary transition-colors">Meet Nudge — Business Card Scanner</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About EZYOURLIFE</Link></li>
              <li><Link to="/about#contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
              <li><Link to="/get-extension" className="hover:text-primary transition-colors">Browser Extension</Link></li>
              <li><Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/40 pt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © 2026 <span className="font-semibold text-foreground">EZYOURLIFE</span> — The World's First AI App Store
          </p>
          <p className="text-xs text-muted-foreground">
            Best free AI apps online • Pay-as-you-go AI apps for productivity • AI app store for business & education • ezyourlife.com
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SEOFooter;
