
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Users, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  details?: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export const SecurityDashboard: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    suspiciousActivities: 0,
    failedLogins: 0,
    securityThreats: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityEvents();
    fetchSecurityStats();
  }, []);

  const fetchSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load security events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityStats = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('event_type')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const eventCounts = (data || []).reduce((acc: any, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalEvents: data?.length || 0,
        suspiciousActivities: eventCounts['SUSPICIOUS_ACTIVITY'] || 0,
        failedLogins: eventCounts['FAILED_LOGIN'] || 0,
        securityThreats: eventCounts['SECURITY_THREATS_DETECTED'] || 0
      });
    } catch (error) {
      console.error('Failed to fetch security stats:', error);
    }
  };

  const getEventBadgeVariant = (eventType: string) => {
    if (eventType.includes('FAILED') || eventType.includes('THREAT') || eventType.includes('SUSPICIOUS')) {
      return 'destructive';
    }
    if (eventType.includes('SUCCESS') || eventType.includes('LOGIN')) {
      return 'default';
    }
    return 'secondary';
  };

  const formatEventDetails = (details: any) => {
    if (!details) return 'No additional details';
    
    const filtered = Object.entries(details)
      .filter(([key]) => !['timestamp', 'user_agent'].includes(key))
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
    
    return filtered || 'No relevant details';
  };

  if (loading) {
    return <div className="p-4">Loading security dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedLogins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.suspiciousActivities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.securityThreats}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-muted-foreground">No security events recorded.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getEventBadgeVariant(event.event_type)}>
                        {event.event_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{formatEventDetails(event.details)}</p>
                    {event.ip_address && (
                      <p className="text-xs text-muted-foreground">
                        IP: {event.ip_address}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
