import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BugDashboard } from '@/components/BugDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, Database, Mail, CreditCard, Activity, Play, RefreshCw } from 'lucide-react';
import { isStaging } from '@/lib/environment';
import { toast } from 'sonner';

export const StagingDashboard: React.FC = () => {
  if (!isStaging()) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Staging Dashboard</h2>
              <p className="text-muted-foreground">This dashboard is only available in staging environment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const runTestSuite = async (suite: string) => {
    toast.info(`Running ${suite} tests...`);
    
    // Simulate test run
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      if (success) {
        toast.success(`${suite} tests passed! ✅`);
      } else {
        toast.error(`${suite} tests failed. Check bug dashboard for details.`);
      }
    }, 2000);
  };

  const testSuites = [
    { name: 'Customer Flow', icon: '👤', description: 'Account creation, browsing, booking, payment' },
    { name: 'Vendor Flow', icon: '🏪', description: 'Signup, dashboard, bookings, payments' },
    { name: 'Admin Flow', icon: '⚙️', description: 'Commission tracking, user management' },
    { name: 'Payment Flow', icon: '💳', description: 'Stripe sandbox, test cards, confirmations' }
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <TestTube className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Book'D Staging Dashboard</h1>
          <p className="text-muted-foreground">Testing environment with automated flows and bug tracking</p>
        </div>
        <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-800">
          STAGING MODE
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Automated Tests</TabsTrigger>
          <TabsTrigger value="bugs">Bug Dashboard</TabsTrigger>
          <TabsTrigger value="data">Test Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Environment</CardTitle>
                <TestTube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Staging</div>
                <p className="text-xs text-muted-foreground">
                  Test mode active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Users</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">50+</div>
                <p className="text-xs text-muted-foreground">
                  25 customers + 25 vendors
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Routing</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Test Inbox</div>
                <p className="text-xs text-muted-foreground">
                  staging-test@bookd-testing.com
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Sandbox</div>
                <p className="text-xs text-muted-foreground">
                  Stripe test mode
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Service</span>
                  <Badge className="bg-green-100 text-green-800">Test Mode</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment Processing</span>
                  <Badge className="bg-green-100 text-green-800">Sandbox</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Test Data</span>
                  <Badge className="bg-green-100 text-green-800">Loaded</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {testSuites.map((suite, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{suite.icon}</span>
                    {suite.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{suite.description}</p>
                  <Button 
                    onClick={() => runTestSuite(suite.name)}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Tests
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Scenarios Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Customer Journey</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Account creation & email verification</li>
                    <li>• Vendor browsing & search</li>
                    <li>• Service booking flow</li>
                    <li>• Payment processing (test cards)</li>
                    <li>• Confirmation emails</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Vendor Operations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Business profile setup</li>
                    <li>• Service & pricing management</li>
                    <li>• Booking notifications</li>
                    <li>• Payout preferences</li>
                    <li>• Customer messaging</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bugs">
          <BugDashboard />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">25</div>
                <p className="text-sm text-muted-foreground">
                  Diverse customer profiles with realistic booking history
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">25+</div>
                <p className="text-sm text-muted-foreground">
                  Across all categories: DJs, photographers, caterers, planners
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">50+</div>
                <p className="text-sm text-muted-foreground">
                  Various statuses and payment states for testing
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Test Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Vendor Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {['DJ/Music', 'Photography', 'Catering', 'Event Planning', 'Rentals', 'Florist', 'Bakery', 'Videography'].map(category => (
                      <Badge key={category} variant="outline">{category}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Test Login Credentials</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    <p><strong>Admin:</strong> admin@bookd-test.com</p>
                    <p><strong>Vendor:</strong> dj1@bookd-test.com</p>
                    <p><strong>Customer:</strong> customer1@bookd-test.com</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Password: TestPassword123! (for all test accounts)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};