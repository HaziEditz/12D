import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import SchoolLayout from "@/layouts/school-layout";
import { Send, Megaphone, MessageCircle, Users, Pin, GraduationCap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SchoolChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const { data: classData } = useQuery<any>({
    queryKey: ["/api/classroom"],
    enabled: user?.role === "student",
  });

  const { data: teacherClasses = [] } = useQuery<any[]>({
    queryKey: ["/api/teacher/classes"],
    enabled: isTeacher,
  });

  const chatClassId = isTeacher
    ? (selectedClass || (teacherClasses as any[])[0]?.id)
    : classData?.class?.id;

  const { data: messages = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/classroom/chat", chatClassId],
    queryFn: async () => {
      const url = chatClassId ? `/api/classroom/chat?classId=${chatClassId}` : "/api/classroom/chat";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!chatClassId || !isTeacher,
  });

  const { data: classmates = [] } = useQuery<any[]>({
    queryKey: ["/api/classroom"],
    select: (d: any) => d?.classmates ?? [],
    enabled: user?.role === "student",
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { content: string; messageType: string; classId?: string }) => {
      return apiRequest("POST", "/api/classroom/chat", data);
    },
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["/api/classroom/chat", chatClassId] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate({
      content: message.trim(),
      messageType: isAnnouncement && isTeacher ? "announcement" : "message",
      classId: chatClassId,
    });
  };

  const { data: classInfo } = useQuery<any>({
    queryKey: ["/api/classroom"],
    enabled: user?.role === "student",
  });

  const ageGroup = classInfo?.class?.ageGroup ?? "high_school";
  const isPrimary = ageGroup === "primary";

  const currentClassName = isTeacher
    ? (teacherClasses as any[]).find(c => c.id === chatClassId)?.name ?? "Class Chat"
    : classInfo?.class?.name ?? "Class Chat";

  const hasClass = isTeacher ? (teacherClasses as any[]).length > 0 : !!classInfo?.class;

  return (
    <SchoolLayout>
      <div className="flex flex-col h-full">
        <div className={`px-5 py-4 border-b flex items-center gap-3 ${isPrimary ? "bg-amber-50 border-amber-200" : "bg-[#0d1526] border-[#1e2d4a]"}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPrimary ? "bg-amber-500" : "bg-teal-600"}`}>
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`font-black text-base ${isPrimary ? "text-amber-900" : "text-white"}`}>
              {isPrimary ? "💬 Class Chat" : "Class Chat"}
            </h1>
            <p className={`text-xs ${isPrimary ? "text-amber-700" : "text-slate-400"}`}>{currentClassName}</p>
          </div>

          {isTeacher && (teacherClasses as any[]).length > 1 && (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              data-testid="select-chat-class"
              className={`text-xs rounded-lg px-2 py-1.5 border ${isPrimary ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-[#1e3050] border-[#2a4070] text-white"}`}
            >
              {(teacherClasses as any[]).map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          )}

          <div className={`flex items-center gap-1.5 text-xs ${isPrimary ? "text-amber-600" : "text-slate-400"}`}>
            <Users className="h-3.5 w-3.5" />
            <span>{(classmates as any[]).length + 1} members</span>
          </div>
        </div>

        {!hasClass ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <MessageCircle className={`h-16 w-16 opacity-20 ${isPrimary ? "text-amber-500" : "text-teal-500"}`} />
            <div className="text-center">
              <p className={`font-bold text-lg ${isPrimary ? "text-amber-900" : "text-white"}`}>No Classroom Yet</p>
              <p className={`text-sm mt-1 ${isPrimary ? "text-amber-700" : "text-slate-400"}`}>
                {isTeacher ? "Create a class to start chatting with students." : "Join a class to access the chat."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-16 rounded-2xl animate-pulse ${isPrimary ? "bg-amber-100" : "bg-white/5"}`} />
                  ))}
                </div>
              ) : (messages as any[]).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                  <MessageCircle className={`h-12 w-12 opacity-20 ${isPrimary ? "text-amber-500" : "text-teal-500"}`} />
                  <p className={`text-sm font-semibold ${isPrimary ? "text-amber-700" : "text-slate-400"}`}>
                    {isPrimary ? "Be the first to say hello! 👋" : "No messages yet. Start the conversation!"}
                  </p>
                </div>
              ) : (
                (messages as any[]).map((msg: any) => {
                  const isMe = msg.senderId === user?.id;
                  const isAnn = msg.messageType === "announcement";
                  const isTeacherMsg = msg.senderRole === "teacher" || msg.senderRole === "admin";

                  if (isAnn) {
                    return (
                      <div key={msg.id} data-testid={`chat-announcement-${msg.id}`} className={`p-4 rounded-2xl border-l-4 ${isPrimary ? "bg-amber-100 border-amber-500" : "bg-teal-500/10 border-teal-500"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Pin className={`h-3.5 w-3.5 ${isPrimary ? "text-amber-600" : "text-teal-400"}`} />
                          <span className={`text-xs font-black uppercase tracking-wide ${isPrimary ? "text-amber-600" : "text-teal-400"}`}>
                            Announcement
                          </span>
                          <span className={`text-xs ml-auto ${isPrimary ? "text-amber-700" : "text-slate-500"}`}>
                            {msg.senderName}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold ${isPrimary ? "text-amber-900" : "text-white"}`}>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isPrimary ? "text-amber-600" : "text-slate-500"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} data-testid={`chat-message-${msg.id}`} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        isTeacherMsg
                          ? isPrimary ? "bg-amber-500 text-white" : "bg-teal-600 text-white"
                          : isPrimary ? "bg-amber-300 text-amber-900" : "bg-slate-600 text-white"
                      }`}>
                        {isTeacherMsg ? <GraduationCap className="h-4 w-4" /> : msg.senderName?.charAt(0).toUpperCase()}
                      </div>
                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                        {!isMe && (
                          <span className={`text-xs font-semibold ${isTeacherMsg ? (isPrimary ? "text-amber-600" : "text-teal-400") : (isPrimary ? "text-amber-700" : "text-slate-400")}`}>
                            {msg.senderName}{isTeacherMsg ? " 👨‍🏫" : ""}
                          </span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? isPrimary ? "bg-amber-500 text-white rounded-tr-sm" : "bg-teal-600 text-white rounded-tr-sm"
                            : isPrimary ? "bg-white border border-amber-200 text-amber-900 rounded-tl-sm" : "bg-white/8 text-white rounded-tl-sm"
                        }`}>
                          {msg.content}
                        </div>
                        <span className={`text-xs ${isPrimary ? "text-amber-600" : "text-slate-500"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={`p-4 border-t ${isPrimary ? "bg-amber-50 border-amber-200" : "bg-[#0d1526] border-[#1e2d4a]"}`}>
              {isTeacher && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setIsAnnouncement(!isAnnouncement)}
                    data-testid="toggle-announcement"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isAnnouncement
                        ? isPrimary ? "bg-amber-500 text-white" : "bg-teal-600 text-white"
                        : isPrimary ? "bg-amber-200 text-amber-700 hover:bg-amber-300" : "bg-white/10 text-slate-400 hover:bg-white/15"
                    }`}
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    {isAnnouncement ? "Announcement Mode ON" : "Post as Announcement"}
                  </button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={isPrimary ? "Type your message here... 😊" : "Message your class..."}
                  data-testid="input-chat-message"
                  maxLength={500}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm border outline-none ${
                    isPrimary
                      ? "bg-white border-amber-300 text-amber-900 placeholder-amber-400 focus:border-amber-500"
                      : "bg-white/8 border-white/10 text-white placeholder-slate-500 focus:border-teal-500/50"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sendMutation.isPending}
                  data-testid="button-send-chat"
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    isPrimary
                      ? "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40"
                      : "bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-40"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  {isPrimary ? "" : "Send"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </SchoolLayout>
  );
}
