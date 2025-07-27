import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import ScrollToBottom from "react-scroll-to-bottom";
import IconSendFill from "./IconSendFill";

interface Props {
  socket: Socket;
  username: string;
  room: string;
}

interface Message {
  room: string;
  id: string | undefined;
  author: string;
  message: string;
  time: string;
}

const Chat = ({ socket, username, room }: Props) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState<Message[]>([]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;

      const message: Message = {
        room,
        id: socket.id,
        author: username,
        message: currentMessage,
        time: timeString,
      };

      setMessageList((prev) => [...prev, message]);
      await socket.emit("send_message", message);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data: Message) => {
      setMessageList((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket]);

  return (
    <div className="bg-white rounded-b-lg shadow-lg border-l border-r border-b border-gray-300">
      {/* Room Header */}
      <div className="bg-gray-100 border-b border-gray-300 py-4 px-6">
        <p className="text-gray-800 font-semibold text-center">Room: {room}</p>
      </div>

      {/* Messages Container */}
      <div className="h-[70vh] bg-gray-50">
        <ScrollToBottom
          className="w-full h-full overflow-x-hidden overflow-y-scroll"
          scrollViewClassName="flex flex-col p-4"
        >
          {messageList.map((message, index) => {
            return (
              <div
                key={index}
                className={`flex flex-col p-3 mb-3 rounded-lg max-w-[70%] sm:max-w-80 shadow-sm ${
                  message.id === socket.id
                    ? "bg-blue-500 text-white self-end"
                    : "bg-white border border-gray-200 text-gray-900 self-start"
                }`}
              >
                <p className="font-semibold text-sm mb-1">{message.author}</p>
                <p className="mb-2">{message.message}</p>
                <p className="text-xs opacity-70 text-right">{message.time}</p>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>

      {/* Input Container */}
      <div className="flex items-center bg-white border-t border-gray-300 p-4 rounded-b-lg">
        <input
          type="text"
          placeholder="Type your message..."
          onChange={(e) => setCurrentMessage(e.target.value)}
          value={currentMessage}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-3"
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <IconSendFill className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Chat;