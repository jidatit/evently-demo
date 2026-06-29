import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Shield,
  Sparkles,
  Store,
  Users,
} from 'lucide-react';
import type { CarouselApi } from '@/components/ui/carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import BookDLogo from '@/components/BookDLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    icon: Sparkles,
    title: 'Celebrate every moment',
    description:
      'Evently is your all-in-one marketplace for weddings, parties, corporate events, and everything in between.',
    highlights: ['Curated vendor discovery', 'Real-time availability', 'Joyful planning experience'],
  },
  {
    icon: Users,
    title: 'Built for event planners',
    description:
      'Customers browse verified professionals, compare services, message vendors, and book with confidence.',
    highlights: ['Smart vendor search', 'Booking management', 'Planning tools in one place'],
  },
  {
    icon: Store,
    title: 'Grow your vendor business',
    description:
      'Vendors showcase services, respond to leads, manage calendars, and get paid securely on Evently.',
    highlights: ['Service listings', 'Inquiry inbox', 'Earnings dashboard'],
  },
  {
    icon: Shield,
    title: 'Trusted & transparent',
    description:
      'Secure payments, verified profiles, and platform oversight keep every celebration safe and stress-free.',
    highlights: ['Protected transactions', 'Verified networks', 'Dedicated admin tools'],
  },
] as const;

const ROLES = [
  {
    id: 'customer' as const,
    label: 'Customer',
    dashboard: '/dashboard',
    tabActive: 'border-primary bg-primary/10 text-primary',
    quickAccent: 'border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10',
    iconBg: 'bg-primary/15 text-primary',
  },
  {
    id: 'vendor' as const,
    label: 'Vendor',
    dashboard: '/vendor-dashboard',
    tabActive: 'border-secondary bg-secondary/10 text-secondary',
    quickAccent: 'border-secondary/30 hover:border-secondary bg-secondary/5 hover:bg-secondary/10',
    iconBg: 'bg-secondary/15 text-secondary',
  },
  {
    id: 'admin' as const,
    label: 'Admin',
    dashboard: '/admin-dashboard',
    tabActive: 'border-party-purple bg-party-purple/10 text-party-purple',
    quickAccent: 'border-party-purple/30 hover:border-party-purple bg-party-purple/5 hover:bg-party-purple/10',
    iconBg: 'bg-party-purple/15 text-party-purple',
  },
] as const;

type AuthMode = 'signin' | 'signup';
type RoleId = (typeof ROLES)[number]['id'];

