
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FavoritesList } from './FavoritesList';
import { BudgetTracker } from './BudgetTracker';
import { TimelineChecklist } from './TimelineChecklist';
import { Heart, DollarSign, Calendar } from 'lucide-react';

export const PlanningTools: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent mb-4">
          Your Event Planning Hub
        </h1>
        <p className="text-gray-600 text-lg">Stay organized and on budget with our planning tools</p>
      </div>

      <Tabs defaultValue="favorites" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites">
          <FavoritesList />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTracker />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineChecklist />
        </TabsContent>
      </Tabs>
    </div>
  );
};
