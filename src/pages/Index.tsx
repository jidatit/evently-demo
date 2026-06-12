
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  consumeQueuedSectionScroll,
  HOW_IT_WORKS_SECTION_ID,
  scrollToSection,
} from '@/lib/smoothScroll';
import { Button } from '@/components/ui/button';
import { Calendar, Star, Shield, Search, Users, PartyPopper, Sparkles, Camera, Music, Heart, Gift } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BookDLogo from '@/components/BookDLogo';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import { TrustCues } from '@/components/marketing/TrustCues';

const Index: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const scrollIfNeeded = () => {
      const queued = consumeQueuedSectionScroll();
      const hash = window.location.hash.replace('#', '');
      const target =
        queued ||
        (hash === HOW_IT_WORKS_SECTION_ID ? HOW_IT_WORKS_SECTION_ID : null);
      if (!target) return;

      requestAnimationFrame(() => {
        setTimeout(() => scrollToSection(target), 80);
      });
    };

    scrollIfNeeded();
    window.addEventListener('hashchange', scrollIfNeeded);
    return () => window.removeEventListener('hashchange', scrollIfNeeded);
  }, []);

  return (
    <div className="bg-party-cream min-h-screen relative overflow-hidden">
      {/* Floating Celebratory Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Confetti & Party Elements */}
        <div className="floating-shape w-4 h-4 bg-party-coral top-20 left-[10%] floating-confetti" style={{ animationDelay: '0s' }}></div>
        <div className="floating-shape w-3 h-3 bg-party-yellow top-32 left-[20%] floating-confetti" style={{ animationDelay: '1s' }}></div>
        <div className="floating-shape w-5 h-5 bg-party-purple top-24 right-[15%] floating-confetti" style={{ animationDelay: '2s' }}></div>
        <div className="floating-shape w-4 h-4 bg-party-orange top-40 right-[25%] floating-confetti" style={{ animationDelay: '0.5s' }}></div>
        <div className="floating-shape w-3 h-3 bg-party-coral bottom-32 left-[15%] floating-sparkle" style={{ animationDelay: '1.5s' }}></div>
        <div className="floating-shape w-6 h-6 bg-party-pink bottom-24 right-[20%] floating-sparkle" style={{ animationDelay: '2.5s' }}></div>
        <div className="floating-shape w-4 h-4 bg-party-blue bottom-40 left-[25%] floating-sparkle" style={{ animationDelay: '3s' }}></div>

        {/* Larger Background Circles for Depth */}
        <div className="absolute top-10 left-5 w-20 h-20 bg-party-green/5 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 right-10 w-32 h-32 bg-party-coral/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-party-purple/5 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-party-yellow/3 rounded-full blur-2xl"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-16">
            {/* Animated Logo - Bouncing Cube with "B" */}
            <div className="relative flex flex-col items-center">
              {/* Logo Cube with Sparkles */}
              <div className="relative mb-8">
                <div className="logo-cube">
                  <div className="sparkle">✨</div>
                  <div className="sparkle">⭐</div>
                  <div className="sparkle">💫</div>
                  <div className="sparkle">✨</div>
                  E
                </div>
              </div>

              {/* Book'D Wordmark */}
              <div className="mb-8">
                <BookDLogo size="xl" />
              </div>
            </div>

            {/* Tagline with Different Colors */}
            <div className="space-y-6">
              <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-muted-foreground">Plan Less.</span>
                <br />
                <span className="text-primary">Celebrate More.</span>
              </h1>

              <p className="font-body text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-5xl mx-auto leading-relaxed">
                Find and book photographers, DJs, caterers, bartenders, venues, and more — all in one place.
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
              <Button
                size="lg"
                onClick={() => navigate('/browse')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-cta text-2xl px-16 py-8 rounded-full shadow-glow hover:shadow-glow-hover hover:scale-105 transition-all duration-300 btn-glow-hover relative"
              >
                Start Booking Events
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/become-vendor')}
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-cta text-2xl px-16 py-8 rounded-full shadow-party hover:shadow-party-hover hover:scale-105 transition-all duration-300"
              >
                Join as a Vendor
              </Button>
            </div>
            <TrustCues className="pt-6 max-w-xl mx-auto" />
          </div>
        </div>
      </section>

      <HowItWorksSection />

      {/* Why Choose Evently Section */}
      <section className="relative py-32 bg-gradient-to-br from-party-cream via-white/50 to-party-cream">
        {/* More floating celebratory shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="floating-shape w-8 h-8 bg-party-coral/40 top-20 left-[5%] floating-confetti" style={{ animationDelay: '4s' }}></div>
          <div className="floating-shape w-6 h-6 bg-party-blue/40 top-1/3 right-[8%] floating-sparkle" style={{ animationDelay: '5s' }}></div>
          <div className="floating-shape w-5 h-5 bg-party-yellow/40 bottom-1/4 left-[12%] floating-confetti" style={{ animationDelay: '3.5s' }}></div>
          <div className="floating-shape w-7 h-7 bg-party-purple/30 bottom-1/3 right-[15%] floating-sparkle" style={{ animationDelay: '6s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-heading text-5xl md:text-7xl font-bold text-foreground mb-8">
              Why Choose Evently?
            </h2>
            <p className="font-body text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Everything you need to plan and book amazing events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Easy Search Card */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-party border border-white/60 hover:shadow-glow-hover transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-party-green/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-party rounded-3xl mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Search className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-bold mb-4 text-card-foreground">Easy Search 🔍</h3>
                <p className="font-body text-base text-muted-foreground leading-relaxed">Find exactly what you need with smart filters and instant results</p>
              </div>
            </div>

            {/* Trusted Vendors Card */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-party border border-white/60 hover:shadow-glow-hover transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-party-coral/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-celebration rounded-3xl mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-bold mb-4 text-card-foreground">Trusted Vendors ⭐</h3>
                <p className="font-body text-base text-muted-foreground leading-relaxed">Verified professionals with real reviews from real customers</p>
              </div>
            </div>

            {/* Instant Booking Card */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-party border border-white/60 hover:shadow-glow-hover transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-party-purple/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-confetti rounded-3xl mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-bold mb-4 text-card-foreground">Instant Booking 🎯</h3>
                <p className="font-body text-base text-muted-foreground leading-relaxed">Book your perfect vendor in seconds with our streamlined process</p>
              </div>
            </div>

            {/* Secure & Fun Card */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-party border border-white/60 hover:shadow-glow-hover transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-party-orange/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-festive rounded-3xl mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-bold mb-4 text-card-foreground">Safe & Secure 🛡️</h3>
                <p className="font-body text-base text-muted-foreground leading-relaxed">Protected payments and verified vendors give you peace of mind</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
              Trusted by Thousands
            </h2>
            <p className="font-body text-lg md:text-xl text-muted-foreground">
              Real feedback from real customers and vendors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400 text-lg">
                  ★★★★★
                </div>
              </div>
              <p className="font-body text-card-foreground mb-6 leading-relaxed italic">
                "Evently made finding and booking vendors so easy. The platform is intuitive and the vendors are top-quality."
              </p>
              <div>
                <p className="font-heading font-semibold text-card-foreground">Sarah Johnson</p>
                <p className="font-body text-sm text-muted-foreground">Event Planner</p>
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400 text-lg">
                  ★★★★★
                </div>
              </div>
              <p className="font-body text-card-foreground mb-6 leading-relaxed italic">
                "As a vendor, Evently has helped me grow my business significantly. Great platform with excellent support."
              </p>
              <div>
                <p className="font-heading font-semibold text-card-foreground">Mike Chen</p>
                <p className="font-body text-sm text-muted-foreground">Wedding Photographer</p>
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400 text-lg">
                  ★★★★★
                </div>
              </div>
              <p className="font-body text-card-foreground mb-6 leading-relaxed italic">
                "Planning my wedding was stress-free thanks to Evently. Found amazing vendors and everything went smoothly."
              </p>
              <div>
                <p className="font-heading font-semibold text-card-foreground">Emily Davis</p>
                <p className="font-body text-sm text-muted-foreground">Bride</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
