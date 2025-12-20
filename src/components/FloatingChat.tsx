import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Users, Hash, Reply, ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  content: string;
  created_at: string;
  reply_to_id: string | null;
};

type Channel = {
  id: string;
  name: string;
  created_at: string;
};

type Profile = {
  id: string;
  avatar_url: string | null;
  full_name: string | null;
  email: string | null;
};

type OnlineUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isOnline: boolean;
};

type TypingUser = {
  id: string;
  name: string;
};

type ChatView = "contacts" | "channels" | "chat" | "dm";

const FloatingChat: React.FC = () => {
  const { user, teamMemberName } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ChatView>("contacts");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState<string>("");
  const [currentDMUserId, setCurrentDMUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const globalPresenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const userName = teamMemberName || user?.email?.split("@")[0] || "";

  // Fetch all registered users for contacts
  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, avatar_url, full_name, email");

    if (error) {
      console.error("Failed to load profiles:", error);
      return;
    }

    const profileMap: Record<string, Profile> = {};
    (data || []).forEach(p => {
      profileMap[p.id] = p;
    });
    setProfiles(profileMap);

    // Initialize online users with all profiles (offline by default)
    const users: OnlineUser[] = (data || [])
      .filter(p => p.id !== user?.id)
      .map(p => ({
        id: p.id,
        name: p.full_name || p.email?.split("@")[0] || "User",
        email: p.email || "",
        avatarUrl: p.avatar_url,
        isOnline: false
      }));
    setOnlineUsers(users);
  }, [user?.id]);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    const { data, error } = await supabase
      .from("chat_channels")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load channels:", error);
      return;
    }

    setChannels(data || []);
  }, []);

  // Fetch messages for current channel
  const fetchMessages = useCallback(async () => {
    if (!currentChannelId) return;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("channel_id", currentChannelId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load messages:", error);
      return;
    }

    setMessages(data || []);
  }, [currentChannelId]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchChannels();
    }
  }, [user, fetchProfiles, fetchChannels]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (currentChannelId) {
      fetchMessages();
    }
  }, [currentChannelId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Global presence tracking for online/offline status
  useEffect(() => {
    if (!user) return;

    const globalChannel = supabase.channel("global-presence", {
      config: { presence: { key: user.id } }
    });

    globalChannel
      .on("presence", { event: "sync" }, () => {
        const state = globalChannel.presenceState();
        const onlineIds = new Set(Object.keys(state));

        setOnlineUsers(prev =>
          prev.map(u => ({
            ...u,
            isOnline: onlineIds.has(u.id)
          }))
        );
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await globalChannel.track({
            name: userName,
            email: user.email,
            online_at: new Date().toISOString()
          });
        }
      });

    globalPresenceRef.current = globalChannel;

    return () => {
      supabase.removeChannel(globalChannel);
      globalPresenceRef.current = null;
    };
  }, [user, userName]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!currentChannelId) return;

    const channel = supabase
      .channel(`chat-messages-${currentChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${currentChannelId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // Increment unread if chat is closed and message is from someone else
          if (!isOpen && newMsg.user_id !== user?.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChannelId, isOpen, user?.id]);

  // Typing presence for current channel
  useEffect(() => {
    if (!currentChannelId || !user) return;

    const presenceChannel = supabase.channel(`typing-${currentChannelId}`, {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const typing: TypingUser[] = [];

        Object.entries(state).forEach(([userId, presences]) => {
          const presence = presences[0] as { typing?: boolean; name?: string };
          if (presence?.typing && userId !== user.id) {
            typing.push({ id: userId, name: presence.name || "Someone" });
          }
        });

        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ typing: false, name: userName });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(presenceChannel);
      presenceChannelRef.current = null;
    };
  }, [currentChannelId, user, userName]);

  const handleTyping = useCallback(() => {
    if (!presenceChannelRef.current) return;

    presenceChannelRef.current.track({ typing: true, name: userName });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      presenceChannelRef.current?.track({ typing: false, name: userName });
    }, 2000);
  }, [userName]);

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text || !user || !currentChannelId) return;

    presenceChannelRef.current?.track({ typing: false, name: userName });

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        channel_id: currentChannelId,
        user_id: user.id,
        user_email: user.email || "",
        user_name: userName,
        content: text,
        reply_to_id: replyTo?.id || null
      });

    if (error) {
      toast.error("Failed to send message");
      return;
    }

    setInput("");
    setReplyTo(null);
  };

  const handleCreateChannel = async () => {
    const name = newChannelName.trim();
    if (!name || !user) return;

    const exists = channels.some(ch => ch.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast.error("Channel already exists");
      return;
    }

    const { data, error } = await supabase
      .from("chat_channels")
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create channel");
      return;
    }

    setChannels(prev => [...prev, data]);
    setNewChannelName("");
    setShowNewChannel(false);
    setCurrentChannelId(data.id);
    setView("chat");
  };

  const handleSelectChannel = (channelId: string) => {
    setCurrentChannelId(channelId);
    setMessages([]);
    setTypingUsers([]);
    setView("chat");
  };

  const handleSelectContact = (userId: string) => {
    // For now, create or find a DM channel (using general channel as fallback)
    // In a full implementation, you'd create user-to-user DM channels
    setCurrentDMUserId(userId);
    
    // Find or create a DM channel - for now use general channel
    const generalChannel = channels.find(ch => ch.name.toLowerCase() === "general");
    if (generalChannel) {
      setCurrentChannelId(generalChannel.id);
      setView("chat");
    } else if (channels.length > 0) {
      setCurrentChannelId(channels[0].id);
      setView("chat");
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDisplayName = (msg: Message) => {
    const profile = profiles[msg.user_id];
    return profile?.full_name || msg.user_name || msg.user_email.split("@")[0];
  };

  const getReplyMessage = (replyToId: string | null) => {
    if (!replyToId) return null;
    return messages.find(m => m.id === replyToId);
  };

  const currentChannel = channels.find(ch => ch.id === currentChannelId);

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpenChat}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center",
          "bg-teal text-teal-foreground shadow-lg hover:scale-105 transition-transform",
          "border-2 border-teal/30",
          isOpen && "hidden"
        )}
        style={{
          boxShadow: "0 0 20px hsl(174 72% 46% / 0.4), 0 0 40px hsl(174 72% 46% / 0.2)"
        }}
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] rounded-lg flex flex-col overflow-hidden border border-teal/30"
          style={{
            backgroundColor: "hsl(var(--card))",
            boxShadow: "0 0 30px hsl(174 72% 46% / 0.3), 0 0 60px hsl(174 72% 46% / 0.15)"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-teal text-teal-foreground">
            <div className="flex items-center gap-2">
              {view !== "contacts" && view !== "channels" && (
                <button
                  onClick={() => setView("contacts")}
                  className="hover:bg-teal-foreground/10 p-1 rounded"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <h3 className="font-semibold">
                {view === "contacts" && "Contacts"}
                {view === "channels" && "Channels"}
                {view === "chat" && `# ${currentChannel?.name || "Chat"}`}
                {view === "dm" && "Direct Message"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {view === "contacts" && (
                <button
                  onClick={() => setView("channels")}
                  className="hover:bg-teal-foreground/10 p-1.5 rounded"
                  title="Channels"
                >
                  <Hash className="h-4 w-4" />
                </button>
              )}
              {view === "channels" && (
                <button
                  onClick={() => setView("contacts")}
                  className="hover:bg-teal-foreground/10 p-1.5 rounded"
                  title="Contacts"
                >
                  <Users className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-teal-foreground/10 p-1.5 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Contacts View */}
            {view === "contacts" && (
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {onlineUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">No other users</p>
                  ) : (
                    onlineUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectContact(u.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={u.avatarUrl || undefined} />
                            <AvatarFallback className="bg-teal/20 text-teal text-sm">
                              {getInitials(u.name, u.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                              u.isOnline ? "bg-success" : "bg-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Channels View */}
            {view === "channels" && (
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => handleSelectChannel(ch.id)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left",
                        currentChannelId === ch.id && "bg-muted"
                      )}
                    >
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{ch.name}</span>
                    </button>
                  ))}

                  {showNewChannel ? (
                    <div className="flex gap-2 p-2">
                      <Input
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="Channel name"
                        className="h-8 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
                      />
                      <Button size="sm" onClick={handleCreateChannel} className="h-8 bg-teal hover:bg-teal/90">
                        Add
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewChannel(true)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">New Channel</span>
                    </button>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Chat View */}
            {(view === "chat" || view === "dm") && (
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        No messages yet
                      </p>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.user_id === user.id;
                        const profile = profiles[msg.user_id];
                        const displayName = getDisplayName(msg);
                        const replyMessage = getReplyMessage(msg.reply_to_id);

                        return (
                          <div
                            key={msg.id}
                            className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}
                          >
                            {!isOwn && (
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage src={profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-teal/20 text-teal">
                                  {getInitials(displayName, msg.user_email)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="max-w-[70%] group">
                              {replyMessage && (
                                <div
                                  className={cn(
                                    "text-xs px-2 py-1 mb-1 rounded border-l-2 border-teal/50 bg-muted/50",
                                    isOwn && "ml-auto"
                                  )}
                                >
                                  <span className="font-medium text-teal/70">
                                    {getDisplayName(replyMessage)}
                                  </span>
                                  <p className="text-muted-foreground truncate">
                                    {replyMessage.content}
                                  </p>
                                </div>
                              )}
                              <div
                                className={cn(
                                  "p-2 rounded-lg relative",
                                  isOwn ? "bg-teal text-teal-foreground" : "bg-muted"
                                )}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-semibold mb-0.5 opacity-80">
                                    {displayName}
                                  </p>
                                )}
                                <p className="text-sm">{msg.content}</p>
                                <p
                                  className={cn(
                                    "text-xs mt-1",
                                    isOwn ? "text-teal-foreground/70" : "text-muted-foreground"
                                  )}
                                >
                                  {formatTime(msg.created_at)}
                                </p>
                                <button
                                  onClick={() => setReplyTo(msg)}
                                  className={cn(
                                    "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-foreground/10",
                                    isOwn ? "left-1" : "right-1"
                                  )}
                                  title="Reply"
                                >
                                  <Reply className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="px-3 py-1 text-xs text-muted-foreground flex items-center gap-1">
                    <span className="flex gap-0.5">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
                    </span>
                    <span>
                      {typingUsers.length === 1
                        ? `${typingUsers[0].name} is typing...`
                        : `${typingUsers.length} people are typing...`}
                    </span>
                  </div>
                )}

                {/* Reply preview */}
                {replyTo && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-t border-l-2 border-l-teal">
                    <Reply className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-teal">{getDisplayName(replyTo)}</p>
                      <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-muted rounded">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 h-9 text-sm"
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="icon"
                      className="h-9 w-9 bg-teal hover:bg-teal/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
