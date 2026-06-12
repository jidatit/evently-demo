
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, Edit, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
}

interface BudgetExpense {
  id: string;
  category_id: string;
  vendor_name: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'estimate';
}

export const BudgetTracker: React.FC = () => {
  const [totalBudget, setTotalBudget] = useState(15000);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', budget: '' });
  const { toast } = useToast();

  // Initialize mock data
  useEffect(() => {
    const mockCategories: BudgetCategory[] = [
      { id: '1', name: 'Photography', budgeted: 3000, spent: 2500, color: 'bg-blue-500' },
      { id: '2', name: 'Catering', budgeted: 5000, spent: 0, color: 'bg-green-500' },
      { id: '3', name: 'Flowers', budgeted: 1500, spent: 800, color: 'bg-pink-500' },
      { id: '4', name: 'Music/DJ', budgeted: 2000, spent: 0, color: 'bg-purple-500' },
      { id: '5', name: 'Venue', budgeted: 3000, spent: 3000, color: 'bg-orange-500' },
    ];

    const mockExpenses: BudgetExpense[] = [
      { id: '1', category_id: '1', vendor_name: 'Elegant Events Photography', amount: 2500, date: '2024-01-15', status: 'paid' },
      { id: '2', category_id: '3', vendor_name: 'Blooming Petals Florist', amount: 800, date: '2024-01-10', status: 'estimate' },
      { id: '3', category_id: '5', vendor_name: 'Grand Ballroom', amount: 3000, date: '2024-01-05', status: 'paid' },
    ];

    setCategories(mockCategories);
    setExpenses(mockExpenses);
  }, []);

  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetProgress = (totalSpent / totalBudget) * 100;

  const addCategory = () => {
    if (!newCategory.name || !newCategory.budget) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    const category: BudgetCategory = {
      id: Date.now().toString(),
      name: newCategory.name,
      budgeted: parseFloat(newCategory.budget),
      spent: 0,
      color: `bg-${['blue', 'green', 'pink', 'purple', 'orange', 'indigo'][Math.floor(Math.random() * 6)]}-500`
    };

    setCategories(prev => [...prev, category]);
    setNewCategory({ name: '', budget: '' });
    setIsAddingCategory(false);
    
    toast({
      title: 'Category added',
      description: 'New budget category has been created'
    });
  };

  const getCategoryProgress = (category: BudgetCategory) => {
    return category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0;
  };

  const getCategoryStatus = (category: BudgetCategory) => {
    const progress = getCategoryProgress(category);
    if (progress > 100) return { label: 'Over Budget', variant: 'destructive' as const };
    if (progress > 80) return { label: 'Almost Full', variant: 'secondary' as const };
    if (progress > 0) return { label: 'In Progress', variant: 'default' as const };
    return { label: 'Not Started', variant: 'outline' as const };
  };

  return (
    <div className="space-y-6">
      {/* Overall Budget Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Budget Overview
            </div>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Total Budget
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-800">${totalBudget.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-blue-600">${totalSpent.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Remaining</p>
              <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${remainingBudget.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-purple-600">{budgetProgress.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget Progress</span>
              <span>{budgetProgress.toFixed(1)}% used</span>
            </div>
            <Progress value={budgetProgress} className="h-3" />
            {budgetProgress > 90 && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                You're approaching your budget limit!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget Categories</CardTitle>
          <Button 
            onClick={() => setIsAddingCategory(true)}
            className="bg-gradient-to-r from-primary to-pink-600"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Category Form */}
          {isAddingCategory && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Category name (e.g., Decorations)"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Budget amount"
                    type="number"
                    value={newCategory.budget}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, budget: e.target.value }))}
                  />
                  <Button onClick={addCategory} size="sm">Add</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddingCategory(false)} 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories List */}
          <div className="grid gap-4">
            {categories.map((category) => {
              const progress = getCategoryProgress(category);
              const status = getCategoryStatus(category);
              
              return (
                <Card key={category.id} className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${category.color}`} />
                        <h3 className="font-semibold">{category.name}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          ${category.spent.toLocaleString()} / ${category.budgeted.toLocaleString()}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{progress.toFixed(1)}% used</span>
                        <span>${(category.budgeted - category.spent).toLocaleString()} remaining</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expenses recorded yet</p>
            ) : (
              expenses.map((expense) => {
                const category = categories.find(cat => cat.id === expense.category_id);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${category?.color || 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium">{expense.vendor_name}</p>
                        <p className="text-sm text-gray-600">{category?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${expense.amount.toLocaleString()}</p>
                      <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'}>
                        {expense.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
