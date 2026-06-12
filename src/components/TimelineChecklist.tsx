
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, AlertCircle, Plus, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimelineTask {
  id: string;
  title: string;
  description: string;
  category: string;
  timeline: string; // e.g., "12 months before", "6 weeks before"
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  due_date?: string;
  estimated_cost?: string;
  vendor_suggestions?: string[];
}

export const TimelineChecklist: React.FC = () => {
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [eventDate, setEventDate] = useState<string>('2024-06-15');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const { toast } = useToast();

  // Initialize mock timeline data
  useEffect(() => {
    const mockTasks: TimelineTask[] = [
      {
        id: '1',
        title: 'Set Overall Budget',
        description: 'Determine how much you want to spend on your event',
        category: 'Planning',
        timeline: '12 months before',
        priority: 'high',
        completed: true,
        estimated_cost: 'Free'
      },
      {
        id: '2',
        title: 'Book Venue',
        description: 'Secure your ideal location for the event',
        category: 'Venue',
        timeline: '10-12 months before',
        priority: 'high',
        completed: true,
        estimated_cost: '$2,000 - $5,000',
        vendor_suggestions: ['Grand Ballroom', 'Garden Pavilion', 'Historic Manor']
      },
      {
        id: '3',
        title: 'Hire Photographer',
        description: 'Book a professional photographer to capture your special moments',
        category: 'Photography',
        timeline: '8-10 months before',
        priority: 'high',
        completed: false,
        estimated_cost: '$1,500 - $3,500',
        vendor_suggestions: ['Elegant Events Photography', 'Moments Studio', 'Classic Captures']
      },
      {
        id: '4',
        title: 'Choose Catering Service',
        description: 'Select menu and catering service for your event',
        category: 'Catering',
        timeline: '6-8 months before',
        priority: 'high',
        completed: false,
        estimated_cost: '$50 - $120 per person',
        vendor_suggestions: ['Sweet Dreams Catering', 'Gourmet Events', 'Taste of Excellence']
      },
      {
        id: '5',
        title: 'Order Flowers',
        description: 'Choose floral arrangements and decorations',
        category: 'Flowers',
        timeline: '4-6 months before',
        priority: 'medium',
        completed: false,
        estimated_cost: '$300 - $1,000',
        vendor_suggestions: ['Blooming Petals Florist', 'Garden Dreams', 'Petal Perfect']
      },
      {
        id: '6',
        title: 'Book Music/DJ',
        description: 'Arrange entertainment for your event',
        category: 'Entertainment',
        timeline: '4-6 months before',
        priority: 'medium',
        completed: false,
        estimated_cost: '$800 - $2,000',
        vendor_suggestions: ['Party Beats DJ', 'Elegant Music Co', 'Sound Waves Entertainment']
      },
      {
        id: '7',
        title: 'Send Invitations',
        description: 'Design and send out invitations to guests',
        category: 'Planning',
        timeline: '6-8 weeks before',
        priority: 'medium',
        completed: false,
        estimated_cost: '$100 - $300'
      },
      {
        id: '8',
        title: 'Final Menu Tasting',
        description: 'Confirm final menu choices with catering service',
        category: 'Catering',
        timeline: '2-3 weeks before',
        priority: 'high',
        completed: false,
        estimated_cost: 'Free'
      },
      {
        id: '9',
        title: 'Confirm All Vendors',
        description: 'Final confirmation of all vendor details and timing',
        category: 'Planning',
        timeline: '1 week before',
        priority: 'high',
        completed: false,
        estimated_cost: 'Free'
      }
    ];

    setTasks(mockTasks);
  }, []);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      toast({
        title: task.completed ? 'Task unmarked' : 'Task completed!',
        description: `"${task.title}" has been ${task.completed ? 'unmarked' : 'marked as complete'}.`
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = (completedCount / totalTasks) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Planning': 'bg-blue-500',
      'Venue': 'bg-purple-500',
      'Photography': 'bg-pink-500',
      'Catering': 'bg-green-500',
      'Flowers': 'bg-rose-500',
      'Entertainment': 'bg-orange-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Event Planning Timeline
            </div>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Set Reminders
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Event Date</p>
              <p className="text-xl font-bold text-blue-600">
                {new Date(eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tasks Completed</p>
              <p className="text-xl font-bold text-green-600">{completedCount} / {totalTasks}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-xl font-bold text-purple-600">{progressPercentage.toFixed(0)}%</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progressPercentage.toFixed(1)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'completed'] as const).map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(filterType)}
            className={filter === filterType ? 'bg-primary' : ''}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            {filterType === 'pending' && (
              <Badge variant="secondary" className="ml-2">
                {tasks.filter(t => !t.completed).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card 
            key={task.id} 
            className={`bg-white/80 backdrop-blur-sm transition-all duration-200 ${
              task.completed ? 'opacity-75' : 'hover:shadow-md'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {task.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(task.category)}`} />
                      <span className="text-sm text-gray-600">{task.category}</span>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {task.timeline}
                    </Badge>
                    
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority} priority
                    </Badge>

                    {task.estimated_cost && (
                      <Badge variant="secondary" className="text-xs">
                        {task.estimated_cost}
                      </Badge>
                    )}
                  </div>

                  {task.vendor_suggestions && task.vendor_suggestions.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Suggested Vendors:</p>
                      <div className="flex flex-wrap gap-2">
                        {task.vendor_suggestions.map((vendor, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                          >
                            {vendor}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'completed' ? 'No completed tasks yet' : 'All tasks completed!'}
            </h3>
            <p className="text-gray-500">
              {filter === 'completed' 
                ? 'Complete some tasks to see them here.' 
                : 'Great job staying organized! Your event planning is on track.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
