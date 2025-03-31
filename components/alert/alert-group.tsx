"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp, Send } from "lucide-react"

interface AlertGroupProps {
  alertId: string
  userId: string
}

interface Alert {
  id: string
  title: string
  description: string
  category: string
  weather_event_type: string
  created_by: string
  created_at: string
}

interface CrisisItem {
  id: string
  name: string
  description: string
  quantity: number
  claimed_quantity: number
}

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  reactions: { [key: string]: string[] }
}

export function AlertGroup({ alertId, userId }: AlertGroupProps) {
  const [alert, setAlert] = useState<Alert | null>(null)
  const [items, setItems] = useState<CrisisItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAllItems, setShowAllItems] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Function to check if supabase is available
  const getSupabase = () => {
    if (!supabase) {
      setError("Could not connect to database. Please try refreshing the page.")
      throw new Error("Supabase client is not available")
    }
    return supabase
  }

  // Function to calculate and format duration since creation
  const formatDuration = (createdAt: string) => {
    if (!createdAt) return '';
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `Ongoing for ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Ongoing for ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return `Ongoing for ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  // Function to format time in a relative "time ago" format
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      // For older messages, show the actual date
      const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric',
        year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined 
      };
      return date.toLocaleDateString(undefined, options);
    }
  };

  // Function to toggle showing all items
  const toggleShowAllItems = () => {
    setShowAllItems(!showAllItems);
  };

  // Determine which items to display based on showAllItems state
  const displayedItems = showAllItems ? items : items.slice(0, 3);
  const hasMoreItems = items.length > 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const db = getSupabase() // This will throw if supabase is null
        
        // Fetch alert details
        const { data: alertData } = await db
          .from('alerts')
          .select('*')
          .eq('id', alertId)
          .single()

        if (alertData) {
          setAlert(alertData)
          setIsAdmin(alertData.created_by === userId)
        }

        // Fetch crisis items
        const { data: itemsData } = await db
          .from('crisis_items')
          .select('*')
          .eq('alert_id', alertId)

        if (itemsData) {
          setItems(itemsData)
        }

        // Fetch messages
        const { data: messagesData } = await db
          .from('alert_messages')
          .select('*')
          .eq('alert_id', alertId)
          .order('created_at', { ascending: true })

        if (messagesData) {
          // Fetch reactions for each message
          const messagesWithReactions = await Promise.all(
            messagesData.map(async (message) => {
              const { data: reactionsData } = await db
                .from('message_reactions')
                .select('reaction, user_id')
                .eq('message_id', message.id)

              const reactions: { [key: string]: string[] } = {}
              if (reactionsData) {
                reactionsData.forEach((reaction) => {
                  if (!reactions[reaction.reaction]) {
                    reactions[reaction.reaction] = []
                  }
                  reactions[reaction.reaction].push(reaction.user_id)
                })
              }

              return {
                ...message,
                reactions,
              }
            })
          )

          setMessages(messagesWithReactions)
        }

        // Subscribe to new messages
        const messagesSubscription = db
          .channel('alert_messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'alert_messages',
              filter: `alert_id=eq.${alertId}`,
            },
            async (payload) => {
              try {
                const newMessage = payload.new as Message
                const db = getSupabase()
                const { data: reactionsData } = await db
                  .from('message_reactions')
                  .select('reaction, user_id')
                  .eq('message_id', newMessage.id)

                const reactions: { [key: string]: string[] } = {}
                if (reactionsData) {
                  reactionsData.forEach((reaction) => {
                    if (!reactions[reaction.reaction]) {
                      reactions[reaction.reaction] = []
                    }
                    reactions[reaction.reaction].push(reaction.user_id)
                  })
                }

                setMessages((prev) => [...prev, { ...newMessage, reactions }])
              } catch (err) {
                console.error("Error in message subscription:", err)
              }
            }
          )
          .subscribe()

        // Subscribe to item updates
        const itemsSubscription = db
          .channel('crisis_items')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'crisis_items',
              filter: `alert_id=eq.${alertId}`,
            },
            (payload) => {
              try {
                const updatedItem = payload.new as CrisisItem
                setItems((prev) =>
                  prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
                )
              } catch (err) {
                console.error("Error in item subscription:", err)
              }
            }
          )
          .subscribe()

        return () => {
          messagesSubscription.unsubscribe()
          itemsSubscription.unsubscribe()
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data. Please try refreshing the page.")
        return () => {}  // Empty cleanup function for error case
      }
    }

    fetchData()
  }, [alertId, userId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    
    try {
      setError(null) // Clear any previous errors
      const db = getSupabase() // This will throw if supabase is null
      
      // First insert the message in the database
      const { data: messageData, error } = await db
        .from('alert_messages')
        .insert([
          {
            alert_id: alertId,
            content: newMessage.trim(),
            user_id: userId
          },
        ]).select()

      if (error) {
        console.error("Error saving message:", error)
        setError(`Failed to send message: ${error.message}`)
        return
      }

      // Clear the input field after successful message insert
      setNewMessage("")

      // Then, if we have the message ID, send notifications via the API
      if (messageData && messageData[0]) {
        try {
          const notifyResponse = await fetch('/api/send-group-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              alertId,
              messageText: newMessage.trim(),
            }),
          })

          if (!notifyResponse.ok) {
            // Non-blocking error - the message is already saved
            console.warn('Failed to send notifications:', await notifyResponse.text())
          }
        } catch (notifyError) {
          // Non-blocking error - the message is already saved
          console.error('Error sending notifications:', notifyError)
        }
      }
    } catch (err) {
      console.error("Error in handleSendMessage:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  const handleReaction = async (messageId: string, reaction: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    const hasReacted = message.reactions[reaction]?.includes(userId)
    if (hasReacted) {
      // Remove reaction
      const { error } = await getSupabase()
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('reaction', reaction)

      if (!error) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId) {
              return {
                ...m,
                reactions: {
                  ...m.reactions,
                  [reaction]: m.reactions[reaction].filter((id) => id !== userId),
                },
              }
            }
            return m
          })
        )
      }
    } else {
      // Add reaction
      const { error } = await getSupabase()
        .from('message_reactions')
        .insert([
          {
            message_id: messageId,
            reaction,
          },
        ])

      if (!error) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId) {
              return {
                ...m,
                reactions: {
                  ...m.reactions,
                  [reaction]: [...(m.reactions[reaction] || []), userId],
                },
              }
            }
            return m
          })
        )
      }
    }
  }

  const handleClaimItem = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item || item.claimed_quantity >= item.quantity) return

    const { error } = await getSupabase()
      .from('item_claims')
      .insert([
        {
          item_id: itemId,
          quantity: 1,
        },
      ])

    if (!error) {
      const { error: updateError } = await getSupabase()
        .from('crisis_items')
        .update({ claimed_quantity: item.claimed_quantity + 1 })
        .eq('id', itemId)

      if (!updateError) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, claimed_quantity: i.claimed_quantity + 1 }
              : i
          )
        )
      }
    }
  }

  return (
    <>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex flex-col relative w-full">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-medium">Crisis Control</h1>
              {alert && alert.created_at && (
                <div className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                  {formatDuration(alert.created_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-5xl py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Items */}
            <Card className="bg-[rgb(92, 210, 134)] border-2 border-black shadow-lg">
              <CardHeader>
                <CardTitle>Community Offered Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border-2 border-black bg-white"
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.description}
                        </div>
                        <div className="text-sm mt-1">
                          Available: {item.quantity - item.claimed_quantity} / {item.quantity}
                        </div>
                      </div>
                      {item.claimed_quantity < item.quantity && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClaimItem(item.id)}
                          className="bg-green-600 hover:bg-green-700 text-white transform transition-transform hover:translate-x-1 hover:translate-y-1 rounded-none border-none"
                        >
                          Claim
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {hasMoreItems && (
                    <Button 
                      variant="outline" 
                      onClick={toggleShowAllItems}
                      className="w-full mt-2 flex items-center justify-center bg-white hover:bg-gray-100"
                    >
                      {showAllItems ? (
                        <>
                          <span className="mr-2">Show Less</span>
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <span className="mr-2">Show {items.length - 3} More</span>
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Right column - Messages */}
            <Card className="bg-[rgb(255,100,92)] border-2 border-black shadow-lg flex flex-col">
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="h-[350px] overflow-y-auto space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="bg-white p-4 space-y-2 border-2 border-black relative"
                      >
                        <div className="absolute top-2 right-3 text-xs text-muted-foreground">
                          {formatRelativeTime(message.created_at)}
                        </div>
                        <div className="mt-4">{message.content}</div>
                        <div className="flex gap-2">
                          {Object.entries(message.reactions).map(([reaction, users]) => (
                            <Button
                              key={reaction}
                              variant={users.includes(userId) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleReaction(message.id, reaction)}
                              className={users.includes(userId) ? "bg-red-600 hover:bg-red-700 text-white" : "hover:bg-red-100"}
                            >
                              {reaction} ({users.length})
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              {isAdmin && (
                <CardFooter className="border-t border-black pt-3">
                  <form onSubmit={handleSendMessage} className="w-full flex gap-2">
                    <Input 
                      type="text" 
                      placeholder="Send a notification to the group..." 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      className="flex-1 border-2 border-black"
                    />
                    <Button 
                      type="submit" 
                      className="bg-white hover:bg-gray-100 border-2 border-black text-black"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                  </form>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  )
} 