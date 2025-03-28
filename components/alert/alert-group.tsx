"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

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
  const supabase = createClient()

  useEffect(() => {
    // Fetch alert details
    const fetchAlert = async () => {
      const { data: alertData } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', alertId)
        .single()

      if (alertData) {
        setAlert(alertData)
        setIsAdmin(alertData.created_by === userId)
      }
    }

    // Fetch crisis items
    const fetchItems = async () => {
      const { data: itemsData } = await supabase
        .from('crisis_items')
        .select('*')
        .eq('alert_id', alertId)

      if (itemsData) {
        setItems(itemsData)
      }
    }

    // Fetch messages
    const fetchMessages = async () => {
      const { data: messagesData } = await supabase
        .from('alert_messages')
        .select('*')
        .eq('alert_id', alertId)
        .order('created_at', { ascending: true })

      if (messagesData) {
        // Fetch reactions for each message
        const messagesWithReactions = await Promise.all(
          messagesData.map(async (message) => {
            const { data: reactionsData } = await supabase
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
    }

    fetchAlert()
    fetchItems()
    fetchMessages()

    // Subscribe to new messages
    const messagesSubscription = supabase
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
          const newMessage = payload.new as Message
          const { data: reactionsData } = await supabase
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
        }
      )
      .subscribe()

    // Subscribe to item updates
    const itemsSubscription = supabase
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
          const updatedItem = payload.new as CrisisItem
          setItems((prev) =>
            prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
          )
        }
      )
      .subscribe()

    return () => {
      messagesSubscription.unsubscribe()
      itemsSubscription.unsubscribe()
    }
  }, [alertId, userId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !isAdmin) return

    const { error } = await supabase.from('alert_messages').insert([
      {
        alert_id: alertId,
        content: newMessage.trim(),
        user_id: userId
      },
    ])

    if (!error) {
      setNewMessage("")
    }
  }

  const handleReaction = async (messageId: string, reaction: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    const hasReacted = message.reactions[reaction]?.includes(userId)
    if (hasReacted) {
      // Remove reaction
      const { error } = await supabase
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
      const { error } = await supabase.from('message_reactions').insert([
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

    const { error } = await supabase.from('item_claims').insert([
      {
        item_id: itemId,
        quantity: 1,
      },
    ])

    if (!error) {
      const { error: updateError } = await supabase
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
    <h1 className="text-3xl font-medium mb-8">Crisis Control</h1>
    <div className="py-8">
    {isAdmin && (
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">notify</Button>
      </form>
    )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Left column - Items */}
      <Card className="bg-red-100 border-none">
        <CardHeader>
          <CardTitle>Required Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg"
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
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Claim
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Right column - Messages */}
      <Card className="bg-red-200 border-none">
        <CardHeader>
          <CardTitle>Group Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-[400px] overflow-y-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="bg-white rounded-lg p-4 space-y-2"
                >
                  <div className="text-sm text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                  <div>{message.content}</div>
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
      </Card>
    </div>
    </>
  )
} 