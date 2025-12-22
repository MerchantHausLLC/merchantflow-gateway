import { useState, useEffect } from 'react';
import { Bell, GitCommitVertical, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
  notification_category?: 'stage_change' | 'task_assignment' | 'general';
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const stageChangeCount = notifications.filter(n => !n.read && (n.notification_category === 'stage_change' || n.title?.toLowerCase().includes('stage'))).length;
  const taskAssignmentCount = notifications.filter(n => !n.read && (n.notification_category === 'task_assignment' || n.title?.toLowerCase().includes('task') || n.title?.toLowerCase().includes('assigned'))).length;

  const getNotificationIcon = (notification: Notification) => {
    const category = notification.notification_category;
    const titleLower = notification.title?.toLowerCase() || '';

    if (category === 'stage_change' || titleLower.includes('stage')) {
      return <GitCommitVertical className="h-4 w-4 text-blue-500" />;
    }
    if (category === 'task_assignment' || titleLower.includes('task') || titleLower.includes('assigned')) {
      return <UserPlus className="h-4 w-4 text-purple-500" />;
    }
    return null;
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setNotifications(data);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn(
            "h-5 w-5 transition-colors",
            unreadCount > 0 && "text-primary"
          )} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center animate-pulse",
              stageChangeCount > 0 || taskAssignmentCount > 0
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                : "bg-destructive text-destructive-foreground"
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {/* Secondary indicator for stage changes and task assignments */}
          {(stageChangeCount > 0 || taskAssignmentCount > 0) && (
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <div>
            <h4 className="font-semibold">Notifications</h4>
            {(stageChangeCount > 0 || taskAssignmentCount > 0) && (
              <div className="flex items-center gap-2 mt-1 text-xs">
                {stageChangeCount > 0 && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <GitCommitVertical className="h-3 w-3" />
                    {stageChangeCount} stage {stageChangeCount === 1 ? 'change' : 'changes'}
                  </span>
                )}
                {taskAssignmentCount > 0 && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <UserPlus className="h-3 w-3" />
                    {taskAssignmentCount} {taskAssignmentCount === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </div>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => {
              const notificationIcon = getNotificationIcon(notification);
              return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors',
                  !notification.read && 'bg-primary/5'
                )}
              >
                <div className="flex items-start gap-2">
                  {notificationIcon ? (
                    <div className="flex-shrink-0 mt-0.5">
                      {notificationIcon}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                        notification.type === 'success' && 'bg-emerald-500',
                        notification.type === 'error' && 'bg-destructive',
                        notification.type === 'warning' && 'bg-amber-500',
                        notification.type === 'info' && 'bg-primary'
                      )}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            )})
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
