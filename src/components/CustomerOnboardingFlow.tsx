
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Calendar, CreditCard, CheckCircle, ArrowRight, ArrowLeft, MapPin, Filter } from 'lucide-react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { toast } from 'sonner';

interface CustomerPreferences {
  interestedCategories: string[];
  location: string;
  budgetRange: string;
  eventTypes: string[];
}

const steps = [
  { id: 1, title: 'Welcome', icon: CheckCircle },
  { id: 2, title: 'Preferences', icon: Filter },
  { id: 3, title: 'Discover Vendors', icon: Search },
  { id: 4, title: 'Book & Pay', icon: CreditCard }
];

const categories = [
  { id: 'Catering', name: 'Catering', description: 'Food & beverage services' },
  { id: 'Photography', name: 'Photography', description: 'Event photography & videography' },
  { id: 'DJ/Music', name: 'DJ/Music', description: 'Music & entertainment' },
  { id: 'Decor', name: 'Decor', description: 'Event decoration & styling' }
];

const budgetRanges = [
  { value: 'under-500', label: 'Under $500' },
  { value: '500-1000', label: '$500 - $1,000' },
  { value: '1000-2500', label: '$1,000 - $2,500' },
  { value: '2500-5000', label: '$2,500 - $5,000' },
  { value: 'over-5000', label: '$5,000+' }
];

const eventTypes = [
  'Wedding', 'Birthday Party', 'Corporate Event', 'Anniversary', 'Baby Shower', 'Graduation', 'Holiday Party', 'Other'
];

export const CustomerOnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [preferences, setPreferences] = useState<CustomerPreferences>({
    interestedCategories: [],
    location: '',
    budgetRange: '',
    eventTypes: []
  });
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const { user } = useConsolidatedAuth();
  const navigate = useNavigate();

  const updatePreferences = (field: keyof CustomerPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    setPreferences(prev => ({
      ...prev,
      interestedCategories: prev.interestedCategories.includes(categoryId)
        ? prev.interestedCategories.filter(id => id !== categoryId)
        : [...prev.interestedCategories, categoryId]
    }));
  };

  const toggleEventType = (eventType: string) => {
    setPreferences(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(type => type !== eventType)
        : [...prev.eventTypes, eventType]
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = () => {
    toast.success('Welcome! You\'re ready to start booking amazing vendors.');
    navigate('/browse');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-3xl font-bold">Welcome to Book'D!</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover and book amazing local vendors for all your events. From weddings to birthday parties, 
                we'll help you find the perfect professionals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card className="text-center p-4">
                <Search className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Discover</h3>
                <p className="text-sm text-gray-600">Browse verified local vendors</p>
              </Card>
              <Card className="text-center p-4">
                <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Book</h3>
                <p className="text-sm text-gray-600">Secure your date instantly</p>
              </Card>
              <Card className="text-center p-4">
                <CreditCard className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Pay Safely</h3>
                <p className="text-sm text-gray-600">Secure payment processing</p>
              </Card>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What makes Book'D special?</h3>
              <ul className="text-blue-800 text-sm space-y-2">
                <li>• All vendors are verified and reviewed by real customers</li>
                <li>• Secure payment processing with fraud protection</li>
                <li>• 24/7 customer support for your peace of mind</li>
                <li>• Easy booking management and communication</li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Tell us about your needs</h2>
              <p className="text-gray-600">This helps us recommend the best vendors for you</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold mb-4 block">What services are you looking for?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <Card 
                      key={category.id}
                      className={`cursor-pointer transition-all ${
                        preferences.interestedCategories.includes(category.id)
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                          {preferences.interestedCategories.includes(category.id) && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-lg font-semibold">Your Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      value={preferences.location}
                      onChange={(e) => updatePreferences('location', e.target.value)}
                      placeholder="City, State"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Budget Range</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {budgetRanges.map((range) => (
                      <label key={range.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="budget"
                          value={range.value}
                          checked={preferences.budgetRange === range.value}
                          onChange={(e) => updatePreferences('budgetRange', e.target.value)}
                          className="text-primary"
                        />
                        <span className="text-sm">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-lg font-semibold mb-4 block">Types of events you're planning</Label>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map((eventType) => (
                    <Badge
                      key={eventType}
                      variant={preferences.eventTypes.includes(eventType) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleEventType(eventType)}
                    >
                      {eventType}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Discover Great Vendors</h2>
              <p className="text-gray-600">Based on your preferences, here are some recommended vendors</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Your Search Criteria</h3>
              <div className="flex flex-wrap gap-2">
                {preferences.interestedCategories.map(cat => (
                  <Badge key={cat} variant="secondary">{cat}</Badge>
                ))}
                {preferences.location && <Badge variant="secondary">{preferences.location}</Badge>}
                {preferences.budgetRange && <Badge variant="secondary">{budgetRanges.find(b => b.value === preferences.budgetRange)?.label}</Badge>}
              </div>
            </div>

            {/* Sample vendor cards for demo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-gray-500">Sample Photo</span>
                    </div>
                    <h3 className="font-semibold text-lg">Sample Vendor {i}</h3>
                    <p className="text-gray-600 text-sm mb-2">Professional catering service</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Catering</Badge>
                      <span className="font-semibold text-primary">$75/hour</span>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => setSelectedVendor(i)}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" size="lg">
                <Search className="h-4 w-4 mr-2" />
                Browse All Vendors
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Ready to Book?</h2>
              <p className="text-gray-600">Learn how our secure booking and payment process works</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center p-6">
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">1. Select Date & Time</h3>
                <p className="text-sm text-gray-600">Choose your event date and preferred time slot</p>
              </Card>
              
              <Card className="text-center p-6">
                <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">2. Secure Payment</h3>
                <p className="text-sm text-gray-600">Pay safely with encrypted payment processing</p>
              </Card>
              
              <Card className="text-center p-6">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">3. Confirmation</h3>
                <p className="text-sm text-gray-600">Get instant confirmation and vendor contact info</p>
              </Card>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-green-900 mb-4">Your booking is protected by:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Secure Payments</h4>
                      <p className="text-sm text-green-700">All payments processed through Stripe with fraud protection</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Verified Vendors</h4>
                      <p className="text-sm text-green-700">All vendors are background checked and verified</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">24/7 Support</h4>
                      <p className="text-sm text-green-700">Get help anytime before, during, or after your event</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Easy Communication</h4>
                      <p className="text-sm text-green-700">Built-in messaging to coordinate with your vendor</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">You're All Set!</h3>
              <p className="text-gray-600 mb-6">Start browsing vendors and book your first event</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Get Started with Book'D</h1>
            <span className="text-sm text-gray-500">Step {currentStep} of 4</span>
          </div>
          
          <Progress value={(currentStep / 4) * 100} className="mb-6" />
          
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${currentStep >= step.id 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-gray-300 text-gray-400'
                  }
                `}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:block ${
                  currentStep >= step.id ? 'text-primary' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={nextStep} className="flex items-center">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={completeOnboarding}
              className="flex items-center bg-green-600 hover:bg-green-700"
            >
              Start Booking
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
