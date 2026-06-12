
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Calendar, Sparkles, Music, Camera, UtensilsCrossed, MapIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorCard from './VendorCard';
import TestimonialsSection from './TestimonialsSection';
import RealEventsCarousel from './RealEventsCarousel';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [searchVendorType, setSearchVendorType] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  // Future: This will be populated by geo-detection or user location preferences
  const userLocation = null; // Could be 'Chicago', 'New York', etc.

  // Dynamic heading based on location
  const getLocationHeading = () => {
    if (userLocation) {
      return `⭐ Top Vendors in ${userLocation}`;
    }
    return '⭐ Top Vendors Near You';
  };

  // Updated mock vendor data for nationwide coverage
  const topVendors = [
    {
      id: '1',
      business_name: 'Elite Event DJs',
      category: 'Music',
      description: 'Professional DJs specializing in weddings and corporate events with state-of-the-art sound equipment.',
      location: 'New York, NY',
      rating: 4.9,
      reviews: 156,
      price: 'Starting at $800',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      responseTime: '< 2 hours',
      isNationwide: true
    },
    {
      id: '2',
      business_name: 'Nationwide Catering Co.',
      category: 'Catering',
      description: 'Award-winning catering service offering farm-to-table cuisine for events of all sizes across the country.',
      location: 'Chicago, IL',
      rating: 4.8,
      reviews: 203,
      price: 'Starting at $45/person',
      image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop',
      responseTime: '< 4 hours',
      isNationwide: true
    },
    {
      id: '3',
      business_name: 'Creative Lens Photography',
      category: 'Photography',
      description: 'Creative photographers capturing your special moments with artistic flair and professional quality.',
      location: 'Austin, TX',
      rating: 4.9,
      reviews: 89,
      price: 'Starting at $1,200',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
      responseTime: '< 6 hours',
      isNationwide: false
    }
  ];

  const handleSearch = () => {
    if (searchVendorType && searchLocation) {
      navigate(`/browse?category=${searchVendorType}&location=${searchLocation}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-neutral via-primary/5 to-light-neutral relative overflow-hidden">
      {/* Enhanced Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated confetti decorations */}
        <div className="absolute top-20 left-10 w-6 h-6 bg-primary rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-32 right-20 w-4 h-4 bg-accent rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-40 left-1/4 w-8 h-8 bg-primary/80 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-60 right-1/3 w-3 h-3 bg-accent/70 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-80 left-3/4 w-5 h-5 bg-primary/60 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '2s' }}></div>
        
        {/* Enhanced sparkle effects */}
        <Sparkles className="absolute top-16 right-16 h-10 w-10 text-primary animate-pulse drop-shadow-lg" />
        <Sparkles className="absolute top-96 left-16 h-8 w-8 text-accent animate-pulse drop-shadow-lg" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute top-52 right-1/2 h-12 w-12 text-primary/70 animate-pulse drop-shadow-lg" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-20">
          {/* Animated Logo */}
          <div className="mb-8 animate-bounce">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary to-primary/80 rounded-3xl mb-6 shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-500">
              <span className="text-5xl font-bold text-light-neutral drop-shadow-lg font-heading">B</span>
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold text-primary mb-8 tracking-tight drop-shadow-lg font-cursive">
            Book'D
          </h1>
          
          <h2 className="text-4xl md:text-6xl font-bold text-secondary-dark mb-6 leading-tight font-heading">
            Plan Less. Party More.
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Get Book'D Today.
            </span>
          </h2>
          
          <p className="text-2xl md:text-3xl text-secondary-dark/80 mb-10 font-bold max-w-4xl mx-auto font-body">
            Find trusted vendors anywhere in the U.S. — all in one place.
          </p>

          {/* Enhanced Start Planning Button */}
          <div className="mb-16">
            <Link to="/browse">
              <Button 
                variant="cta" 
                size="cta"
                className="bg-primary hover:bg-primary/90 text-light-neutral text-2xl px-16 py-6 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 border-4 border-primary/20 hover:shadow-primary/30"
              >
                <Calendar className="mr-4 h-8 w-8" />
                Start Planning
              </Button>
            </Link>
          </div>

          {/* Enhanced Event Search Bar */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="bg-light-neutral rounded-3xl shadow-2xl p-8 border-4 border-primary/20 hover:border-primary/40 transition-all duration-300">
              <h3 className="text-2xl font-bold text-secondary-dark mb-6 flex items-center justify-center font-heading">
                <Search className="mr-3 h-7 w-7 text-primary" />
                Find Your Perfect Vendor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select value={searchVendorType} onValueChange={setSearchVendorType}>
                  <SelectTrigger className="h-14 text-xl border-3 border-primary/20 focus:border-primary rounded-2xl font-body font-bold">
                    <SelectValue placeholder="What do you need?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Music">DJ / Music</SelectItem>
                    <SelectItem value="Catering">Catering</SelectItem>
                    <SelectItem value="Photography">Photography</SelectItem>
                    <SelectItem value="Venue">Venue</SelectItem>
                    <SelectItem value="Decoration">Decoration</SelectItem>
                    <SelectItem value="Planning">Event Planning</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <Input
                    placeholder="Enter city, state..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-12 h-14 text-xl border-3 border-primary/20 focus:border-primary rounded-2xl font-body font-bold"
                  />
                </div>

                <Button
                  variant="cta"
                  onClick={handleSearch}
                  className="bg-accent hover:bg-accent/90 text-light-neutral h-14 text-xl rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  <Search className="mr-3 h-6 w-6" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Event Categories with Confetti Background */}
        <div className="mb-24 relative">
          {/* Festive Confetti Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Animated confetti particles */}
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-3 h-3 bg-primary/40 rounded-full animate-bounce`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
            {[...Array(10)].map((_, i) => (
              <div
                key={`accent-${i}`}
                className={`absolute w-2 h-2 bg-accent/30 rounded-full animate-bounce`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
            {/* Floating sparkles */}
            <Sparkles className="absolute top-10 left-10 h-6 w-6 text-primary/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Sparkles className="absolute top-20 right-20 h-4 w-4 text-accent/40 animate-pulse" style={{ animationDelay: '1.5s' }} />
            <Sparkles className="absolute bottom-10 left-1/3 h-5 w-5 text-primary/40 animate-pulse" style={{ animationDelay: '2.5s' }} />
          </div>

          <h3 className="text-4xl font-bold text-center text-secondary-dark mb-16 font-heading relative z-10">
            Popular Nationwide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
            {[
              { name: 'DJs & Music', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop', icon: Music, category: 'Music' },
              { name: 'Catering', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=300&h=300&fit=crop', icon: UtensilsCrossed, category: 'Catering' },
              { name: 'Photography', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=300&fit=crop', icon: Camera, category: 'Photography' },
              { name: 'Venues', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=300&h=300&fit=crop', icon: MapIcon, category: 'Venue' }
            ].map((item, index) => (
              <Link
                key={index}
                to={`/browse?category=${item.category}`}
                className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 border-4 border-primary/20 hover:border-primary/40"
              >
                <div className="aspect-square relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary-dark/80 via-secondary-dark/30 to-transparent"></div>
                  
                  {/* Enhanced gradient glow behind icon */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center mb-3">
                      <div className="relative mr-3">
                        {/* Gradient glow background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full blur-md scale-150 opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative bg-primary/20 backdrop-blur-sm rounded-full p-2 group-hover:bg-primary/30 transition-all duration-300">
                          <item.icon className="h-8 w-8 text-light-neutral drop-shadow-lg relative z-10" />
                        </div>
                      </div>
                      <span className="text-light-neutral font-bold text-xl drop-shadow-lg font-heading">{item.name}</span>
                    </div>
                  </div>
                </div>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Vendors Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold text-secondary-dark mb-6 font-heading">
              {getLocationHeading()}
            </h3>
            <p className="text-2xl text-secondary-dark/70 font-bold font-body">
              Discover the most trusted and highly-rated vendors nationwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {topVendors.map((vendor) => (
              <VendorCard key={vendor.id} {...vendor} />
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Link to="/browse">
              <Button 
                variant="cta" 
                size="cta"
                className="bg-primary hover:bg-primary/90 text-light-neutral text-xl px-12 py-4 rounded-full shadow-xl hover:scale-110 transition-all duration-300"
              >
                View All Vendors
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced App Store Section */}
        <div className="text-center mb-20">
          <div className="bg-light-neutral rounded-3xl shadow-2xl p-10 max-w-3xl mx-auto border-4 border-primary/20">
            <h4 className="text-3xl font-bold text-secondary-dark mb-6 font-heading">
              Get the Book'D App
            </h4>
            <p className="text-xl text-secondary-dark/70 mb-8 font-bold font-body">
              Plan your events on the go with our mobile app
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {/* Enhanced App Store Button */}
              <div className="bg-secondary-dark text-light-neutral px-8 py-4 rounded-2xl flex items-center gap-4 hover:bg-secondary-dark/80 hover:scale-105 transition-all duration-300 cursor-pointer shadow-xl">
                <div className="flex items-center justify-center w-10 h-10">
                  <svg viewBox="0 0 814 1000" className="w-8 h-8 fill-light-neutral">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 65.6 0 120.5 43.9 162.2 43.9 40.8 0 103.9-47.6 181.4-47.6 29.6 0 137.6 2.6 186.8 95.5-4.8 3.2-84.1 48.9-84.1 145.8zm-118.9-223.4c35.1-42.4 60.6-101.7 60.6-160.9 0-8.2-.8-16.6-2.3-24.9-57.8 2.6-127.6 38.6-169.5 85.2-33.1 37.4-65.6 97.8-65.6 157.4 0 9.1 1.6 18.2 2.9 21.2 4.8.8 10.4 1.6 16.1 1.6 51.9-.1 118.3-34.8 157.8-79.6z"/>
                  </svg>
                </div>
                <div className="text-sm">
                  <div>Download on the</div>
                  <div className="font-bold text-xl">App Store</div>
                </div>
              </div>

              {/* Enhanced Google Play Button */}
              <div className="bg-secondary-dark/90 text-light-neutral px-8 py-4 rounded-2xl flex items-center gap-4 hover:bg-secondary-dark/70 hover:scale-105 transition-all duration-300 cursor-pointer border border-secondary-dark/30 shadow-xl">
                <div className="flex items-center justify-center w-10 h-10">
                  <svg viewBox="0 0 512 512" className="w-8 h-8">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#8BC34A"/>
                    <path d="M47 0C34 0 23.3 9.6 21.3 22l0 468c0 12.4 10.7 22 23.7 22 4.7 0 9.1-1.4 12.9-4.1L510.5 273.5c7.6-4.4 12.5-12.5 12.5-21.5s-4.9-17.1-12.5-21.5L57.9 4.1C54.1 1.4 50.7 0 47 0z" fill="#FF6F61"/>
                    <path d="M325.3 277.7l60.1-60.1L104.6 499l220.7-221.3z" fill="#8BC34A"/>
                  </svg>
                </div>
                <div className="text-sm">
                  <div>GET IT ON</div>
                  <div className="font-bold text-xl">Google Play</div>
                </div>
              </div>
            </div>
            
            <p className="text-lg text-secondary-dark/50 mt-6 font-bold font-body">Coming soon to mobile devices</p>
          </div>
        </div>

        {/* Keep existing sections */}
        <TestimonialsSection />
        <RealEventsCarousel />
      </div>
    </div>
  );
};

export default Hero;
