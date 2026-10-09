import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io(
  "https://chatting-app-server-production.up.railway.app",
  {
    transports: ["websocket", "polling"],
  }
);

export default function ChatApp() {
  const [username, setUsername] = useState("");
  const [groupName, setGroupName] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const receiveMessage = (incomingMessage) => {
      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (msg) => msg.id === incomingMessage.id
        );

        if (alreadyExists) {
          return prevMessages.map((msg) =>
            msg.id === incomingMessage.id
              ? { ...msg, status: "delivered" }
              : msg
          );
        }

        return [
          ...prevMessages,
          {
            ...incomingMessage,
            status: "delivered",
          },
        ];
      });
    };

    const messageDelivered = (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: "delivered" }
            : msg
        )
      );
    };

    const messageRead = (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: "read" }
            : msg
        )
      );
    };

    socket.on("message", receiveMessage);
    socket.on("delivered", messageDelivered);
    socket.on("read", messageRead);

    return () => {
      socket.off("message", receiveMessage);
      socket.off("delivered", messageDelivered);
      socket.off("read", messageRead);
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();

    const cleanUsername = username.trim();
    const cleanGroupName = groupName.trim();

    if (cleanUsername && cleanGroupName) {
      setUsername(cleanUsername);
      setGroupName(cleanGroupName);

      socket.emit("join", cleanGroupName);

      setJoined(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    const newMessage = {
      id: Date.now() + Math.random(),
      sender: username,
      text: message.trim(),
      room: groupName,
      type: "text",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "delivered",
    };

    socket.emit("send", newMessage);

    setMessages((prevMessages) => [
      ...prevMessages,
      newMessage,
    ]);

    setMessage("");
  };

  const handleLeave = () => {
    socket.emit("leave", groupName);

    setJoined(false);
    setMessages([]);
    setMessage("");
  };

  const handleReadMessage = (messageId) => {
    socket.emit("read", {
      messageId,
      room: groupName,
    });

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, status: "read" }
          : msg
      )
    );
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-0 py-0 sm:flex sm:items-center sm:justify-center sm:px-4 sm:py-5 md:px-6">
      {!joined ? (
        <div className="flex min-h-[100dvh] w-full items-center justify-center px-4 py-6 sm:min-h-0 sm:max-w-md sm:px-0">
          <div className="w-full rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl sm:p-7 md:p-8">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20 sm:h-16 sm:w-16">
                <img
                  src="/image copy 3.png"
                  alt="Chat Logo"
                  className="h-full w-full rounded-2xl object-cover"
                />
              </div>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Chatting App
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Join a group and start chatting
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Username
                </label>

                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Group Name
                </label>

                <input
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-600 hover:to-violet-700 active:scale-[0.98]"
              >
                Join Group
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden border-x border-white/10 bg-slate-900 shadow-2xl sm:h-[calc(100dvh-40px)] sm:max-h-[760px] sm:max-w-2xl sm:rounded-3xl md:max-w-3xl lg:max-w-4xl">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-3 py-3.5 sm:px-5 sm:py-4 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg sm:h-11 sm:w-11">
                <img
                  src="/image copy 3.png"
                  alt="Chat Logo"
                  className="h-full w-full rounded-xl object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-bold text-white sm:text-base md:text-lg">
                  Group: {groupName}
                </h1>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 sm:h-2 sm:w-2" />

                  <span className="truncate text-[11px] text-slate-400 sm:text-xs">
                    {username}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLeave}
              className="shrink-0 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Leave
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-950/70 px-2.5 py-3 sm:px-4 sm:py-5 md:px-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-2xl sm:h-16 sm:w-16">
                  💭
                </div>

                <h2 className="text-base font-semibold text-slate-300 sm:text-lg">
                  No messages yet
                </h2>

                <p className="mt-1 max-w-xs text-xs text-slate-500 sm:text-sm">
                  Send a message below to start the
                  conversation.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender === username;

                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                      onClick={() => {
                        if (!isMe) {
                          handleReadMessage(msg.id);
                        }
                      }}
                    >
                      <div
                        className={`flex min-w-0 max-w-[90%] flex-col ${
                          isMe ? "items-end" : "items-start"
                        } sm:max-w-[78%] md:max-w-[70%]`}
                      >
                        {!isMe && (
                          <span className="mb-1 max-w-full truncate px-1 text-[11px] font-semibold text-indigo-400 sm:text-xs">
                            {msg.sender}
                          </span>
                        )}

                        <div
                          className={`min-w-0 max-w-full rounded-2xl px-3 py-2 shadow-sm sm:px-3.5 sm:py-2.5 ${
                            isMe
                              ? "rounded-br-md bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
                              : "rounded-bl-md border border-slate-800 bg-slate-900 text-slate-300"
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap text-sm leading-relaxed sm:text-[15px]">
                            {msg.text}
                          </p>

                          <div className="mt-1 flex items-center justify-end gap-1">
                            <span
                              className={`text-[9px] sm:text-[10px] ${
                                isMe
                                  ? "text-indigo-100"
                                  : "text-slate-500"
                              }`}
                            >
                              {msg.time}
                            </span>

                            {isMe && (
                              <span
                                className={`text-[10px] font-bold sm:text-xs ${
                                  msg.status === "read"
                                    ? "text-cyan-300"
                                    : "text-indigo-100"
                                }`}
                              >
                                {msg.status === "sent" ? "✓" : "✓✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} className="h-px" />
              </div>
            )}
          </div>

          <div className="relative shrink-0 border-t border-slate-800 bg-slate-900 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:p-3 sm:pb-3 md:p-4">
            <form
              onSubmit={handleSendMessage}
              className="flex w-full items-center gap-1.5 sm:gap-2.5"
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 sm:px-4 sm:py-3"
              />

              <button
                type="submit"
                disabled={!message.trim()}
                className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:from-indigo-600 hover:to-violet-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-3 md:px-6"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}