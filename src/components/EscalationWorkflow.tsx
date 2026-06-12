
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  Users, 
  Shield, 
  Gavel, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  ArrowDown
} from 'lucide-react';

interface EscalationStep {
  level: number;
  title: string;
  description: string;
  timeframe: string;
  responsible: string;
  triggers: string[];
  actions: string[];
  icon: React.ComponentType<any>;
}

const escalationSteps: EscalationStep[] = [
  {
    level: 1,
    title: 'Level 1: General Support',
    description: 'First line support for general inquiries and basic issues',
    timeframe: '24 hours',
    responsible: 'Support Specialist',
    triggers: [
      'General questions',
      'Account issues',
      'Basic booking problems',
      'Technical difficulties'
    ],
    actions: [
      'Respond to customer inquiry',
      'Provide standard solutions',
      'Update ticket status',
      'Escalate if unresolved within 24 hours'
    ],
    icon: User
  },
  {
    level: 2,
    title: 'Level 2: Senior Support',
    description: 'Complex issues requiring specialized knowledge',
    timeframe: '4-12 hours',
    responsible: 'Senior Support Specialist',
    triggers: [
      'Unresolved Level 1 tickets',
      'Payment processing issues',
      'Vendor-customer disputes',
      'Platform functionality problems'
    ],
    actions: [
      'Review case history',
      'Contact vendor/customer if needed',
      'Coordinate with technical team',
      'Implement advanced solutions'
    ],
    icon: Users
  },
  {
    level: 3,
    title: 'Level 3: Management Review',
    description: 'High-impact issues requiring management intervention',
    timeframe: '2-4 hours',
    responsible: 'Support Manager',
    triggers: [
      'Payment disputes over $500',
      'Legal threats or complaints',
      'Vendor suspension requests',
      'Platform security issues',
      'Multiple complaint patterns'
    ],
    actions: [
      'Review all documentation',
      'Consult with legal team if needed',
      'Make policy decisions',
      'Authorize refunds/compensation',
      'Coordinate with executive team'
    ],
    icon: Shield
  },
  {
    level: 4,
    title: 'Level 4: Executive & Legal',
    description: 'Critical issues with legal, financial, or reputational impact',
    timeframe: '1-2 hours',
    responsible: 'Executive Team & Legal Counsel',
    triggers: [
      'Legal action threatened/filed',
      'Regulatory inquiries',
      'Major platform failures',
      'Security breaches',
      'Media attention',
      'Disputes over $2,000'
    ],
    actions: [
      'Emergency response protocol',
      'Legal risk assessment',
      'Executive decision making',
      'External communication strategy',
      'Regulatory compliance review'
    ],
    icon: Gavel
  }
];

const specialEscalations = [
  {
    type: 'Payment Disputes',
    icon: CreditCard,
    description: 'Automated escalation for payment-related issues',
    criteria: [
      'Chargeback notifications → Immediate Level 3',
      'Failed refunds → Level 2 within 2 hours',
      'Disputed charges > $100 → Level 2',
      'Payment fraud suspected → Immediate Level 4'
    ]
  },
  {
    type: 'Event Day Emergencies',
    icon: AlertTriangle,
    description: 'Fast-track escalation for time-sensitive event issues',
    criteria: [
      'Vendor no-show same day → Immediate Level 3',
      'Safety concerns → Immediate Level 4',
      'Last-minute cancellations → Level 2 within 1 hour',
      'Equipment failure/damage → Level 2'
    ]
  },
  {
    type: 'Account Security',
    icon: Shield,
    description: 'Security-related issues requiring immediate attention',
    criteria: [
      'Suspected account breach → Immediate Level 3',
      'Identity theft reports → Level 3 within 2 hours',
      'Fraudulent vendor accounts → Level 3',
      'Data privacy complaints → Level 2'
    ]
  }
];

export const EscalationWorkflow: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Support Escalation Workflow</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our structured approach to handling customer support issues ensures timely resolution 
          and appropriate expertise for every situation.
        </p>
      </div>

      {/* Main Escalation Levels */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Escalation Levels</h2>
        {escalationSteps.map((step, index) => (
          <div key={step.level}>
            <Card className={`border-l-4 ${
              step.level === 1 ? 'border-l-green-500' :
              step.level === 2 ? 'border-l-yellow-500' :
              step.level === 3 ? 'border-l-orange-500' :
              'border-l-red-500'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <step.icon className="h-6 w-6" />
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {step.timeframe}
                    </Badge>
                    <Badge variant="secondary">{step.responsible}</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground">{step.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Escalation Triggers:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {step.triggers.map((trigger, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {trigger}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Actions Taken:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {step.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            {index < escalationSteps.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Special Escalation Rules */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Special Escalation Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {specialEscalations.map((special, index) => (
            <Card key={index} className="border-2 border-dashed">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <special.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{special.type}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{special.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs">
                  {special.criteria.map((criterion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowDown className="h-3 w-3 text-orange-500 mt-0.5" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* SLA Commitments */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Service Level Agreements (SLA)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">Response Time Commitments:</h4>
              <ul className="space-y-1">
                <li>• Critical issues: 2 hours maximum</li>
                <li>• High priority: 4 hours maximum</li>
                <li>• Medium priority: 24 hours maximum</li>
                <li>• Low priority: 48 hours maximum</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Resolution Commitments:</h4>
              <ul className="space-y-1">
                <li>• Payment emergencies: Same business day</li>
                <li>• Event day issues: Within 4 hours</li>
                <li>• Account problems: Within 2 business days</li>
                <li>• General inquiries: Within 3 business days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
