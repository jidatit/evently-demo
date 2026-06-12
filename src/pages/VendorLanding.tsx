
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  Star,
  ArrowRight,
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';

const VendorLanding = () => {
  const benefits = [
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Secure Payments",
      description: "Get paid instantly with our secure payment processing. No more chasing invoices."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Verified Customers",
      description: "Connect with genuine customers who are ready to book your services."
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Easy Booking Tools",
      description: "Manage your calendar, bookings, and availability all in one place."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Notifications",
      description: "Never miss a booking request with real-time notifications."
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Grow Your Revenue",
      description: "Access new customers and increase your bookings by 3x on average."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "24/7 Support",
      description: "Get help whenever you need it with our dedicated vendor support team."
    }
  ];

  const trustBadges = [
    { text: "SSL Secured", icon: <Shield className="h-4 w-4" /> },
    { text: "10,000+ Vendors", icon: <Users className="h-4 w-4" /> },
    { text: "5 Star Rated", icon: <Star className="h-4 w-4" /> },
    { text: "Fast Payouts", icon: <CreditCard className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-300"></div>
        </div>

        <div className="container mx-auto text-center relative z-10">
          {/* Special Offer Badge */}
          <Badge className="mb-6 px-6 py-2 text-lg bg-gradient-to-r from-accent to-accent/80 text-white hover:from-accent/90 hover:to-accent/70 animate-bounce">
            🎉 LIMITED TIME: First 3 Bookings FREE
          </Badge>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-green to-secondary-dark bg-clip-text text-transparent">
            Join Evently and 
            <br />
            <span className="text-accent">Grow Your Business</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-medium">
            Connect with thousands of customers looking for your services. 
            <span className="text-accent font-bold"> Zero platform fees on your first 3 bookings!</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/become-vendor">
              <Button 
                size="cta" 
                className="bg-gradient-to-r from-primary to-primary-green-dark hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Sign Up as a Vendor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="cta"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
            >
              Watch Demo Video
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4">
            {trustBadges.map((badge, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="px-4 py-2 text-sm border-primary/30 text-primary bg-white/80 backdrop-blur-sm"
              >
                {badge.icon}
                <span className="ml-2">{badge.text}</span>
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-secondary-dark">
              Why Choose Evently?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of successful vendors who have transformed their business with our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-white to-primary/5 overflow-hidden"
              >
                <CardContent className="p-8 text-center">
                  <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-green text-white group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-secondary-dark">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-primary-green text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Join Our Growing Community
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-2">10K+</div>
              <div className="text-xl opacity-90">Active Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-2">50K+</div>
              <div className="text-xl opacity-90">Bookings Made</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-2">$2M+</div>
              <div className="text-xl opacity-90">Paid to Vendors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-light-neutral">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-secondary-dark">
            What Our Vendors Say
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                business: "Elite Catering",
                rating: 5,
                text: "Evently tripled my bookings in the first month. The platform is so easy to use!"
              },
              {
                name: "Marcus Johnson",
                business: "Groove DJ Services",
                rating: 5,
                text: "Finally, a platform that actually cares about vendors. Great support and fast payments."
              },
              {
                name: "Lisa Rodriguez",
                business: "Capture Moments Photography",
                rating: 5,
                text: "The quality of customers on Evently is amazing. They're serious about booking!"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold text-secondary-dark">{testimonial.name}</div>
                    <div className="text-sm text-primary">{testimonial.business}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-accent via-accent/90 to-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join Evently today and start connecting with customers who are ready to book your services.
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <Link to="/become-vendor">
              <Button 
                size="cta" 
                className="bg-white text-accent hover:bg-light-neutral hover:scale-105 transition-all duration-300 shadow-2xl"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Get Started - It's Free!
              </Button>
            </Link>
            
            <p className="text-sm opacity-75">
              No setup fees • No monthly costs • Only pay when you earn
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VendorLanding;
