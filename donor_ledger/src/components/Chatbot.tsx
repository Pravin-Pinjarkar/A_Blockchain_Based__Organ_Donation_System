import { useState, useEffect, useRef } from "react";
import { X, Minus, Maximize2, Minimize2 } from "lucide-react";
import { Mic } from "lucide-react";
const API_URL = "http://localhost:5000";

export default function Chatbot({ currentShipment, setShowChatbot }: any) {
  // LOAD CHAT HISTORY
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved
      ? JSON.parse(saved)
      : [{ sender: "bot", text: "Hi I can help you with organ donation!" }];
  });

  const [input, setInput] = useState("");
  const [isFull, setIsFull] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // ✅ default minimized
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<any>(null);

  // 💾 SAVE CHAT
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  // 🔽 AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔊 STOP VOICE
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
  };

  // 🔊 SPEAK
  const speak = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  // 🎤 VOICE INPUT
  const startListening = () => {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";

  setIsListening(true); // 🔥 START ANIMATION

  recognition.onresult = (event: any) => {
    setInput(event.results[0][0].transcript);
  };

  recognition.onend = () => {
    setIsListening(false); // 🔥 STOP ANIMATION
  };

  recognition.start();
};

  // ✨ FORMAT
  const formatReply = (text: string) =>
    text.replace(/\n/g, "\n\n").replace(/\*\*(.*?)\*\*/g, "$1");

  // 📩 SEND MESSAGE
  const sendMessage = async () => {
    if (!input) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev: any) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          shipment: currentShipment
        })
      });

      const data = await res.json();

      setIsTyping(false);

      const reply = formatReply(data.reply || "No response");

      const botMsg = { sender: "bot", text: reply };
      setMessages((prev: any) => [...prev, botMsg]);

      speak(reply);

    } catch {
      setIsTyping(false);
      setMessages((prev: any) => [
        ...prev,
        { sender: "bot", text: "Error connecting to AI" }
      ]);
    }

    setInput("");
  };

  return (
    <div
  className={`fixed ${
    isFull
      ? "top-0 right-0 w-full h-full"
      : isMinimized
      ? "bottom-6 right-6 w-64 h-16"
      : "bottom-6 right-6 w-80 h-[420px]"
  } bg-white shadow-2xl rounded-xl p-4 z-50 flex flex-col transition-all duration-300`}
>
  {/* HEADER */}
  <div
    className="flex justify-between items-center cursor-pointer"
    onClick={() => setIsMinimized(false)}
  >
    <div className="font-bold text-[#E51845]">OrganAI</div>

    <div className="flex gap-2">
      {/* MINIMIZE */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMinimized(true);
          setIsFull(false);
        }}
        className="hover:bg-gray-200 p-1 rounded"
      >
        <Minus size={16} />
      </button>

      {/* FULLSCREEN */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsFull(!isFull);
          setIsMinimized(false); // 🔥 KEY FIX
        }}
        className="hover:bg-gray-200 p-1 rounded"
      >
        {isFull ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      {/* CLOSE */}
          <button
        onClick={(e) => {
            e.stopPropagation();
            stopSpeech();
            setShowChatbot(false);
        }}
        >
        <X size={16} />
        </button>
                    
    </div>
  </div>

  {/* CHAT */}
  {(!isMinimized || isFull) && (
    <>
      <div className="flex-1 overflow-y-auto mt-2 space-y-2">
        {messages.map((msg: any, i: number) => (
          <div key={i} className={msg.sender === "user" ? "text-right" : "text-left"}>
            <span
              className={`px-3 py-2 rounded-lg inline-block whitespace-pre-line ${
                msg.sender === "user"
                  ? "bg-[#E51845] text-white"
                  : "bg-gray-200"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="text-left">
            <span className="px-3 py-2 bg-gray-200 rounded-lg animate-pulse">
              AI is typing...
            </span>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT */}
      <div className="flex gap-2 mt-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="flex-1 border rounded px-2 py-1 resize-none"
          placeholder="Ask about organ..."
          rows={1}
          onInput={(e: any) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
        />

        <button
          onClick={startListening}
          className={`relative flex items-center justify-center px-2 rounded transition ${
          isListening
            ? "bg-red-500 text-white mic-active"
            : "bg-gray-200"
        }`}
        >
          <Mic size={18} />

          {/* 🔥 PULSE RING (Google Meet Style) */}
          {isListening && (
            <span className="absolute inline-flex h-8 w-8 rounded-full bg-red-400 opacity-75 animate-ping"></span>
          )}
        </button>

        <button
          onClick={sendMessage}
          className="bg-[#E51845] text-white px-3 rounded"
        >
          Send
        </button>
      </div>
    </>
  )}
</div>
  );
}