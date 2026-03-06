"use client"

import type React from "react"
import type { User } from "@/lib/auth"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Send, Bot, UserIcon, Loader2, MessageSquare, Sparkles, Paperclip, X } from "lucide-react"
import { database } from "@/lib/database"
import { RetroGrid } from "@/components/ui/hero-section"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

interface UIMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  attachment?: string
}

interface ChatInterfaceProps {
  user: User
}

export function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialize session
  useEffect(() => {
    initializeSession()
  }, [user.id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const initializeSession = async () => {
    try {
      const session = await database.createSession(user.id)
      setCurrentSessionId(session.id)

      // Load existing messages for this session
      const existingMessages = await database.getSessionMessages(session.id)
      setMessages(
        existingMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
        })),
      )
    } catch (error) {
      console.error("Error initializing session:", error)
      toast({
        title: "Session Error",
        description: "Failed to initialize chat session",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setAttachment(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const sendMessage = async () => {
    if ((!input.trim() && !attachment) || loading || !currentSessionId) return

    const userMessage = input.trim()
    const currentAttachment = attachment

    setInput("")
    setAttachment(null)
    setLoading(true)

    try {
      // Add user message locally with attachment
      const newMessage: UIMessage = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
        timestamp: new Date(),
        attachment: currentAttachment || undefined,
      }
      setMessages((prev) => [...prev, newMessage])

      // Save user message to database
      await database.createMessage({
        session_id: currentSessionId,
        role: "user",
        content: userMessage,
      })

      // Call Gemini API
      const response = await callGeminiAPI(userMessage, currentAttachment)

      // Add AI response locally
      const aiMsg: UIMessage = {
        id: (Date.now() + 1).toString(), // Temporary ID for local display
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])

      // Save AI message to database
      await database.createMessage({
        session_id: currentSessionId,
        role: "assistant",
        content: response,
      })

    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const callGeminiAPI = async (prompt: string, imageBase64?: string | null): Promise<string> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""

      const contents = [
        {
          role: "user",
          parts: [
            {
              text: `You are an AI tutor helping students with their academic questions. Please provide clear, educational, and helpful responses. Be encouraging and supportive while maintaining accuracy. 
${imageBase64 ? "The student has uploaded an image. Please analyze it and help with any questions related to it." : ""}
Student question: ${prompt}

Please provide a comprehensive response that includes:
- Clear explanations of key concepts
- Step-by-step solutions when applicable
- Relevant examples to illustrate points
- Follow-up questions or suggestions for further learning

Keep your response engaging and educational.`,
            },
          ],
        },
      ]

      if (imageBase64) {
        // Extract base64 data (remove header "data:image/jpeg;base64,")
        const base64Data = imageBase64.split(",")[1]
        // @ts-ignore - allow inlineData property
        contents[0].parts.push({
          inlineData: {
            mimeType: "image/jpeg", // Assuming JPEG or PNG, Gemini handles multiple
            data: base64Data
          }
        })
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Gemini API Error:", errorData)

        if (response.status === 400) {
          throw new Error("Invalid request to Gemini API. Please check your question and try again.")
        } else if (response.status === 403) {
          throw new Error("API key access denied. Please check your Gemini API configuration.")
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before asking another question.")
        } else {
          throw new Error(`API request failed with status ${response.status}`)
        }
      }

      const data = await response.json()

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text
      } else if (data.error) {
        throw new Error(data.error.message || "Unknown API error")
      } else {
        throw new Error("Invalid response format from Gemini API")
      }
    } catch (error) {
      console.error("Gemini API Error:", error)

      if (error instanceof Error) {
        return `I apologize, but I encountered an issue: ${error.message}

Please try rephrasing your question or ask about a different topic. If the problem persists, it might be a temporary API issue.`
      }

      return "I apologize, but I'm having trouble processing your request right now. This could be due to a temporary issue with the AI service. Please try again in a moment, or rephrase your question."
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <RetroGrid opacity={0.2} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 z-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Tutor Chat</h1>
          <p className="text-gray-600 dark:text-gray-400">Ask me anything about your studies</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          <Sparkles className="h-4 w-4 mr-1" />
          Gemini AI
        </Badge>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 z-10 relative">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to AI Tutor!</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
                I'm powered by Google's Gemini AI and here to help you with any academic questions. Ask me about:
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                <Badge variant="outline">Mathematics</Badge>
                <Badge variant="outline">Science</Badge>
                <Badge variant="outline">History</Badge>
                <Badge variant="outline">Literature</Badge>
                <Badge variant="outline">Programming</Badge>
                <Badge variant="outline">Languages</Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gradient-to-br from-purple-500 to-indigo-500 text-white"
                      }
                  `}
                  >
                    {message.role === "user" ? <UserIcon className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>

                  <Card
                    className={`
                    max-w-[80%] border-0 shadow-sm
                    ${message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800"}
                  `}
                  >
                    <CardContent className="p-4">
                      {/* Show attachment if present */}
                      {message.attachment && (
                        <div className="mb-3 rounded-md overflow-hidden">
                          <img
                            src={message.attachment}
                            alt="Attachment"
                            className="max-w-full h-auto max-h-60 object-contain bg-black/10"
                          />
                        </div>
                      )}

                      <div className={`text-sm leading-relaxed ${message.role === "user" ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            code: ({ className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || '')
                              return !match ? (
                                <code className={`${className} bg-black/10 px-1 rounded`} {...props}>
                                  {children}
                                </code>
                              ) : (
                                <div className="my-2 rounded-md overflow-hidden bg-black/90 p-3 text-white">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </div>
                              )
                            }
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <p
                        className={`
                        text-xs mt-2 opacity-70
                        ${message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}
                      `}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <Card className="bg-gray-100 dark:bg-gray-800 border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">AI Tutor is thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            {attachment && (
              <div className="relative inline-block self-start">
                <div className="w-20 h-20 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img src={attachment} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => setAttachment(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
              />

              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question or upload an image..."
                disabled={loading}
                className="flex-1 h-12 text-base"
              />
              <Button
                onClick={sendMessage}
                disabled={(!input.trim() && !attachment) || loading}
                size="lg"
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Press Enter to send, Shift+Enter for new line • Powered by Gemini AI
          </p>
        </div>
      </div>
    </div>
  )
}
