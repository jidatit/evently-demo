
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Lock, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SecurityLogger, AccountSecurity } from '@/lib/enhanced-security';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  details?: any;
  created_at: string;
  severity: string;
  risk_level: string;
  resolved: boolean;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  activeLockouts: number;
  recentFailedLogins: number;
  suspiciousActivity: number;
  sessionTimeouts: number;
}

export const SecurityMonitoringDashboard: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    activeLockouts: 0,
    recentFailedLogins: 0,
    suspiciousActivity: 0,
    sessionTimeouts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const fetchSecurityEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('Error fetching security events:', eventsError);
        return;
      }

      setEvents(eventsData || []);

      // Calculate metrics
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentEvents = eventsData?.filter(event => 
        new Date(event.created_at) > last24Hours
      ) || [];

      const newMetrics = {
        totalEvents: eventsData?.length || 0,
        criticalEvents: recentEvents.filter(e => e.severity === 'high' || e.risk_level === 'high').length,
        activeLockouts: AccountSecurity.getSecurityMetrics().activeLockouts,
        recentFailedLogins: recentEvents.filter(e => e.event_type === 'LOGIN_FAILED').length,
        suspiciousActivity: recentEvents.filter(e => e.event_type === 'SUSPICIOUS_ACTIVITY_DETECTED').length,
        sessionTimeouts: recentEvents.filter(e => e.event_type === 'SESSION_TIMEOUT').length,
      };

      setMetrics(newMetrics);

      // Check for critical security alerts
      if (newMetrics.criticalEvents > 10) {
        toast({
          title: 'Security Alert',
          description: `${newMetrics.criticalEvents} critical security events detected in the last 24 hours`,
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('security_events')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', eventId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to resolve security event',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Security event marked as resolved',
      });

      fetchSecurityEvents();
    } catch (error) {
      console.error('Error resolving event:', error);
    }
  };

  const clearSecurityLogs = () => {
    SecurityLogger.clearSecurityLogs();
    toast({
      title: 'Security Logs Cleared',
      description: 'All local security logs have been cleared',
    });
  };

  const getHealthStatus = (): { status: 'healthy' | 'warning' | 'critical'; message: string } => {
    if (metrics.criticalEvents > 10 || metrics.activeLockouts > 5) {
      return { status: 'critical', message: 'Critical security issues detected' };
    }
    if (metrics.recentFailedLogins > 20 || metrics.suspiciousActivity > 5) {
      return { status: 'warning', message: 'Elevated security risk detected' };
    }
    return { status: 'healthy', message: 'Security status normal' };
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(fetchSecurityEvents, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Security Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Alert className={`border-l-4 ${
              healthStatus.status === 'critical' ? 'border-red-500 bg-red-50' :
              healthStatus.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
              'border-green-500 bg-green-50'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{healthStatus.status.toUpperCase()}:</strong> {healthStatus.message}
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh: {autoRefresh ? 'On' : 'Off'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSecurityEvents}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Security Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</div>
              <div className="text-sm text-gray-600">Critical (24h)</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{metrics.activeLockouts}</div>
              <div className="text-sm text-gray-600">Active Lockouts</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{metrics.recentFailedLogins}</div>
              <div className="text-sm text-gray-600">Failed Logins (24h)</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{metrics.suspiciousActivity}</div>
              <div className="text-sm text-gray-600">Suspicious Activity</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{metrics.sessionTimeouts}</div>
              <div className="text-sm text-gray-600">Session Timeouts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No security events recorded
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 border rounded-lg ${
                    event.resolved ? 'bg-gray-50 border-gray-200' : 
                    event.severity === 'high' ? 'bg-red-50 border-red-200' :
                    event.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        event.severity === 'high' ? 'destructive' :
                        event.severity === 'medium' ? 'secondary' :
                        'default'
                      }>
                        {event.event_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {event.severity}
                      </Badge>
                      {event.resolved && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  {event.details && (
                    <div className="text-sm text-gray-600 mb-2">
                      {JSON.stringify(event.details, null, 2)}
                    </div>
                  )}
                  
                  {!event.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveEvent(event.id)}
                      className="mt-2"
                    >
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={clearSecurityLogs}
              className="text-red-600 hover:text-red-700"
            >
              Clear Local Logs
            </Button>
            <div className="text-sm text-gray-500">
              Showing last 50 events • Auto-refresh: {autoRefresh ? 'Every 30s' : 'Off'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
