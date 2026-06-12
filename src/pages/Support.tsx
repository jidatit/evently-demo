
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FAQSection } from '@/components/FAQSection';
import { SupportTicket } from '@/components/SupportTicket';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  MessageCircle, 
  Clock, 
  Shield, 
  CreditCard, 
  AlertTriangle,
  Phone,
  FileText
} from 'lucide-react';
import Footer from '@/components/Footer';

const Support: React.FC = () => {
  const [activeTab, setActiveTab] = useState('faq');

  const emergencyContacts = [
    {
      title: 'Payment Disputes',
      description: 'Issues with charges, refunds, or payment processing',
      icon: CreditCard,
      contact: 'disputes@bookd.com',
      phone: '1-800-BOOKD-PAY',
      priority: 'high'
    },
    {
      title: 'Event Day Emergency',
      description: 'Vendor no-show, last-minute cancellations, or urgent issues',
      icon: AlertTriangle,
      contact: 'emergency@bookd.com',
      phone: '1-800-BOOKD-911',
      priority: 'critical'
    },
    {
      title: 'Account Security',
      description: 'Suspicious activity, unauthorized access, or security concerns',
      icon: Shield,
      contact: 'security@bookd.com',
      phone: '1-800-BOOKD-SEC',
      priority: 'high'
    }
  ];

  const supportChannels = [
    {
      title: 'Email Support',
      description: 'Get detailed help via email',
      icon: Mail,
      contact: 'support@bookd.com',
      responseTime: '24 hours',
      available: '24/7'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: MessageCircle,
      contact: 'Available in app',
      responseTime: '5 minutes',
      available: '9 AM - 9 PM EST'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with support',
      icon: Phone,
      contact: '1-800-BOOKD-HELP',
      responseTime: 'Immediate',
      available: '9 AM - 6 PM EST, Mon-Fri'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Book'D Support Center</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're here to help you with any questions or issues. Find answers, contact support, 
            or get emergency assistance.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="ticket">Submit Ticket</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <FAQSection />
          </TabsContent>

          <TabsContent value="contact">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">Contact Support</h2>
                <p className="text-muted-foreground">
                  Choose the best way to reach our support team
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {supportChannels.map((channel, index) => (
                  <Card key={index} className="text-center">
                    <CardHeader>
                      <div className="flex justify-center mb-2">
                        <channel.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{channel.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{channel.description}</p>
                      <div className="space-y-1">
                        <div className="font-medium">{channel.contact}</div>
                        <div className="text-sm text-muted-foreground">
                          Response: {channel.responseTime}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {channel.available}
                        </div>
                      </div>
                      <Button className="w-full mt-4">Contact Now</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Support Hours & Response Times</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                        <div>
                          <p className="font-medium">Business Hours:</p>
                          <p>Monday - Friday: 9 AM - 6 PM EST</p>
                          <p>Saturday: 10 AM - 4 PM EST</p>
                          <p>Sunday: Closed (Emergency only)</p>
                        </div>
                        <div>
                          <p className="font-medium">Response Times:</p>
                          <p>Critical: Within 2 hours</p>
                          <p>High Priority: Within 4 hours</p>
                          <p>General: Within 24 hours</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ticket">
            <SupportTicket />
          </TabsContent>

          <TabsContent value="emergency">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4 text-red-700">Emergency Support</h2>
                <p className="text-muted-foreground">
                  For urgent issues that need immediate attention
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {emergencyContacts.map((emergency, index) => (
                  <Card key={index} className={`border-2 ${
                    emergency.priority === 'critical' ? 'border-red-300 bg-red-50' : 'border-orange-300 bg-orange-50'
                  }`}>
                    <CardHeader>
                      <div className="flex justify-center mb-2">
                        <emergency.icon className={`h-8 w-8 ${
                          emergency.priority === 'critical' ? 'text-red-600' : 'text-orange-600'
                        }`} />
                      </div>
                      <CardTitle className="text-lg text-center">{emergency.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-3">
                      <p className="text-sm text-muted-foreground">{emergency.description}</p>
                      <div className="space-y-2">
                        <div className="font-mono text-sm font-medium">{emergency.contact}</div>
                        <div className="font-mono text-lg font-bold">{emergency.phone}</div>
                      </div>
                      <Button 
                        className={`w-full ${
                          emergency.priority === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                        }`}
                      >
                        Contact Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-2">When to Use Emergency Support</h3>
                      <ul className="space-y-1 text-sm text-red-800">
                        <li>• Vendor doesn't show up on event day</li>
                        <li>• Unauthorized charges or payment issues</li>
                        <li>• Safety or security concerns</li>
                        <li>• Account compromise or suspicious activity</li>
                        <li>• Last-minute cancellations affecting your event</li>
                      </ul>
                      <p className="text-xs text-red-600 mt-3">
                        Emergency support is available 24/7 for critical issues only.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Support;
