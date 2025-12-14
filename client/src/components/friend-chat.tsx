import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import type { User, ChatMessage } from "@shared/schema";
import { format } from "date-fns";

interface FriendChatProps {
  friend: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendChat({ friend, open, onOpenChange }: FriendChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", friend?.id],
    enabled: !!friend?.id && open,
  });

  const allMessages = [...messages, ...realtimeMessages.filter(
    rm => !messages.some(m => m.id === rm.id)
  )].sort((a, b) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );

  useEffect(() => {
    if (!open || !user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", userId: user.id }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case "connected":
          setIsConnected(true);
          break;
        case "message_sent":
          setIsSending(false);
          setRealtimeMessages(prev => [...prev, data.message]);
          queryClient.invalidateQueries({ queryKey: ["/api/chat", friend?.id] });
          break;
        case "new_message":
          if (data.message.senderId === friend?.id) {
            setRealtimeMessages(prev => [...prev, data.message]);
            queryClient.invalidateQueries({ queryKey: ["/api/chat", friend?.id] });
            socket.send(JSON.stringify({ type: "read", senderId: friend?.id }));
          }
          queryClient.invalidateQueries({ queryKey: ["/api/chat/unread/count"] });
          break;
        case "typing":
          if (data.senderId === friend?.id) {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              if (data.isTyping) {
                newSet.add(data.senderId);
              } else {
                newSet.delete(data.senderId);
              }
              return newSet;
            });
          }
          break;
        case "error":
          console.error("WebSocket error:", data.message);
          setIsSending(false);
          break;
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    setWs(socket);

    return () => {
      socket.close();
      setWs(null);
      setIsConnected(false);
      setRealtimeMessages([]);
      setTypingUsers(new Set());
    };
  }, [open, user?.id, friend?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages]);

  useEffect(() => {
    if (open && friend?.id && ws && isConnected) {
      ws.send(JSON.stringify({ type: "read", senderId: friend.id }));
    }
  }, [open, friend?.id, ws, isConnected]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (ws && isConnected && friend?.id) {
      ws.send(JSON.stringify({
        type: "typing",
        receiverId: friend.id,
        isTyping,
      }));
    }
  }, [ws, isConnected, friend?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    sendTypingIndicator(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !ws || !isConnected || !friend?.id) return;
    
    setIsSending(true);
    sendTypingIndicator(false);
    
    ws.send(JSON.stringify({
      type: "chat",
      receiverId: friend.id,
      content: message.trim(),
    }));
    
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!friend) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 sm:max-w-md">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={friend.avatarUrl || undefined} />
              <AvatarFallback>{friend.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-left">{friend.displayName}</SheetTitle>
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Connected" : "Connecting..."}
              </p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              allMessages.map((msg) => {
                const isOwn = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {msg.createdAt && format(new Date(msg.createdAt), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {typingUsers.has(friend.id) && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <p className="text-sm text-muted-foreground italic">typing...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={!isConnected || isSending}
              data-testid="input-chat-message"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!message.trim() || !isConnected || isSending}
              data-testid="button-send-message"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
