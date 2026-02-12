import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";

/**
 * Listens to realtime call_logs inserts for ringing incoming calls
 * and shows a toast notification with option to navigate to the contact.
 */
export const IncomingCallToast = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const channel = supabase
      .channel('incoming-call-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_logs',
          filter: 'direction=eq.incoming',
        },
        (payload) => {
          const call = payload.new as any;
          if (call.status !== 'ringing') return;

          const caller = call.phone_number || 'Unknown number';

          toast(`📞 Incoming call from ${caller}`, {
            description: 'Click to view contact',
            duration: 10000,
            action: call.opportunity_id
              ? {
                  label: 'View',
                  onClick: () => navigate(`/opportunities/${call.opportunity_id}`),
                }
              : call.contact_id
              ? {
                  label: 'View',
                  onClick: () => navigate('/contacts'),
                }
              : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  return null;
};
