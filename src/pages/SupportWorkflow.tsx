
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EscalationWorkflow } from '@/components/EscalationWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  Phone,
  ExternalLink,
  Settings,
  Users,
  Clock
} from 'lucide-react';
import Footer from '@/components/Footer';

const SupportWorkflow: React.FC = () => {
  const helpdeskIntegrations = [
    {
      name: 'Zendesk',
      description: 'Enterprise-grade helpdesk with advanced ticketing',
      features: ['Multi-channel support', 'Automated workflows', 'Reporting dashboard', 'Knowledge base'],
      pricing: '$49/agent/month',
      recommended: true
    },
    {
      name: 'HelpScout',
      description: 'User-friendly helpdesk focused on customer experience',
      features: ['Shared inbox', 'Live chat', 'Knowledge base', 'Customer profiles'],
      pricing: '$25/agent/month',
      recommended: false
    },
    {
      name: 'Intercom',
      description: 'Modern messaging platform with automation',
      features: ['Real-time chat', 'Bot automation', 'Customer segmentation', 'In-app messaging'],
      pricing: '$39/agent/month',
      recommended: false
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: 'Ticket Reception',
      description: 'Customer submits ticket via email, chat, or form',
      automation: 'Auto-categorize based on keywords and route to appropriate team'
    },
    {
      step: 2,
      title: 'Initial Response',
      description: 'Send acknowledgment and initial assessment',
      automation: 'Auto-reply with ticket number and expected response time'
    },
    {
      step: 3,
      title: 'Investigation',
      description: 'Support agent reviews issue and gathers information',
      automation: 'Pull customer history, booking details, and related data'
    },
    {
      step: 4,
      title: 'Resolution',
      description: 'Provide solution or escalate if needed',
      automation: 'Suggest solutions from knowledge base, auto-escalate based on criteria'
    },
    {
      step: 5,
      title: 'Follow-up',
      description: 'Confirm resolution and close ticket',
      automation: 'Send satisfaction survey and auto-close after 48 hours'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Support Workflow Documentation</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete guide to Book'D's customer support infrastructure, tools, and processes
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tools">Tools & Setup</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="escalation">Escalation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Support Infrastructure Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Mail className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">Email Support</h3>
                    <p className="text-sm text-muted-foreground">Primary: support@bookd.com</p>
                    <p className="text-sm text-muted-foreground">Emergency: emergency@bookd.com</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-semibold">Live Chat</h3>
                    <p className="text-sm text-muted-foreground">Business hours: 9 AM - 9 PM EST</p>
                    <p className="text-sm text-muted-foreground">Response: Under 5 minutes</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Phone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-semibold">Phone Support</h3>
                    <p className="text-sm text-muted-foreground">1-800-BOOKD-HELP</p>
                    <p className="text-sm text-muted-foreground">Mon-Fri: 9 AM - 6 PM EST</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Key Metrics & Goals</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-yellow-900">First Response</div>
                      <div className="text-yellow-700">Target: 2 hours</div>
                    </div>
                    <div>
                      <div className="font-medium text-yellow-900">Resolution Rate</div>
                      <div className="text-yellow-700">Target: 95% Level 1</div>
                    </div>
                    <div>
                      <div className="font-medium text-yellow-900">Customer Satisfaction</div>
                      <div className="text-yellow-700">Target: 4.5/5 stars</div>
                    </div>
                    <div>
                      <div className="font-medium text-yellow-900">Ticket Volume</div>
                      <div className="text-yellow-700">Projected: 50-100/day</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Helpdesk Tools</CardTitle>
                <p className="text-muted-foreground">
                  Comparison of helpdesk solutions suitable for Book'D's needs
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {helpdeskIntegrations.map((tool, index) => (
                    <Card key={index} className={`relative ${tool.recommended ? 'border-green-200 bg-green-50' : ''}`}>
                      {tool.recommended && (
                        <Badge className="absolute -top-2 -right-2 bg-green-600">
                          Recommended
                        </Badge>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium mb-1">Key Features:</h4>
                            <ul className="text-sm space-y-1">
                              {tool.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-lg font-semibold text-primary">{tool.pricing}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Implementation Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Email Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div>• Set up support@bookd.com forwarding</div>
                      <div>• Configure emergency@bookd.com priority routing</div>
                      <div>• Create disputes@bookd.com for payment issues</div>
                      <div>• Set up security@bookd.com for account issues</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Automation Rules</h4>
                    <div className="space-y-2 text-sm">
                      <div>• Auto-tag tickets by category keywords</div>
                      <div>• Route payment issues to specialized team</div>
                      <div>• Escalate based on customer tier/value</div>
                      <div>• Send satisfaction surveys on resolution</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Standard Support Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowSteps.map((step, index) => (
                    <div key={step.step} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{step.title}</h4>
                        <p className="text-muted-foreground mb-2">{step.description}</p>
                        <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2">
                          <strong>Automation:</strong> {step.automation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Time Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">By Priority Level</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span className="font-medium">Critical</span>
                        <span className="text-red-700">2 hours</span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-50 rounded">
                        <span className="font-medium">High</span>
                        <span className="text-orange-700">4 hours</span>
                      </div>
                      <div className="flex justify-between p-2 bg-yellow-50 rounded">
                        <span className="font-medium">Medium</span>
                        <span className="text-yellow-700">24 hours</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span className="font-medium">Low</span>
                        <span className="text-green-700">48 hours</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">By Channel</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">Live Chat</span>
                        <span>5 minutes</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">Phone</span>
                        <span>Immediate</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">Email</span>
                        <span>Based on priority</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">Social Media</span>
                        <span>2 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escalation">
            <EscalationWorkflow />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default SupportWorkflow;
