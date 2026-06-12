
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Welcome to Book'D
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with local service vendors and book appointments seamlessly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
            <Link to="/become-vendor">
              <Button variant="outline" size="lg">
                Become a Vendor
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
