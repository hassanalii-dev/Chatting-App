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

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);

  const [viewer, setViewer] = useState(null);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const documentInputRef = useRef(null);

  useEffect(() => {
    const receiveMessage = (incomingMessage) => {
      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (msg) => msg.id === incomingMessage.id
        );

        if (alreadyExists) {
          return prevMessages;
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
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setViewer(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();

    if (username.trim() && groupName.trim()) {
      socket.emit("join", groupName.trim());
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
      text: message,
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
    setShowAttachmentMenu(false);
    setViewer(null);
  };

  const handleReadMessage = (messageId) => {
    socket.emit("read", {
      messageId,
      room: groupName,
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 Bytes";
    }

    const units = [
      "Bytes",
      "KB",
      "MB",
      "GB",
    ];

    const index = Math.floor(
      Math.log(bytes) / Math.log(1024)
    );

    return `${parseFloat(
      (bytes / Math.pow(1024, index)).toFixed(2)
    )} ${units[index]}`;
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith("image/")) {
      return "🖼️";
    }

    if (fileType?.startsWith("video/")) {
      return "🎥";
    }

    if (fileType?.startsWith("audio/")) {
      return "🎵";
    }

    if (
      fileType?.includes("pdf") ||
      fileType?.includes("document") ||
      fileType?.includes("word") ||
      fileType?.includes("text")
    ) {
      return "📄";
    }

    if (
      fileType?.includes("zip") ||
      fileType?.includes("rar") ||
      fileType?.includes("compressed")
    ) {
      return "🗜️";
    }

    return "📎";
  };

  const convertFileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(new Error("File reading failed"));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      alert("Maximum file size 30MB hai.");
      e.target.value = "";
      return;
    }

    setShowAttachmentMenu(false);
    setSendingFile(true);

    try {
      const dataUrl = await convertFileToDataURL(file);

      const fileMessage = {
        id: Date.now() + Math.random(),
        sender: username,
        room: groupName,
        type: "file",

        fileName: file.name,
        fileType:
          file.type || "application/octet-stream",
        fileSize: file.size,
        fileData: dataUrl,

        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        status: "delivered",
      };

      socket.emit("send", fileMessage);

      setMessages((prevMessages) => [
        ...prevMessages,
        fileMessage,
      ]);
    } catch (error) {
      console.error("File send error:", error);
      alert("File send nahi ho saki.");
    }

    setSendingFile(false);
    e.target.value = "";
  };

  const openViewer = (msg) => {
    if (!msg.fileType) {
      return;
    }

    if (
      msg.fileType.startsWith("image/") ||
      msg.fileType.startsWith("video/") ||
      msg.fileType.startsWith("audio/")
    ) {
      setViewer(msg);
    }
  };

  const closeViewer = () => {
    setViewer(null);
  };

  const renderFileMessage = (msg) => {
    if (msg.fileType?.startsWith("image/")) {
      return (
        <div className="overflow-hidden rounded-xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openViewer(msg);
            }}
            className="block w-full cursor-pointer"
          >
            <img
              src={msg.fileData}
              alt={msg.fileName}
              className="max-h-80 w-full rounded-xl object-contain transition hover:opacity-90"
            />
          </button>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {msg.fileName}
              </p>

              <p className="text-[10px] opacity-70">
                {formatFileSize(msg.fileSize)}
              </p>
            </div>

            <a
              href={msg.fileData}
              download={msg.fileName}
              className="rounded-lg bg-black/20 px-3 py-1.5 text-xs font-semibold hover:bg-black/30"
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
          </div>
        </div>
      );
    }

    if (msg.fileType?.startsWith("video/")) {
      return (
        <div className="max-w-sm">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openViewer(msg);
            }}
            className="relative block w-full cursor-pointer overflow-hidden rounded-xl"
          >
            <video
              src={msg.fileData}
              className="max-h-80 w-full rounded-xl object-contain"
              preload="metadata"
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition hover:opacity-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl text-slate-900 shadow-xl">
                ▶
              </div>
            </div>
          </button>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {msg.fileName}
              </p>

              <p className="text-[10px] opacity-70">
                {formatFileSize(msg.fileSize)}
              </p>
            </div>

            <a
              href={msg.fileData}
              download={msg.fileName}
              className="rounded-lg bg-black/20 px-3 py-1.5 text-xs font-semibold hover:bg-black/30"
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
          </div>
        </div>
      );
    }

    if (msg.fileType?.startsWith("audio/")) {
      return (
        <div className="min-w-[240px] max-w-sm">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openViewer(msg);
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition hover:bg-black/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/20 text-2xl">
              🎵
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">
                {msg.fileName}
              </p>

              <p className="mt-1 text-[10px] opacity-70">
                {formatFileSize(msg.fileSize)}
              </p>

              <p className="mt-1 text-[10px] opacity-60">
                Click to play
              </p>
            </div>
          </button>

          <a
            href={msg.fileData}
            download={msg.fileName}
            className="mt-2 inline-block rounded-lg bg-black/20 px-3 py-1.5 text-xs font-semibold hover:bg-black/30"
            onClick={(e) => e.stopPropagation()}
          >
            Download
          </a>
        </div>
      );
    }

    return (
      <div className="flex min-w-[230px] max-w-sm items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/20 text-2xl">
          {getFileIcon(msg.fileType)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {msg.fileName}
          </p>

          <p className="mt-1 text-[10px] opacity-70">
            {formatFileSize(msg.fileSize)}
          </p>

          <a
            href={msg.fileData}
            download={msg.fileName}
            className="mt-2 inline-block rounded-lg bg-black/20 px-3 py-1.5 text-xs font-semibold hover:bg-black/30"
            onClick={(e) => e.stopPropagation()}
          >
            Download
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-6 sm:py-10">

      {!joined ? (
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">

          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <img
                src="/image copy 3.png"
                alt="Chat Logo"
                className="h-full w-full rounded-2xl object-cover"
              />
            </div>

            <h1 className="text-2xl font-bold text-white">
              Chatting App
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Join a group and start chatting
            </p>
          </div>

          <form
            onSubmit={handleJoin}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Username
              </label>

              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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
                onChange={(e) =>
                  setGroupName(e.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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
      ) : (
        <div className="flex h-[620px] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">

          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-4 sm:px-6">

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                <img
                  src="/image copy 3.png"
                  alt="Chat Logo"
                  className="h-full w-full rounded-xl object-cover"
                />
              </div>

              <div className="min-w-0">

                <h1 className="truncate text-base font-bold text-white sm:text-lg">
                  Group: {groupName}
                </h1>

                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="truncate text-xs text-slate-400">
                    {username}
                  </span>
                </div>

              </div>

            </div>

            <button
              onClick={handleLeave}
              className="shrink-0 rounded-xl bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 active:scale-95 sm:px-5"
            >
              Leave
            </button>

          </div>

          <div className="flex-1 overflow-y-auto bg-slate-950/70 p-4 sm:p-6">

            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-2xl">
                  💭
                </div>

                <h2 className="text-base font-semibold text-slate-300">
                  No messages yet
                </h2>

                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  Send a message below to start the conversation.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {messages.map((msg) => {
                  const isMe =
                    msg.sender === username;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMe
                          ? "justify-end"
                          : "justify-start"
                      }`}
                      onClick={() => {
                        if (!isMe) {
                          handleReadMessage(msg.id);
                        }
                      }}
                    >

                      <div
                        className={`${
                          isMe
                            ? "items-end"
                            : "items-start"
                        } flex max-w-[82%] flex-col sm:max-w-[70%]`}
                      >

                        {!isMe && (
                          <span className="mb-1 px-1 text-xs font-semibold text-indigo-400">
                            {msg.sender}
                          </span>
                        )}

                        <div
                          className={`rounded-2xl px-3 py-2 shadow-sm ${
                            isMe
                              ? "rounded-br-md bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
                              : "rounded-bl-md border border-slate-800 bg-slate-900 text-slate-300"
                          }`}
                        >

                          {msg.type === "file" ? (
                            renderFileMessage(msg)
                          ) : (
                            <p className="break-words text-sm leading-relaxed">
                              {msg.text}
                            </p>
                          )}

                          <div className="mt-1 flex items-center justify-end gap-1">

                            <span
                              className={`text-[10px] ${
                                isMe
                                  ? "text-indigo-100"
                                  : "text-slate-500"
                              }`}
                            >
                              {msg.time}
                            </span>

                            {isMe && (
                              <span
                                className={`text-xs font-bold ${
                                  msg.status === "read"
                                    ? "text-cyan-300"
                                    : "text-indigo-100"
                                }`}
                              >
                                {msg.status === "sent"
                                  ? "✓"
                                  : "✓✓"}
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>

          <div className="relative border-t border-slate-800 bg-slate-900 p-3 sm:p-4">

            {showAttachmentMenu && (
              <div className="absolute bottom-20 left-3 z-50 w-56 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-2xl">

                <button
                  type="button"
                  onClick={() =>
                    imageInputRef.current?.click()
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white hover:bg-slate-700"
                >
                  <span className="text-xl">
                    📷
                  </span>

                  <span>
                    Photos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    videoInputRef.current?.click()
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white hover:bg-slate-700"
                >
                  <span className="text-xl">
                    🎥
                  </span>

                  <span>
                    Videos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    audioInputRef.current?.click()
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white hover:bg-slate-700"
                >
                  <span className="text-xl">
                    🎵
                  </span>

                  <span>
                    Audio
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    documentInputRef.current?.click()
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white hover:bg-slate-700"
                >
                  <span className="text-xl">
                    📄
                  </span>

                  <span>
                    Document
                  </span>
                </button>

              </div>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <input
              ref={documentInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />

            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 sm:gap-3"
            >

              <button
                type="button"
                disabled={sendingFile}
                onClick={() =>
                  setShowAttachmentMenu(
                    (prev) => !prev
                  )
                }
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-xl text-slate-300 transition hover:bg-slate-700 active:scale-95 disabled:opacity-50"
              >
                📎
              </button>

              <input
                type="text"
                placeholder={
                  sendingFile
                    ? "Sending file..."
                    : "Type a message..."
                }
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                disabled={sendingFile}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={sendingFile}
                className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:from-indigo-600 hover:to-violet-700 active:scale-[0.97] disabled:opacity-50 sm:px-6"
              >
                Send
              </button>

            </form>

          </div>

        </div>
      )}

      {viewer && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={closeViewer}
        >

          <div
            className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 py-5 sm:px-6"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="min-w-0">

              <p className="max-w-[220px] truncate text-sm font-semibold text-white sm:max-w-md">
                {viewer.fileName}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {formatFileSize(viewer.fileSize)}
              </p>

            </div>

            <div className="flex items-center gap-2">

              <a
                href={viewer.fileData}
                download={viewer.fileName}
                className="flex h-10 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                ⬇️ Download
              </a>

              <button
                type="button"
                onClick={closeViewer}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-white transition hover:bg-white/20"
              >
                ✕
              </button>

            </div>

          </div>

          {viewer.fileType?.startsWith("image/") && (
            <img
              src={viewer.fileData}
              alt={viewer.fileName}
              className="max-h-[85vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            />
          )}

          {viewer.fileType?.startsWith("video/") && (
            <video
              src={viewer.fileData}
              controls
              autoPlay
              className="max-h-[85vh] max-w-[95vw] rounded-xl shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            />
          )}

          {viewer.fileType?.startsWith("audio/") && (
            <div
              className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-4xl shadow-lg">
                🎵
              </div>

              <h2 className="mb-2 truncate text-center text-lg font-bold text-white">
                {viewer.fileName}
              </h2>

              <p className="mb-6 text-center text-sm text-slate-400">
                {formatFileSize(viewer.fileSize)}
              </p>

              <audio
                src={viewer.fileData}
                controls
                autoPlay
                className="w-full"
              />

            </div>
          )}

        </div>
      )}

    </div>
  );
}