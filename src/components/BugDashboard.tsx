import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Bug, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface StagingBug {
  id: string;
  issue_id: string;
  area: 'Customer Flow' | 'Vendor Flow' | 'Admin' | 'Payment' | 'UI/UX';
  title: string;
  steps_to_reproduce: string | null;
  error_message: string | null;
  status: 'Open' | 'Fixed' | 'Retest' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  created_at: string;
  updated_at: string;
}

export const BugDashboard: React.FC = () => {
  // Mock data for demonstration until staging_bugs table is created
  const [bugs, setBugs] = useState<StagingBug[]>([
    {
      id: '1',
      issue_id: 'BUG-001',
      area: 'Customer Flow',
      title: 'Sign up form validation error',
      steps_to_reproduce: '1. Go to signup page\n2. Leave email field empty\n3. Click submit',
      error_message: 'Email is required',
      status: 'Open',
      priority: 'Medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      issue_id: 'BUG-002',
      area: 'Payment',
      title: 'Stripe test payment fails',
      steps_to_reproduce: '1. Complete booking flow\n2. Enter test card 4242424242424242\n3. Submit payment',
      error_message: 'Payment intent creation failed',
      status: 'Fixed',
      priority: 'High',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      issue_id: 'BUG-003',
      area: 'Vendor Flow',
      title: 'Calendar not loading',
      steps_to_reproduce: '1. Login as vendor\n2. Navigate to dashboard\n3. Click calendar tab',
      error_message: 'Cannot read property of undefined',
      status: 'Open',
      priority: 'High',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      issue_id: 'BUG-004',
      area: 'UI/UX',
      title: 'Mobile menu not responsive',
      steps_to_reproduce: '1. Open site on mobile\n2. Click hamburger menu\n3. Try to navigate',
      error_message: 'Menu items overlap',
      status: 'Open',
      priority: 'Low',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  
  const [newBug, setNewBug] = useState({
    area: 'UI/UX' as const,
    title: '',
    steps_to_reproduce: '',
    error_message: '',
    priority: 'Medium' as const
  });
  const [isAddingBug, setIsAddingBug] = useState(false);

  const addBug = async () => {
    if (!newBug.title.trim()) {
      toast.error('Bug title is required');
      return;
    }

    try {
      setIsAddingBug(true);
      const issueId = `BUG-${String(bugs.length + 1).padStart(3, '0')}`;
      
      // Create new bug object
      const newBugEntry: StagingBug = {
        id: String(bugs.length + 1),
        issue_id: issueId,
        area: newBug.area,
        title: newBug.title,
        steps_to_reproduce: newBug.steps_to_reproduce || null,
        error_message: newBug.error_message || null,
        priority: newBug.priority,
        status: 'Open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to state (in real app, this would be database)
      setBugs(prev => [newBugEntry, ...prev]);

      toast.success('Bug added successfully (Demo Mode)');
      setNewBug({
        area: 'UI/UX',
        title: '',
        steps_to_reproduce: '',
        error_message: '',
        priority: 'Medium'
      });
    } catch (error) {
      console.error('Error adding bug:', error);
      toast.error('Failed to add bug');
    } finally {
      setIsAddingBug(false);
    }
  };

  const updateBugStatus = async (bugId: string, newStatus: StagingBug['status']) => {
    try {
      // Update in state (in real app, this would be database)
      setBugs(prev => prev.map(bug => 
        bug.id === bugId 
          ? { ...bug, status: newStatus, updated_at: new Date().toISOString() }
          : bug
      ));
      
      toast.success(`Bug status updated to ${newStatus} (Demo Mode)`);
    } catch (error) {
      console.error('Error updating bug status:', error);
      toast.error('Failed to update bug status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-destructive text-destructive-foreground';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'Low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'Fixed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Retest': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAreaIcon = (area: string) => {
    switch (area) {
      case 'Payment': return '💳';
      case 'Customer Flow': return '👤';
      case 'Vendor Flow': return '🏪';
      case 'Admin': return '⚙️';
      case 'UI/UX': return '🎨';
      default: return '🐛';
    }
  };

  const refreshBugs = () => {
    toast.info('Refreshing bug data... (Demo Mode)');
    // In real app, this would fetch from database
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-6 w-6 text-destructive" />
          <h2 className="text-2xl font-bold text-foreground">Bug Dashboard</h2>
          <Badge variant="secondary" className="ml-2">
            {bugs.filter(bug => bug.status === 'Open').length} Open
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshBugs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Bug
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Report New Bug</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="area">Area</Label>
                  <Select value={newBug.area} onValueChange={(value: any) => setNewBug({...newBug, area: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer Flow">Customer Flow</SelectItem>
                      <SelectItem value="Vendor Flow">Vendor Flow</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Payment">Payment</SelectItem>
                      <SelectItem value="UI/UX">UI/UX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newBug.title}
                    onChange={(e) => setNewBug({...newBug, title: e.target.value})}
                    placeholder="Brief description of the bug"
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newBug.priority} onValueChange={(value: any) => setNewBug({...newBug, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="steps">Steps to Reproduce</Label>
                  <Textarea
                    id="steps"
                    value={newBug.steps_to_reproduce}
                    onChange={(e) => setNewBug({...newBug, steps_to_reproduce: e.target.value})}
                    placeholder="1. Go to page&#10;2. Click button&#10;3. Observe error"
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="error">Error Message</Label>
                  <Input
                    id="error"
                    value={newBug.error_message}
                    onChange={(e) => setNewBug({...newBug, error_message: e.target.value})}
                    placeholder="Console error or user-facing error message"
                  />
                </div>

                <Button onClick={addBug} disabled={isAddingBug} className="w-full">
                  {isAddingBug ? 'Adding...' : 'Add Bug Report'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bugs', count: bugs.length, color: 'bg-muted' },
          { label: 'Open', count: bugs.filter(b => b.status === 'Open').length, color: 'bg-red-500' },
          { label: 'Fixed', count: bugs.filter(b => b.status === 'Fixed').length, color: 'bg-green-500' },
          { label: 'Critical', count: bugs.filter(b => b.priority === 'Critical').length, color: 'bg-destructive' }
        ].map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-4">
              <div className={`w-12 h-12 mx-auto rounded-full ${stat.color} flex items-center justify-center text-white font-bold mb-2`}>
                {stat.count}
              </div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bug Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bug Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bugs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Bug className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No bugs reported yet</p>
                        <p className="text-sm text-muted-foreground">Great job on the quality! 🎉</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bugs.map((bug) => (
                    <TableRow key={bug.id}>
                      <TableCell className="font-medium">{bug.issue_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getAreaIcon(bug.area)}</span>
                          <span className="text-sm">{bug.area}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <p className="font-medium truncate">{bug.title}</p>
                          {bug.error_message && (
                            <p className="text-xs text-destructive truncate">{bug.error_message}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(bug.priority)}>
                          {bug.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(bug.status)}>
                          {bug.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(bug.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={bug.status}
                          onValueChange={(value: StagingBug['status']) => updateBugStatus(bug.id, value)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Fixed">Fixed</SelectItem>
                            <SelectItem value="Retest">Retest</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};