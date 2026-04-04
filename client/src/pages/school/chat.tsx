import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import SchoolLayout from "@/layouts/school-layout";
import {
  Send, Megaphone, MessageCircle, Users, Pin, GraduationCap,
  Pencil, Trash2, Check, X, Plus, ChevronLeft, UserPlus, Hash
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Tab = "class" | "groups";

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(date: string | Date) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function SchoolChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("class");
  const [message, setMessage] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [activeGroupChat, setActiveGroupChat] = useState<any | null>(null);
  const [groupMessage, setGroupMessage] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [editingGroupMsgId, setEditingGroupMsgId] = useState<string | null>(null);
  const [editGroupContent, setEditGroupContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const groupEndRef = useRef<HTMLDivElement>(null);
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

  const ageGroup = classData?.class?.ageGroup ?? "high_school";
  const isPrimary = ageGroup === "primary";
  const isHS = ageGroup === "high_school";

  const { data: messages = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/classroom/chat", chatClassId],
    queryFn: async () => {
      const url = chatClassId ? `/api/classroom/chat?classId=${chatClassId}` : "/api/classroom/chat";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!chatClassId,
  });

  const classmates: any[] = classData?.classmates ?? [];
  const allClassmates = isTeacher
    ? []
    : classmates;

  const currentClassName = isTeacher
    ? (teacherClasses as any[]).find(c => c.id === chatClassId)?.name ?? "Class Chat"
    : classData?.class?.name ?? "Class Chat";

  const hasClass = isTeacher ? (teacherClasses as any[]).length > 0 : !!classData?.class;

  const sendMutation = useMutation({
    mutationFn: (data: { content: string; messageType: string; classId?: string }) =>
      apiRequest("POST", "/api/classroom/chat", data),
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["/api/classroom/chat", chatClassId] });
    },
    onError: (error: any) => toast({ title: "Failed to send", description: error.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiRequest("PUT", `/api/classroom/chat/${id}`, { content }),
    onSuccess: () => {
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["/api/classroom/chat", chatClassId] });
    },
    onError: (error: any) => toast({ title: "Failed to edit", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/classroom/chat/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/classroom/chat", chatClassId] }),
    onError: (error: any) => toast({ title: "Failed to delete", description: error.message, variant: "destructive" }),
  });

  // Group Chats
  const { data: groupChats = [] } = useQuery<any[]>({
    queryKey: ["/api/group-chats"],
    refetchInterval: 5000,
    enabled: !!chatClassId,
  });

  const { data: groupMessages = [] } = useQuery<any[]>({
    queryKey: ["/api/group-chats", activeGroupChat?.id, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/group-chats/${activeGroupChat!.id}/messages`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!activeGroupChat,
  });

  const sendGroupMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/group-chats/${activeGroupChat?.id}/messages`, { content }),
    onSuccess: () => {
      setGroupMessage("");
      qc.invalidateQueries({ queryKey: ["/api/group-chats", activeGroupChat?.id, "messages"] });
      qc.invalidateQueries({ queryKey: ["/api/group-chats"] });
    },
    onError: (error: any) => toast({ title: "Failed to send", description: error.message, variant: "destructive" }),
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: { name: string; memberIds: string[] }) =>
      apiRequest("POST", "/api/group-chats", data),
    onSuccess: (data: any) => {
      setShowCreateGroup(false);
      setNewGroupName("");
      setSelectedMembers([]);
      qc.invalidateQueries({ queryKey: ["/api/group-chats"] });
      setActiveGroupChat(data);
    },
    onError: (error: any) => toast({ title: "Failed to create group", description: error.message, variant: "destructive" }),
  });

  const editGroupMsgMutation = useMutation({
    mutationFn: ({ msgId, content }: { msgId: string; content: string }) =>
      apiRequest("PUT", `/api/group-chats/${activeGroupChat?.id}/messages/${msgId}`, { content }),
    onSuccess: () => {
      setEditingGroupMsgId(null);
      qc.invalidateQueries({ queryKey: ["/api/group-chats", activeGroupChat?.id, "messages"] });
    },
    onError: (error: any) => toast({ title: "Failed to edit", description: error.message, variant: "destructive" }),
  });

  const deleteGroupMsgMutation = useMutation({
    mutationFn: (msgId: string) =>
      apiRequest("DELETE", `/api/group-chats/${activeGroupChat?.id}/messages/${msgId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/group-chats", activeGroupChat?.id, "messages"] }),
    onError: (error: any) => toast({ title: "Failed to delete", description: error.message, variant: "destructive" }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    groupEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate({
      content: message.trim(),
      messageType: isAnnouncement && isTeacher ? "announcement" : "message",
      classId: chatClassId,
    });
  };

  const handleGroupSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupMessage.trim()) return;
    sendGroupMutation.mutate(groupMessage.trim());
  };

  const startEdit = (msg: any) => {
    if (msg.isDeleted) return;
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const startEditGroup = (msg: any) => {
    if (msg.isDeleted) return;
    setEditingGroupMsgId(msg.id);
    setEditGroupContent(msg.content);
  };

  // Color helpers
  const bg = isPrimary ? "bg-amber-50" : "bg-[#0b1120]";
  const border = isPrimary ? "border-amber-200" : "border-[#1e2d4a]";
  const headerBg = isPrimary ? "bg-amber-50 border-amber-200" : "bg-[#0d1526] border-[#1e2d4a]";
  const textPrimary = isPrimary ? "text-amber-900" : "text-white";
  const textMuted = isPrimary ? "text-amber-700" : "text-slate-400";
  const accentBg = isPrimary ? "bg-amber-500" : "bg-teal-600";
  const accentText = isPrimary ? "text-amber-600" : "text-teal-400";
  const myBubble = isPrimary ? "bg-amber-500 text-white" : "bg-teal-600 text-white";
  const theirBubble = isPrimary ? "bg-white border border-amber-200 text-amber-900" : "bg-white/8 text-white";
  const inputBg = isPrimary ? "bg-white border-amber-300 text-amber-900 placeholder-amber-400 focus:border-amber-500" : "bg-white/8 border-white/10 text-white placeholder-slate-500 focus:border-teal-500/50";
  const tabActive = isPrimary ? "bg-amber-500 text-white" : "bg-teal-600 text-white";
  const tabInactive = isPrimary ? "text-amber-700 hover:bg-amber-100" : "text-slate-400 hover:bg-white/5";

  return (
    <SchoolLayout>
      <div className={`flex flex-col h-full ${bg}`}>
        {/* Header */}
        <div className={`px-5 py-3 border-b flex items-center gap-3 ${headerBg}`}>
          {activeGroupChat ? (
            <>
              <button onClick={() => setActiveGroupChat(null)} className={`${textMuted} hover:${textPrimary} transition-colors`} data-testid="button-back-to-groups">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accentBg}`}>
                <Hash className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`font-black text-sm truncate ${textPrimary}`}>{activeGroupChat.name}</h1>
                <p className={`text-xs ${textMuted}`}>{activeGroupChat.memberCount} members</p>
              </div>
            </>
          ) : (
            <>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accentBg}`}>
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`font-black text-sm ${textPrimary}`}>
                  {isPrimary ? "💬 Class Chat" : "Class Chat"}
                </h1>
                <p className={`text-xs ${textMuted}`}>{currentClassName}</p>
              </div>

              {isTeacher && (teacherClasses as any[]).length > 1 && (
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  data-testid="select-chat-class"
                  className={`text-xs rounded-lg px-2 py-1 border ${isPrimary ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-[#1e3050] border-[#2a4070] text-white"}`}
                >
                  {(teacherClasses as any[]).map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              )}

              <div className={`flex items-center gap-1 text-xs ${textMuted}`}>
                <Users className="h-3.5 w-3.5" />
                <span>{(classmates).length + 1}</span>
              </div>
            </>
          )}
        </div>

        {/* Tabs (only show if has class and not in a group chat) */}
        {hasClass && !activeGroupChat && (
          <div className={`flex px-4 pt-3 gap-2 border-b pb-3 ${border}`}>
            <button
              onClick={() => setTab("class")}
              data-testid="tab-class-chat"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "class" ? tabActive : tabInactive}`}
            >
              <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />Class Chat</span>
            </button>
            <button
              onClick={() => setTab("groups")}
              data-testid="tab-group-chats"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "groups" ? tabActive : tabInactive}`}
            >
              <span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Group Chats</span>
            </button>
          </div>
        )}

        {!hasClass ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <MessageCircle className={`h-16 w-16 opacity-20 ${isPrimary ? "text-amber-500" : "text-teal-500"}`} />
            <div className="text-center">
              <p className={`font-bold text-lg ${textPrimary}`}>No Classroom Yet</p>
              <p className={`text-sm mt-1 ${textMuted}`}>
                {isTeacher ? "Create a class to start chatting with students." : "Join a class to access the chat."}
              </p>
            </div>
          </div>
        ) : activeGroupChat ? (
          /* === GROUP CHAT MESSAGES === */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(groupMessages as any[]).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                  <Hash className={`h-12 w-12 opacity-20 ${isPrimary ? "text-amber-500" : "text-teal-500"}`} />
                  <p className={`text-sm font-semibold ${textMuted}`}>No messages yet. Be the first to send one!</p>
                </div>
              ) : (
                (groupMessages as any[]).map((msg: any) => {
                  const isMe = msg.senderId === user?.id;
                  const isTeacherMsg = msg.senderRole === "teacher" || msg.senderRole === "admin";
                  const isEditingThis = editingGroupMsgId === msg.id;
                  return (
                    <div key={msg.id} data-testid={`group-msg-${msg.id}`} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isTeacherMsg ? (isPrimary ? "bg-amber-500 text-white" : "bg-teal-600 text-white") : (isPrimary ? "bg-amber-300 text-amber-900" : "bg-slate-700 text-white")}`}>
                        {isTeacherMsg ? <GraduationCap className="h-3.5 w-3.5" /> : msg.senderName?.charAt(0).toUpperCase()}
                      </div>
                      <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                        {!isMe && (
                          <span className={`text-xs font-semibold ${isTeacherMsg ? accentText : textMuted}`}>
                            {msg.senderName}{isTeacherMsg ? " 👨‍🏫" : ""}
                          </span>
                        )}
                        {isEditingThis ? (
                          <div className="flex gap-1.5 items-center">
                            <input
                              value={editGroupContent}
                              onChange={e => setEditGroupContent(e.target.value)}
                              autoFocus
                              className={`rounded-xl px-3 py-2 text-sm border outline-none ${inputBg}`}
                              data-testid="input-edit-group-message"
                            />
                            <button onClick={() => editGroupMsgMutation.mutate({ msgId: msg.id, content: editGroupContent })} className="text-emerald-400 hover:text-emerald-300 transition-colors" data-testid="button-save-edit-group">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingGroupMsgId(null)} className={`${textMuted} hover:${textPrimary} transition-colors`} data-testid="button-cancel-edit-group">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className={`group relative px-3.5 py-2 rounded-2xl text-sm ${isMe ? `${myBubble} rounded-tr-sm` : `${theirBubble} rounded-tl-sm`} ${msg.isDeleted ? "opacity-50 italic" : ""}`}>
                            {msg.content}
                            {msg.editedAt && !msg.isDeleted && (
                              <span className={`text-xs ml-1.5 ${isMe ? "text-white/60" : textMuted}`}>(edited)</span>
                            )}
                            {isMe && !msg.isDeleted && (
                              <div className={`absolute ${isMe ? "-left-16" : "-right-16"} top-1 hidden group-hover:flex gap-1`}>
                                <button onClick={() => startEditGroup(msg)} className={`p-1 rounded-lg ${isPrimary ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-white/10 text-slate-400 hover:bg-white/15"}`} data-testid={`button-edit-group-msg-${msg.id}`}><Pencil className="h-3 w-3" /></button>
                                <button onClick={() => deleteGroupMsgMutation.mutate(msg.id)} className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30" data-testid={`button-delete-group-msg-${msg.id}`}><Trash2 className="h-3 w-3" /></button>
                              </div>
                            )}
                          </div>
                        )}
                        <span className={`text-xs ${textMuted}`}>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={groupEndRef} />
            </div>
            <div className={`p-4 border-t ${headerBg}`}>
              <form onSubmit={handleGroupSend} className="flex gap-2">
                <input
                  value={groupMessage}
                  onChange={e => setGroupMessage(e.target.value)}
                  placeholder="Message group..."
                  data-testid="input-group-message"
                  maxLength={500}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors ${inputBg}`}
                />
                <button
                  type="submit"
                  disabled={!groupMessage.trim() || sendGroupMutation.isPending}
                  data-testid="button-send-group"
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 ${isPrimary ? "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40" : "bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-40"}`}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : tab === "class" ? (
          /* === CLASS CHAT === */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-14 rounded-2xl animate-pulse ${isPrimary ? "bg-amber-100" : "bg-white/5"}`} />
                  ))}
                </div>
              ) : (messages as any[]).filter(m => !m.isDeleted || m.senderId === user?.id).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                  <MessageCircle className={`h-12 w-12 opacity-20 ${isPrimary ? "text-amber-500" : "text-teal-500"}`} />
                  <p className={`text-sm font-semibold ${textMuted}`}>
                    {isPrimary ? "Be the first to say hello! 👋" : "No messages yet. Start the conversation!"}
                  </p>
                </div>
              ) : (
                (() => {
                  let lastDate = "";
                  return (messages as any[]).map((msg: any) => {
                    const isMe = msg.senderId === user?.id;
                    const isAnn = msg.messageType === "announcement";
                    const isTeacherMsg = msg.senderRole === "teacher" || msg.senderRole === "admin";
                    const isEditingThis = editingId === msg.id;
                    const msgDate = formatDate(msg.createdAt);
                    const showDate = msgDate !== lastDate;
                    lastDate = msgDate;

                    if (isAnn) {
                      return (
                        <div key={msg.id}>
                          {showDate && <div className={`text-center my-2`}><span className={`text-xs font-semibold px-3 py-1 rounded-full ${isPrimary ? "bg-amber-100 text-amber-600" : "bg-white/10 text-slate-400"}`}>{msgDate}</span></div>}
                          <div data-testid={`chat-announcement-${msg.id}`} className={`p-4 rounded-2xl border-l-4 ${isPrimary ? "bg-amber-100 border-amber-500" : "bg-teal-500/10 border-teal-500"}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Pin className={`h-3.5 w-3.5 ${accentText}`} />
                              <span className={`text-xs font-black uppercase tracking-wide ${accentText}`}>Announcement</span>
                              <span className={`text-xs ml-auto ${textMuted}`}>{msg.senderName}</span>
                            </div>
                            <p className={`text-sm font-semibold ${textPrimary}`}>{msg.content}</p>
                            <p className={`text-xs mt-1 ${textMuted}`}>{formatTime(msg.createdAt)}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id}>
                        {showDate && <div className="text-center my-2"><span className={`text-xs font-semibold px-3 py-1 rounded-full ${isPrimary ? "bg-amber-100 text-amber-600" : "bg-white/10 text-slate-400"}`}>{msgDate}</span></div>}
                        <div data-testid={`chat-message-${msg.id}`} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isTeacherMsg ? (isPrimary ? "bg-amber-500 text-white" : "bg-teal-600 text-white") : (isPrimary ? "bg-amber-300 text-amber-900" : "bg-slate-700 text-white")}`}>
                            {isTeacherMsg ? <GraduationCap className="h-3.5 w-3.5" /> : msg.senderName?.charAt(0).toUpperCase()}
                          </div>
                          <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                            {!isMe && (
                              <span className={`text-xs font-semibold ${isTeacherMsg ? accentText : textMuted}`}>
                                {msg.senderName}{isTeacherMsg ? " 👨‍🏫" : ""}
                              </span>
                            )}
                            {isEditingThis ? (
                              <div className="flex gap-1.5 items-center">
                                <input
                                  value={editContent}
                                  onChange={e => setEditContent(e.target.value)}
                                  autoFocus
                                  className={`rounded-xl px-3 py-2 text-sm border outline-none ${inputBg}`}
                                  data-testid="input-edit-message"
                                  onKeyDown={e => { if (e.key === "Escape") setEditingId(null); if (e.key === "Enter") editMutation.mutate({ id: msg.id, content: editContent }); }}
                                />
                                <button onClick={() => editMutation.mutate({ id: msg.id, content: editContent })} className="text-emerald-400 hover:text-emerald-300" data-testid={`button-save-edit-${msg.id}`}><Check className="h-4 w-4" /></button>
                                <button onClick={() => setEditingId(null)} className={`${textMuted}`} data-testid={`button-cancel-edit-${msg.id}`}><X className="h-4 w-4" /></button>
                              </div>
                            ) : (
                              <div className={`group relative px-3.5 py-2 rounded-2xl text-sm ${isMe ? `${myBubble} rounded-tr-sm` : `${theirBubble} rounded-tl-sm`} ${msg.isDeleted ? "opacity-50 italic" : ""}`}>
                                {msg.content}
                                {msg.editedAt && !msg.isDeleted && (
                                  <span className={`text-xs ml-1.5 ${isMe ? "text-white/60" : textMuted}`}>(edited)</span>
                                )}
                                {isMe && !msg.isDeleted && (
                                  <div className={`absolute -left-16 top-1 hidden group-hover:flex gap-1`}>
                                    <button onClick={() => startEdit(msg)} className={`p-1 rounded-lg ${isPrimary ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-white/10 text-slate-400 hover:bg-white/15"}`} data-testid={`button-edit-${msg.id}`}><Pencil className="h-3 w-3" /></button>
                                    <button onClick={() => deleteMutation.mutate(msg.id)} className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30" data-testid={`button-delete-${msg.id}`}><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                )}
                              </div>
                            )}
                            <span className={`text-xs ${textMuted}`}>{formatTime(msg.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={`p-4 border-t ${headerBg}`}>
              {isTeacher && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setIsAnnouncement(!isAnnouncement)}
                    data-testid="toggle-announcement"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAnnouncement ? (isPrimary ? "bg-amber-500 text-white" : "bg-teal-600 text-white") : (isPrimary ? "bg-amber-200 text-amber-700 hover:bg-amber-300" : "bg-white/10 text-slate-400 hover:bg-white/15")}`}
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    {isAnnouncement ? "Announcement ON" : "Post as Announcement"}
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
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors ${inputBg}`}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sendMutation.isPending}
                  data-testid="button-send-chat"
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 ${isPrimary ? "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40" : "bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-40"}`}
                >
                  <Send className="h-4 w-4" />
                  {!isPrimary && "Send"}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* === GROUP CHATS LIST === */
          showCreateGroup ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowCreateGroup(false)} className={`${textMuted} hover:${textPrimary}`} data-testid="button-cancel-create-group">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className={`font-black text-base ${textPrimary}`}>New Group Chat</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-bold ${textMuted} uppercase tracking-wide`}>Group Name</label>
                  <input
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="e.g. Study Squad, Finance Club..."
                    data-testid="input-group-name"
                    className={`mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm border outline-none ${inputBg}`}
                  />
                </div>
                {!isTeacher && allClassmates.length > 0 && (
                  <div>
                    <label className={`text-xs font-bold ${textMuted} uppercase tracking-wide`}>Add Classmates</label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {allClassmates.map((cm: any) => (
                        <button
                          key={cm.id}
                          onClick={() => setSelectedMembers(prev => prev.includes(cm.id) ? prev.filter(id => id !== cm.id) : [...prev, cm.id])}
                          data-testid={`member-option-${cm.id}`}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${selectedMembers.includes(cm.id) ? (isPrimary ? "bg-amber-100 border border-amber-400" : "bg-teal-500/20 border border-teal-500/40") : (isPrimary ? "bg-white border border-amber-200 hover:bg-amber-50" : "bg-white/5 border border-white/10 hover:bg-white/8")}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isPrimary ? "bg-amber-300 text-amber-900" : "bg-slate-700 text-white"}`}>
                            {cm.displayName?.charAt(0).toUpperCase()}
                          </div>
                          <span className={`font-semibold ${textPrimary}`}>{cm.displayName}</span>
                          {selectedMembers.includes(cm.id) && <Check className="h-4 w-4 ml-auto text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => createGroupMutation.mutate({ name: newGroupName, memberIds: selectedMembers })}
                  disabled={!newGroupName.trim() || createGroupMutation.isPending}
                  data-testid="button-create-group"
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all ${isPrimary ? "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40" : "bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-40"}`}
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group Chat"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 flex items-center justify-between">
                <p className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>Your Groups ({(groupChats as any[]).length})</p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  data-testid="button-new-group"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPrimary ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-teal-600 text-white hover:bg-teal-500"}`}
                >
                  <Plus className="h-3.5 w-3.5" /> New Group
                </button>
              </div>

              {(groupChats as any[]).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 px-8">
                  <Hash className={`h-14 w-14 opacity-20 ${isPrimary ? "text-amber-500" : "text-teal-500"}`} />
                  <div className="text-center">
                    <p className={`font-bold ${textPrimary}`}>No Group Chats Yet</p>
                    <p className={`text-sm mt-1 ${textMuted}`}>Create a private group with your classmates to collaborate and chat!</p>
                  </div>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    data-testid="button-create-first-group"
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isPrimary ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-teal-600 text-white hover:bg-teal-500"}`}
                  >
                    <Plus className="h-4 w-4" /> Create Group
                  </button>
                </div>
              ) : (
                <div className="px-4 space-y-2 pb-4">
                  {(groupChats as any[]).map((gc: any) => (
                    <button
                      key={gc.id}
                      onClick={() => setActiveGroupChat(gc)}
                      data-testid={`group-chat-${gc.id}`}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${isPrimary ? "bg-white border-amber-200 hover:bg-amber-50" : "bg-white/5 border-white/10 hover:bg-white/8"}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${accentBg} text-white flex-shrink-0`}>
                        {gc.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${textPrimary}`}>{gc.name}</p>
                        <p className={`text-xs truncate mt-0.5 ${textMuted}`}>
                          {gc.lastMessage ?? `${gc.memberCount} members`}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${textMuted}`}>
                        <Users className="h-3 w-3" />
                        <span>{gc.memberCount}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </SchoolLayout>
  );
}
