
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface EventShowcase {
  id: string;
  title: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  eventType: string;
}

const RealEventsCarousel: React.FC = () => {
  const eventShowcases: EventShowcase[] = [
    {
      id: '1',
      title: 'Marina\'s Dream Wedding',
      description: 'Transformed from empty venue to magical fairytale celebration',
      beforeImage: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e0?w=400&h=300&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
      eventType: 'Wedding'
    },
    {
      id: '2',
      title: 'Tech Company Launch Party',
      description: 'Corporate space became an innovative networking paradise',
      beforeImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
      eventType: 'Corporate'
    },
    {
      id: '3',
      title: 'Sophia\'s Sweet 16',
      description: 'Backyard transformed into Instagram-worthy birthday bash',
      beforeImage: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
      eventType: 'Birthday'
    },
    {
      id: '4',
      title: 'Golden Anniversary Celebration',
      description: 'Simple gathering became elegant milestone celebration',
      beforeImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
      eventType: 'Anniversary'
    }
  ];

  return (
    <div className="py-20 bg-gradient-to-br from-cyan-50 via-lime-50 to-yellow-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Sparkles className="absolute top-10 left-10 h-8 w-8 text-cyan-400 animate-pulse" />
        <Sparkles className="absolute top-20 right-20 h-6 w-6 text-lime-400 animate-pulse" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute bottom-20 left-1/4 h-7 w-7 text-yellow-400 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-800 mb-4">
            🎉 See How Book'D Brought These LA Parties to Life
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real events, real transformations, real magic - see the before and after of unforgettable celebrations
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {eventShowcases.map((event) => (
                <CarouselItem key={event.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="border-4 border-gradient-to-br from-cyan-200 to-lime-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden group">
                    <CardContent className="p-0">
                      {/* Before/After Images */}
                      <div className="relative">
                        <div className="grid grid-cols-2 gap-0">
                          <div className="relative">
                            <img
                              src={event.beforeImage}
                              alt={`${event.title} - Before`}
                              className="w-full h-48 object-cover"
                              onError={(e) => { 
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                            <div className="absolute top-2 left-2 bg-gray-800/80 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              BEFORE
                            </div>
                          </div>
                          <div className="relative">
                            <img
                              src={event.afterImage}
                              alt={`${event.title} - After`}
                              className="w-full h-48 object-cover"
                              onError={(e) => { 
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                            <div className="absolute top-2 right-2 bg-lime-500 text-black px-2 py-1 rounded-full text-xs font-semibold">
                              AFTER
                            </div>
                          </div>
                        </div>
                        
                        {/* Event Type Badge */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                          <span className="text-sm font-bold text-gray-800">{event.eventType}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h4 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-lime-600 transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-white/90 hover:bg-white shadow-lg border-2 border-lime-200" />
            <CarouselNext className="right-4 bg-white/90 hover:bg-white shadow-lg border-2 border-lime-200" />
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default RealEventsCarousel;
