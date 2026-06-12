
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'booking' | 'payment' | 'vendor' | 'cancellation';
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I book a vendor on Book\'D?',
    answer: 'Browse our vendor directory, select a vendor, review their services, and click "Book Now". Fill out the booking form with your event details and submit. The vendor will respond within 24 hours.',
    category: 'booking'
  },
  {
    id: '2',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover) through our secure Stripe payment system. Payments are processed securely and funds are held until your event is completed.',
    category: 'payment'
  },
  {
    id: '3',
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel your booking through your dashboard. Cancellation policies vary by vendor and timing. Review the specific cancellation terms in your booking agreement for refund eligibility.',
    category: 'cancellation'
  },
  {
    id: '4',
    question: 'How do refunds work?',
    answer: 'Refunds are processed according to the vendor\'s cancellation policy and timing of your cancellation. Approved refunds are processed back to your original payment method within 5-10 business days.',
    category: 'payment'
  },
  {
    id: '5',
    question: 'What if I have an issue with my vendor?',
    answer: 'First, try communicating directly with your vendor through our messaging system. If you cannot resolve the issue, contact our support team at support@bookd.com for assistance with dispute resolution.',
    category: 'general'
  },
  {
    id: '6',
    question: 'How do I become a vendor on Book\'D?',
    answer: 'Click "Become a Vendor" on our homepage, complete the application with your business details, upload required documents, and wait for approval. Our team reviews all applications within 2-3 business days.',
    category: 'vendor'
  },
  {
    id: '7',
    question: 'When do vendors get paid?',
    answer: 'Vendors receive payment 2-3 business days after the event is completed. Book\'D holds funds until event completion to ensure customer satisfaction. A 10% platform fee is deducted from vendor payouts.',
    category: 'vendor'
  },
  {
    id: '8',
    question: 'Is my payment information secure?',
    answer: 'Yes, all payment information is processed through Stripe, a PCI-compliant payment processor. Book\'D never stores your credit card details. All transactions are encrypted and secure.',
    category: 'payment'
  },
  {
    id: '9',
    question: 'Can I modify my booking after confirmation?',
    answer: 'Booking modifications depend on the vendor\'s availability and policies. Contact your vendor directly through our messaging system or reach out to support for assistance with changes.',
    category: 'booking'
  },
  {
    id: '10',
    question: 'What happens if my vendor cancels?',
    answer: 'If a vendor cancels your booking, you will receive a full refund within 3-5 business days. Our support team will also help you find alternative vendors for your event date.',
    category: 'cancellation'
  }
];

const categoryNames = {
  general: 'General',
  booking: 'Booking & Events',
  payment: 'Payments & Refunds',
  vendor: 'For Vendors',
  cancellation: 'Cancellations'
};

export const FAQSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = faqData.filter(item => item.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Find answers to common questions about Book'D</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {Object.entries(categoryNames).map(([key, name]) => (
          <Button
            key={key}
            variant={activeCategory === key ? "default" : "outline"}
            onClick={() => setActiveCategory(key)}
            className="mb-2"
          >
            {name}
          </Button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4 mb-8">
        {filteredFAQs.map((item) => (
          <Card key={item.id} className="border border-border">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleItem(item.id)}
            >
              <CardTitle className="flex items-center justify-between text-left">
                <span className="text-base font-medium">{item.question}</span>
                {openItems.has(item.id) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {openItems.has(item.id) && (
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Contact Support Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">Still need help?</h3>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Support
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Live Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