const EntryScreen: React.FC = () => {
  const {
    quickLogin,
    login,
    signup,
    isLoading,
    isAuthenticated,
    isCustomer,
    isVendor,
    isAdmin,
    isPendingVendor,
  } = useConsolidatedAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [selectedRole, setSelectedRole] = useState<RoleId>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [signingInAs, setSigningInAs] = useState<RoleId | null>(null);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    if (isAdmin) navigate('/admin-dashboard', { replace: true });
    else if (isVendor) navigate('/vendor-dashboard', { replace: true });
    else if (isPendingVendor) navigate('/vendor-onboarding', { replace: true });
    else if (isCustomer) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, isLoading, isAdmin, isVendor, isPendingVendor, isCustomer, navigate]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => setActiveSlide(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;

    const interval = window.setInterval(() => {
      if (carouselApi.canScrollNext()) carouselApi.scrollNext();
      else carouselApi.scrollTo(0);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [carouselApi]);

  const scrollToSlide = useCallback(
    (index: number) => carouselApi?.scrollTo(index),
    [carouselApi],
  );

  const handleQuickLogin = async (role: RoleId, dashboard: string) => {
    setSigningInAs(role);
    try {
      await quickLogin(role);
      navigate(dashboard);
    } finally {
      setSigningInAs(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (authMode === 'signin') {
        const { error } = await login(email.trim(), password);
        if (error) return;
      } else {
        if (selectedRole === 'admin') return;
        const signupType = selectedRole === 'vendor' ? 'vendor' : 'customer';
        const { error } = await signup(email.trim(), password, name.trim() || undefined, signupType);
        if (error) return;
      }
    } finally {
      setFormLoading(false);
    }
  };

  const isBusy = isLoading || formLoading || signingInAs !== null;
  const selectedRoleConfig = ROLES.find((r) => r.id === selectedRole)!;

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col lg:flex-row lg:min-h-screen">
      {/* Left — info slider (below auth on mobile) */}
      <section className="order-2 lg:order-1 relative flex flex-col bg-primary text-primary-foreground w-full lg:w-[44%] xl:w-[42%] lg:shrink-0 overflow-hidden lg:min-h-screen lg:sticky lg:top-0 lg:self-start">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-party-coral/20 blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-32 sm:w-48 h-32 sm:h-48 rounded-full bg-party-yellow/10 blur-2xl" />
        </div>

        <div className="relative z-10 px-4 pt-5 sm:px-8 sm:pt-8 lg:px-14 lg:pt-12 hidden lg:block">
          <BookDLogo size="lg" className="[&_*]:text-white [&_.text-primary]:text-white" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-4 py-5 sm:px-8 sm:py-8 lg:px-14 lg:py-8">
          <p className="lg:hidden text-xs font-heading font-semibold uppercase tracking-wider text-primary-foreground/70 mb-3">
            About Evently
          </p>

          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: true, align: 'start' }}
            className="w-full max-w-lg mx-auto lg:mx-0 touch-pan-y"
          >
            <CarouselContent className="-ml-0">
              {SLIDES.map(({ icon: Icon, title, description, highlights }) => (
                <CarouselItem key={title} className="pl-0 basis-full">
                  <div className="pr-1 sm:pr-2 select-none">
                    <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white/15 mb-3 sm:mb-6">
                      <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                    </div>
                    <h1 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-2 sm:mb-4">
                      {title}
                    </h1>
                    <p className="text-primary-foreground/85 text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-6 line-clamp-3 sm:line-clamp-none">
                      {description}
                    </p>
                    <ul className="hidden sm:block space-y-2 sm:space-y-2.5">
                      {highlights.map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-sm sm:text-base">
                          <Heart className="h-4 w-4 shrink-0 text-party-yellow fill-party-yellow/30" />
                          <span className="text-primary-foreground/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="flex items-center justify-between mt-4 sm:mt-8 max-w-lg mx-auto lg:mx-0 w-full gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {SLIDES.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => scrollToSlide(index)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    activeSlide === index ? 'w-6 sm:w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60',
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => carouselApi?.scrollPrev()}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors touch-manipulation"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => carouselApi?.scrollNext()}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors touch-manipulation"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <p className="relative z-10 hidden sm:block px-4 pb-5 sm:px-8 sm:pb-8 lg:px-14 lg:pb-10 text-primary-foreground/60 text-xs sm:text-sm">
          Swipe or use arrows to learn more about Evently.
        </p>
      </section>

      {/* Right — auth form + quick access (first on mobile) */}
      <section className="order-1 lg:order-2 flex-1 flex flex-col justify-start lg:justify-center bg-party-cream px-4 py-6 sm:px-8 sm:py-10 lg:px-16 lg:py-10 min-w-0 lg:overflow-y-auto">
        <div className="w-full max-w-md mx-auto min-w-0">
          <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6 lg:hidden">
            <BookDLogo size="sm" />
          </div>

          <div className="mb-5 sm:mb-6">
            <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {authMode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {authMode === 'signin'
                ? 'Sign in to access your Evently dashboard.'
                : 'Join Evently and start planning or selling today.'}
            </p>
          </div>

          {/* Sign in / Sign up toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted mb-4 sm:mb-5">
            {(['signin', 'signup'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAuthMode(mode)}
                className={cn(
                  'rounded-lg py-2.5 sm:py-3 text-sm font-heading font-semibold transition-all touch-manipulation min-h-[44px]',
                  authMode === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
            {ROLES.map(({ id, label, tabActive }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedRole(id)}
                className={cn(
                  'rounded-xl border-2 py-2.5 px-1.5 sm:px-2 text-[11px] sm:text-sm font-heading font-semibold transition-all touch-manipulation min-h-[44px]',
                  selectedRole === id
                    ? tabActive
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => void handleFormSubmit(e)} className="space-y-4">
            {authMode === 'signup' && selectedRole !== 'admin' && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isBusy}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBusy}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={authMode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isBusy}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={authMode === 'signup' ? 8 : 6}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {authMode === 'signup' && selectedRole === 'admin' && (
              <p className="text-sm text-muted-foreground rounded-lg bg-muted px-3 py-2">
                Admin accounts are available via demo access below.
              </p>
            )}

            <Button
              type="submit"
              disabled={isBusy || (authMode === 'signup' && selectedRole === 'admin')}
              className="w-full rounded-full h-11 sm:h-12 font-cta shadow-party hover:shadow-party-hover touch-manipulation"
            >
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>{authMode === 'signin' ? 'Signing in…' : 'Creating account…'}</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">
                    {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                  </span>
                  <span className="hidden sm:inline">
                    {authMode === 'signin'
                      ? `Sign In as ${selectedRoleConfig.label}`
                      : `Create ${selectedRoleConfig.label} Account`}
                  </span>
                </>
              )}
            </Button>
          </form>

          {/* Demo quick access */}
          <div className="mt-6 sm:mt-8 pb-[env(safe-area-inset-bottom)]">
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-party-cream px-3 text-muted-foreground">Or demo access</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {ROLES.map(({ id, label, dashboard, quickAccent, iconBg }) => {
                const Icon = id === 'customer' ? Sparkles : id === 'vendor' ? Store : Shield;
                const isSigningIn = signingInAs === id;

                return (
                  <button
                    key={id}
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleQuickLogin(id, dashboard)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-xl border-2 p-2.5 sm:p-3 transition-all min-h-[72px] sm:min-h-0',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      'disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]',
                      quickAccent,
                    )}
                  >
                    <div className={cn('flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg', iconBg)}>
                      {isSigningIn ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-heading font-semibold text-foreground leading-tight text-center">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 sm:mt-5 space-y-2 text-center text-[11px] sm:text-xs text-muted-foreground break-words">
              <p>
                Demo:{' '}
                <span className="font-mono break-all">customer@evently.demo</span>
                {' / '}
                <span className="font-mono">Demo1234!</span>
              </p>
              <p className="hidden sm:block">
                Press{' '}
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  Ctrl+Shift+R
                </kbd>{' '}
                to reset demo data
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EntryScreen;
