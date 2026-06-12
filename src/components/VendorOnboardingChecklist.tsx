// src/components/VendorOnboardingChecklist.tsx (updated component)

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  Circle,
  Edit,
  Package,
  CreditCard,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { useVendor } from '@/features/vendor/hooks';
import { useServicesWithMedia } from '@/features/services/hooks';
import { useStripeStatus } from '@/features/stripe/hooks';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  completed: boolean;
}

interface VendorOnboardingChecklistProps {
  onTabChange?: (tab: string) => void;
}

const STEP_DEFINITIONS = [
  {
    id: 'profile',
    title: 'Complete Profile Details',
    description: 'Add your business name, description, and contact info',
    icon: Edit,
    route: 'profile',
  },
  {
    id: 'services',
    title: 'Add At Least One Service',
    description: 'Create your first service offering for customers',
    icon: Package,
    route: 'services',
  },
  {
    id: 'payments',
    title: 'Set Up Payment Settings',
    description: 'Connect your bank account to receive payments',
    icon: CreditCard,
    route: 'payouts',
  },
] as const;

export const VendorOnboardingChecklist: React.FC<VendorOnboardingChecklistProps> = ({
  onTabChange
}) => {
  const { user } = useConsolidatedAuth();
  const { data: vendor, isLoading: vendorLoading } = useVendor(user?.id);
  const { data: services, isLoading: servicesLoading } = useServicesWithMedia(vendor?.id);
  const { data: stripeAccount, isLoading: stripeLoading } = useStripeStatus(vendor?.id);

  const isLoading = vendorLoading || servicesLoading || stripeLoading;

  const steps = useMemo((): OnboardingStep[] => {
    const payoutsLive = !!stripeAccount?.payoutsEnabled;

    return STEP_DEFINITIONS.map((step) => {
      let completed = false;
      switch (step.id) {
        case 'profile':
          completed = !!(
            vendor &&
            vendor.businessName &&
            vendor.description &&
            vendor.city &&
            vendor.state &&
            vendor.contactEmail
          );
          break;
        case 'services':
          completed = !!(services && services.length > 0);
          break;
        case 'payments':
          completed = payoutsLive;
          break;
      }
      return { ...step, completed };
    });
  }, [vendor, services, stripeAccount]);

  const completedSteps = steps.filter((step) => step.completed).length;
  const isComplete = !isLoading && completedSteps === steps.length;
  const progressPercentage = Math.round((completedSteps / steps.length) * 100);

  const handleStepClick = (step: OnboardingStep) => {
    if (onTabChange && !step.completed) {
      onTabChange(step.route);
    }
  };

  if (isComplete) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="shadow-party border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-accent" />
              Getting Started
            </CardTitle>
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Skeleton className="w-full h-2 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30 border-border"
            >
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="w-4 h-4" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="w-4 h-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-party border-primary/20 relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-accent" />
            Getting Started
          </CardTitle>
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">
              {progressPercentage}% Complete
            </div>
            <div className="text-xs text-muted-foreground">
              {completedSteps} of {steps.length} steps
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progressPercentage} className="w-full h-2" />
          <p className="text-sm text-muted-foreground">
            You're <span className="font-semibold text-primary">{progressPercentage}%</span> ready to start booking!
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step) => {
          const IconComponent = step.icon;
          return (
            <div
              key={step.id}
              onClick={() => handleStepClick(step)}
              className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200 ${step.completed
                ? 'bg-primary/5 border-primary/20 cursor-default'
                : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/30 cursor-pointer group'
                }`}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <IconComponent className={`w-4 h-4 ${step.completed ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  } transition-colors`} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm ${step.completed ? 'text-primary' : 'text-foreground group-hover:text-primary'
                  } transition-colors`}>
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {!step.completed && (
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
