import { useState, useEffect } from "react";
import axios from "axios";

export default function ChatApp() {
  const [username, setUsername] = useState("");
  const [groupName, setGroupName] = useState("");
  const [joined, setJoined] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

    async function fetchProducts() {
      try {
        const productRes = await axios.get("http://localhost:5050/products");
        console.log(productRes.data);
      } catch (err) {
        console.log(err);
      }
    }

    useEffect(() => {
    fetchProducts();
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();

    if (username.trim() && groupName.trim()) {
      setJoined(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: username,
        text: message,
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
    }
  };

  const handleLeave = () => {
    setJoined(false);
    setMessages([]);
    setMessage("");
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
                onChange={(e) => setGroupName(e.target.value)}
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
              <div className="space-y-4">

                {messages.map((msg) => {
                  const isMe = msg.sender === username;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[80%] flex-col ${
                          isMe ? "items-end" : "items-start"
                        } sm:max-w-[70%]`}
                      >

                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? "rounded-br-sm bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
                              : "rounded-bl-sm border border-slate-800 bg-slate-900 text-slate-300"
                          }`}
                        >
                          <span className="font-bold text-white">
                            {msg.sender}:
                          </span>{" "}
                          {msg.text}
                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>
            )}

          </div>

          <div className="border-t border-slate-800 bg-slate-900 p-3 sm:p-4">

            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 sm:gap-3"
            >

              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10"
              />

              <button
                type="submit"
                className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:from-indigo-600 hover:to-violet-700 active:scale-[0.97] sm:px-6"
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