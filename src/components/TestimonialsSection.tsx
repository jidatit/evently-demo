
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  eventType: string;
  review: string;
  photo: string;
  rating: number;
}

const TestimonialsSection: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Martinez',
      eventType: 'Wedding',
      review: 'Book\'D made planning our dream wedding effortless - found the perfect DJ and caterer in minutes!',
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      rating: 5
    },
    {
      id: '2',
      name: 'Mike Chen',
      eventType: 'Corporate Event',
      review: 'The vendors were professional and the booking process was seamless - our company party was a huge success!',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 5
    },
    {
      id: '3',
      name: 'Jessica Torres',
      eventType: 'Birthday Party',
      review: 'Amazing selection of vendors and super easy to compare prices - my daughter\'s party was magical!',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 5
    },
    {
      id: '4',
      name: 'David Kim',
      eventType: 'Anniversary',
      review: 'Book\'D helped us throw the perfect anniversary celebration with trusted local vendors.',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      rating: 5
    }
  ];

  return (
    <div className="py-20 bg-gradient-to-r from-lime-50 to-yellow-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-800 mb-4">
            💫 What Our Party Planners Say
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of happy customers who've made their events unforgettable with Book'D
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.id} 
              className="border-4 border-gradient-to-br from-lime-200 to-yellow-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in rounded-2xl overflow-hidden"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full mx-auto border-4 border-lime-300 shadow-lg"
                    onError={(e) => { 
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
                
                <div className="flex justify-center mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 text-sm mb-4 italic leading-relaxed">
                  "{testimonial.review}"
                </p>
                
                <div className="border-t-2 border-lime-200 pt-4">
                  <h4 className="font-bold text-gray-800 text-lg">{testimonial.name}</h4>
                  <p className="text-lime-600 font-semibold text-sm">{testimonial.eventType}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
