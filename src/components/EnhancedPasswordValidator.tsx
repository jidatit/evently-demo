
import React, { useState, useEffect } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PasswordStrengthProps {
  password: string;
  onValidationChange: (isValid: boolean, score: number) => void;
}

interface ValidationRule {
  label: string;
  test: (password: string) => boolean;
  weight: number;
}

export const EnhancedPasswordValidator: React.FC<PasswordStrengthProps> = ({ 
  password, 
  onValidationChange 
}) => {
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [strengthScore, setStrengthScore] = useState(0);

  const validationRules: ValidationRule[] = [
    {
      label: 'At least 12 characters long',
      test: (pwd) => pwd.length >= 12,
      weight: 20
    },
    {
      label: 'Contains uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd),
      weight: 15
    },
    {
      label: 'Contains lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd),
      weight: 15
    },
    {
      label: 'Contains numbers',
      test: (pwd) => /\d/.test(pwd),
      weight: 15
    },
    {
      label: 'Contains special characters',
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      weight: 15
    },
    {
      label: 'No common patterns (123, abc, etc.)',
      test: (pwd) => !/(123|abc|password|qwerty)/i.test(pwd),
      weight: 10
    },
    {
      label: 'No repeated characters (aaa, 111)',
      test: (pwd) => !/(.)\1{2,}/.test(pwd),
      weight: 10
    }
  ];

  useEffect(() => {
    if (!password) {
      setValidationResults({});
      setStrengthScore(0);
      onValidationChange(false, 0);
      return;
    }

    const results: Record<string, boolean> = {};
    let totalScore = 0;
    let maxScore = 0;

    validationRules.forEach((rule) => {
      const passed = rule.test(password);
      results[rule.label] = passed;
      maxScore += rule.weight;
      if (passed) {
        totalScore += rule.weight;
      }
    });

    const normalizedScore = Math.round((totalScore / maxScore) * 100);
    
    setValidationResults(results);
    setStrengthScore(normalizedScore);
    
    // Password is considered valid if it passes all critical rules
    const isValid = validationRules.slice(0, 5).every(rule => rule.test(password));
    onValidationChange(isValid, normalizedScore);
  }, [password, onValidationChange]);

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStrengthLabel = (score: number) => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Weak';
  };

  if (!password) return null;

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium">Password Strength:</span>
          <span className={`text-sm font-bold ${getStrengthColor(strengthScore)}`}>
            {getStrengthLabel(strengthScore)} ({strengthScore}%)
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              strengthScore >= 80 ? 'bg-green-600' :
              strengthScore >= 60 ? 'bg-yellow-600' :
              strengthScore >= 40 ? 'bg-orange-600' : 'bg-red-600'
            }`}
            style={{ width: `${strengthScore}%` }}
          />
        </div>

        <div className="space-y-2">
          {validationRules.map((rule) => (
            <div key={rule.label} className="flex items-center gap-2 text-sm">
              {validationResults[rule.label] ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-600" />
              )}
              <span className={validationResults[rule.label] ? 'text-green-700' : 'text-gray-600'}>
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
