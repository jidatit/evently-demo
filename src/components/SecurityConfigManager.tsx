
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Clock, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_SECURITY_CONFIG, type SecurityConfig } from '@/lib/enhanced-security';

export const SecurityConfigManager: React.FC = () => {
  const [config, setConfig] = useState<SecurityConfig>(DEFAULT_SECURITY_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const loadConfig = () => {
    try {
      const savedConfig = localStorage.getItem('security_config');
      if (savedConfig) {
        setConfig({ ...DEFAULT_SECURITY_CONFIG, ...JSON.parse(savedConfig) });
      }
    } catch (error) {
      console.error('Failed to load security config:', error);
      toast({
        title: 'Config Load Error',
        description: 'Failed to load security configuration. Using defaults.',
        variant: 'destructive',
      });
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('security_config', JSON.stringify(config));
      setHasChanges(false);
      toast({
        title: 'Configuration Saved',
        description: 'Security configuration has been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to save security config:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save security configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_SECURITY_CONFIG);
    setHasChanges(true);
  };

  const updateConfig = (key: keyof SecurityConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const getSecurityScore = (): { score: number; level: 'low' | 'medium' | 'high' } => {
    let score = 0;
    
    // Password strength requirements
    if (config.passwordMinLength >= 8) score += 20;
    if (config.passwordMinLength >= 12) score += 10;
    
    // Authentication security
    if (config.maxLoginAttempts <= 5) score += 15;
    if (config.lockoutDurationMs >= 15 * 60 * 1000) score += 15; // 15 minutes
    
    // Session security
    if (config.sessionTimeoutMs <= 8 * 60 * 60 * 1000) score += 20; // 8 hours
    if (config.sessionWarningMs >= 5 * 60 * 1000) score += 10; // 5 minutes
    
    // Rate limiting
    if (config.maxRequestsPerMinute <= 60) score += 10;
    
    // Additional security features
    if (config.requireEmailVerification) score += 10;
    
    const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
    return { score, level };
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      {/* Security Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">{securityScore.score}/100</div>
              <Badge variant={
                securityScore.level === 'high' ? 'default' :
                securityScore.level === 'medium' ? 'secondary' :
                'destructive'
              } className="flex items-center gap-1">
                {securityScore.level === 'high' ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {securityScore.level.toUpperCase()} SECURITY
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                disabled={isLoading}
              >
                Reset to Defaults
              </Button>
              <Button
                onClick={saveConfig}
                disabled={!hasChanges || isLoading}
                className="flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {hasChanges && (
            <Alert className="mb-4 border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-700">
                You have unsaved changes. Click "Save Changes" to apply them.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Authentication Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Authentication Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min="3"
                max="10"
                value={config.maxLoginAttempts}
                onChange={(e) => updateConfig('maxLoginAttempts', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500">
                Number of failed attempts before account lockout
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                min="5"
                max="120"
                value={config.lockoutDurationMs / (60 * 1000)}
                onChange={(e) => updateConfig('lockoutDurationMs', parseInt(e.target.value) * 60 * 1000)}
              />
              <p className="text-sm text-gray-500">
                How long accounts remain locked after max attempts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                min="6"
                max="32"
                value={config.passwordMinLength}
                onChange={(e) => updateConfig('passwordMinLength', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500">
                Minimum required password length
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="requireEmailVerification">Email Verification</Label>
                <p className="text-sm text-gray-500">
                  Require email verification for new accounts
                </p>
              </div>
              <Switch
                id="requireEmailVerification"
                checked={config.requireEmailVerification}
                onCheckedChange={(checked) => updateConfig('requireEmailVerification', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={config.sessionTimeoutMs / (60 * 60 * 1000)}
                onChange={(e) => updateConfig('sessionTimeoutMs', parseFloat(e.target.value) * 60 * 60 * 1000)}
              />
              <p className="text-sm text-gray-500">
                Maximum session duration before forced logout
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionWarning">Timeout Warning (minutes)</Label>
              <Input
                id="sessionWarning"
                type="number"
                min="1"
                max="60"
                value={config.sessionWarningMs / (60 * 1000)}
                onChange={(e) => updateConfig('sessionWarningMs', parseInt(e.target.value) * 60 * 1000)}
              />
              <p className="text-sm text-gray-500">
                Show warning before session expires
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting & Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Rate Limiting & Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxRequestsPerMinute">Max Requests Per Minute</Label>
              <Input
                id="maxRequestsPerMinute"
                type="number"
                min="10"
                max="300"
                value={config.maxRequestsPerMinute}
                onChange={(e) => updateConfig('maxRequestsPerMinute', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500">
                Maximum API requests per user per minute
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suspiciousThreshold">Suspicious Activity Threshold</Label>
              <Input
                id="suspiciousThreshold"
                type="number"
                min="5"
                max="50"
                value={config.suspiciousActivityThreshold}
                onChange={(e) => updateConfig('suspiciousActivityThreshold', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500">
                Requests per minute that trigger suspicious activity alert
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {config.passwordMinLength < 8 && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-700">
                  Consider increasing minimum password length to 8+ characters for better security.
                </AlertDescription>
              </Alert>
            )}
            
            {config.sessionTimeoutMs > 12 * 60 * 60 * 1000 && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-700">
                  Long session timeouts may increase security risk. Consider reducing to 8 hours or less.
                </AlertDescription>
              </Alert>
            )}
            
            {config.maxLoginAttempts > 5 && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-700">
                  High login attempt limits may allow brute force attacks. Consider reducing to 5 or fewer.
                </AlertDescription>
              </Alert>
            )}
            
            {securityScore.level === 'high' && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-700">
                  Your security configuration follows best practices and provides strong protection.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
