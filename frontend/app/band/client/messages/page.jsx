"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Send,
  User,
  Calendar,
  Sparkles,
  Inbox,
  Search,
  RefreshCw,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { getBandUser } from "@/lib/bandAuth";
import bandApi from "@/lib/bandApi";
import toast from "react-hot-toast";

export default function ClientMessagesPage() {
  const { user } = useAuth();
  const [bandUser, setBandUser] = useState(null);
  const [searchParams] = useSearchParams();
  const targetConvId = searchParams.get("conversation_id");

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const u = getBandUser();
    if (u) setBandUser(u);
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await bandApi.get("/messaging/conversations");
      const list = res.data?.data || [];
      setConversations(list);

      if (list.length > 0) {
        if (targetConvId) {
          const match = list.find((c) => String(c.id) === String(targetConvId));
          setActiveConversation(match || list[0]);
        } else if (!activeConversation) {
          setActiveConversation(list[0]);
        }
      }
    } catch {
      // Fallback clean state
    } finally {
      setLoading(false);
    }
  }, [targetConvId, activeConversation]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const res = await bandApi.get(`/messaging/conversations/${convId}/messages`);
      setChatMessages(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  useEffect(() => {
    if (activeConversation?.id) {
      fetchMessages(activeConversation.id);
      const interval = setInterval(() => {
        fetchMessages(activeConversation.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeConversation?.id, fetchMessages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !activeConversation?.id || sending) return;

    setSending(true);
    const content = messageText.trim();
    setMessageText("");

    try {
      const res = await bandApi.post(
        `/messaging/conversations/${activeConversation.id}/messages`,
        { content }
      );
      if (res.data?.data) {
        setChatMessages((prev) => [...prev, res.data.data]);
      }
      fetchMessages(activeConversation.id);
      fetchConversations();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send message.");
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  const currentUserId = bandUser?.id || user?.id;

  return (
    <DashboardLayout role="client">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Header Title Bar */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
            <MessageSquare style={{ width: "13px", height: "13px" }} />
            <span>Direct Event Coordination</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
            Messages &amp; Coordination
          </h1>
        </div>

        {/* 2-Column Split Chat Panel */}
        {conversations.length === 0 && !loading ? (
          <div
            style={{
              padding: "60px 24px",
              borderRadius: "24px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <Inbox style={{ width: "28px", height: "28px" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                No Active Conversations Yet
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", maxWidth: "420px", lineHeight: 1.5 }}>
                When you book an artist or venue and they accept your request, a direct messaging thread will open here so you can coordinate show details.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "340px 1fr",
              gap: "0px",
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              minHeight: "560px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            {/* Left Column: Conversations */}
            <div style={{ borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#0a0a0f" }}>All Conversations ({conversations.length})</span>
                <button
                  type="button"
                  onClick={fetchConversations}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center" }}
                  title="Refresh inbox"
                >
                  <RefreshCw style={{ width: "14px", height: "14px" }} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "560px" }}>
                {conversations.map((c) => {
                  const isSelected = activeConversation?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveConversation(c)}
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: isSelected ? "#f8fafc" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        borderLeft: isSelected ? "4px solid #0a0a0f" : "4px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0a0a0f" }}>{c.partner_name || "Performer"}</span>
                        <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>
                          {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <span style={{ fontSize: "11.5px", color: "#059669", fontWeight: 700 }}>
                        {c.event_name || `Booking #${c.booking_id}`}
                      </span>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.last_message}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Conversation */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#f8fafc" }}>
              {/* Header */}
              <div style={{ padding: "16px 24px", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                    {activeConversation?.partner_name || "Performer"}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                    Event: {activeConversation?.event_name || `Booking #${activeConversation?.booking_id || ""}`} · Status: <strong style={{ color: "#059669" }}>{activeConversation?.booking_status || "Active"}</strong>
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto", flex: 1, maxHeight: "430px" }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "40px 0" }}>
                    No messages in this conversation yet. Send the first greeting below!
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = String(msg.sender_id) === String(currentUserId);
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "70%",
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 18px",
                            borderRadius: "18px",
                            backgroundColor: isMe ? "#0a0a0f" : "#ffffff",
                            color: isMe ? "#ffffff" : "#0a0a0f",
                            fontSize: "13px",
                            fontWeight: 500,
                            lineHeight: 1.5,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            borderBottomRightRadius: isMe ? "4px" : "18px",
                            borderBottomLeftRadius: isMe ? "18px" : "4px",
                            border: isMe ? "none" : "1px solid #e2e8f0",
                          }}
                        >
                          {msg.content}
                        </div>
                        <span style={{ fontSize: "10.5px", color: "#94a3b8", alignSelf: isMe ? "flex-end" : "flex-start", padding: "0 4px" }}>
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Box */}
              <form onSubmit={handleSendMessage} style={{ padding: "16px 20px", backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0", display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  disabled={!activeConversation?.id}
                  style={{
                    flex: 1,
                    padding: "12px 18px",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    outline: "none",
                    backgroundColor: "#f8fafc",
                  }}
                />
                <button
                  type="submit"
                  disabled={!activeConversation?.id || sending || !messageText.trim()}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "14px",
                    backgroundColor: "#c6ff3d",
                    color: "#0a0a0f",
                    border: "none",
                    fontWeight: 900,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: !messageText.trim() ? 0.6 : 1,
                  }}
                >
                  <span>{sending ? "Sending..." : "Send"}</span>
                  <Send style={{ width: "14px", height: "14px" }} />
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
