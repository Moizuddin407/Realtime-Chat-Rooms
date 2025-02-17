"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, SmilePlus, Moon, Sun, Loader2, Hash, Users, Settings, LogOut } from "lucide-react"
import { useTheme } from "./providers/theme-provider"

type Message = {
  id: string
  text: string
  sender: {
    username: string
  }
  createdAt: string
  reactions: Record<string, string[]>
}

type UserStatus = "online" | "away" | "offline"

type RoomUser = {
  username: string;
  status: string;
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?"

  return (
    <div
      className="rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  )
}

export default function ChatRoom() {
  const { theme, setTheme } = useTheme()
  const [roomId, setRoomId] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [username, setUsername] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [userStatus, setUserStatus] = useState<UserStatus>("online")
  const [isJoining, setIsJoining] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  useEffect(() => {
    if (hasJoined) {
      const eventSource = new EventSource('/api/events')
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'message') {
            setMessages(prev => [...prev, data.message])
          }
        } catch (error) {
          console.error('Error processing message:', error)
        }
      }
      
      // Load existing messages
      fetch(`/api/messages?roomId=${roomId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Loaded messages:', data)
          setMessages(data)
        })
        .catch(err => console.error('Error loading messages:', err))
      
      return () => {
        eventSource.close()
      }
    }
  }, [hasJoined, roomId])

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim() && roomId.trim().length >= 3) {
      setIsJoining(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessages([
        {
          id: Date.now().toString(),
          text: `Welcome to room ${roomId}, ${username}!`,
          sender: { username },
          createdAt: new Date().toISOString(),
          reactions: {},
        },
      ])
      setIsJoining(false)
      setHasJoined(true)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() !== '') {
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: inputMessage,
            sender: username,
            roomId
          })
        })
        
        if (!res.ok) throw new Error('Failed to send message')
        
        setInputMessage('')
        setIsTyping(false)
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
    setIsTyping(e.target.value !== "")
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("File selected:", file.name)
      const newMessage: Message = {
        id: Date.now().toString(),
        text: `Uploaded file: ${file.name}`,
        sender: { username },
        createdAt: new Date().toISOString(),
        reactions: {},
      }
      setMessages([...messages, newMessage])
    }
  }

  const addEmoji = (emoji: string) => {
    setInputMessage(inputMessage + emoji)
    setShowEmojiPicker(false)
  }

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(
      messages.map((message) => {
        if (message.id === messageId) {
          const updatedReactions = { ...message.reactions }
          if (updatedReactions[emoji]) {
            updatedReactions[emoji] = [...updatedReactions[emoji], username]
          } else {
            updatedReactions[emoji] = [username]
          }
          return { ...message, reactions: updatedReactions }
        }
        return message
      }),
    )
  }

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('RoomId changing:', e.target.value);
    setRoomId(e.target.value);
  };

  const handleStatusChange = (status: UserStatus) => {
    setUserStatus(status)
  }

  if (!hasJoined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        <form
          onSubmit={(e) => {
            console.log('Form submitted');
            e.preventDefault();
            if (username.trim() && roomId.trim().length >= 3) {
              console.log('Conditions met, joining room');
              handleJoinRoom(e);
            } else {
              console.log('Validation failed:', {
                username: username.trim(),
                roomIdLength: roomId.trim().length
              });
            }
          }}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md w-full space-y-6"
        >
          <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white">Welcome to ChatRoom</h1>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="roomId" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Room ID
              </label>
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={handleRoomIdChange}
                onKeyDown={(e) => {
                  console.log('Key pressed:', e.key);
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                placeholder="Enter room ID"
                minLength={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isJoining || !username.trim() || roomId.trim().length < 3}
            onClick={(e) => {
              if (!username.trim() || roomId.trim().length < 3) {
                e.preventDefault();
                console.log('Button clicked but validation failed');
              }
            }}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              <span>Join Room</span>
            )}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {showSidebar && (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Channels</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button className="flex items-center space-x-2 w-full p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Hash className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-200">{roomId}</span>
            </button>
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Avatar name={username} size={40} />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userStatus}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Users in Room ({roomUsers.length})
            </h3>
            {roomUsers.map((user) => (
              <div 
                key={user.username}
                className="flex items-center space-x-2 mb-2"
              >
                <div className={`w-2 h-2 rounded-full ${
                  user.status === 'online' ? 'bg-green-500' :
                  user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                }`} />
                <span className="text-gray-700 dark:text-gray-300">
                  {user.username}
                  {user.username === username && " (you)"}
                </span>
              </div>
            ))}
          </div>
        </aside>
      )}
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Users className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">#{roomId}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={userStatus}
                onChange={(e) => handleStatusChange(e.target.value as UserStatus)}
                className="text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-200"
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender.username === username ? "justify-end" : "justify-start"
              } animate-in fade-in slide-in-from-bottom-4`}
            >
              <div className="flex flex-col space-y-2 max-w-xs lg:max-w-md">
                <div className="flex items-center space-x-2">
                  <Avatar name={message.sender.username} size={30} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {message.sender.username}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.sender.username === username
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  } shadow-md`}
                >
                  <p>{message.text}</p>
                </div>
                <div className="flex space-x-2">
                  {Object.entries(message.reactions).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      className="bg-gray-100 dark:bg-gray-600 rounded-full px-2 py-1 text-sm flex items-center space-x-1"
                      onClick={() => addReaction(message.id, emoji)}
                    >
                      <span>{emoji}</span>
                      <span>{users.length}</span>
                    </button>
                  ))}
                  <button
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => addReaction(message.id, "👍")}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>
        <footer className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            {isTyping && <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Someone is typing...</div>}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleFileUpload}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <SmilePlus className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-grow p-2 border rounded-l bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700 transition-colors"
              >
                <Send className="h-6 w-6" />
              </button>
            </form>
            {showEmojiPicker && (
              <div className="absolute bottom-16 right-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
                {["😊", "😂", "😍", "👍", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
