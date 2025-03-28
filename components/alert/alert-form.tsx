"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

const weatherEvents = [
  { value: "tornado", label: "Tornado" },
  { value: "flood", label: "Flood" },
  { value: "blizzard", label: "Blizzard" },
  { value: "polar_vortex", label: "Polar Vortex" },
  { value: "fire", label: "Fire" },
  { value: "hurricane", label: "Hurricane" },
  { value: "earthquake", label: "Earthquake" },
  { value: "tsunami", label: "Tsunami" },
  { value: "drought", label: "Drought" },
  { value: "heat_wave", label: "Heat Wave" },
]

const defaultItems = {
  tornado: [
    { name: "Emergency Radio", description: "Battery-powered radio for weather updates", quantity: 1 },
    { name: "First Aid Kit", description: "Basic medical supplies", quantity: 1 },
    { name: "Flashlight", description: "Battery-powered flashlight", quantity: 2 },
    { name: "Batteries", description: "Various sizes for devices", quantity: 10 },
    { name: "Water Bottles", description: "1 gallon per person per day", quantity: 5 },
    { name: "Non-perishable Food", description: "3 days worth per person", quantity: 3 },
    { name: "Emergency Blankets", description: "Space blankets for warmth", quantity: 4 },
    { name: "Whistle", description: "For signaling help", quantity: 1 },
    { name: "Dust Masks", description: "For protection from debris", quantity: 10 },
    { name: "Plastic Sheeting", description: "For temporary shelter", quantity: 1 },
  ],
  flood: [
    { name: "Sandbags", description: "For flood protection", quantity: 20 },
    { name: "Waterproof Boots", description: "For walking in water", quantity: 2 },
    { name: "Life Jackets", description: "For water safety", quantity: 2 },
    { name: "Waterproof Containers", description: "For important documents", quantity: 2 },
    { name: "Emergency Radio", description: "Water-resistant radio", quantity: 1 },
    { name: "First Aid Kit", description: "Waterproof medical supplies", quantity: 1 },
    { name: "Flashlight", description: "Water-resistant flashlight", quantity: 2 },
    { name: "Batteries", description: "Water-resistant batteries", quantity: 10 },
    { name: "Water Bottles", description: "1 gallon per person per day", quantity: 5 },
    { name: "Non-perishable Food", description: "3 days worth per person", quantity: 3 },
  ],
  blizzard: [
    { name: "Snow Shovel", description: "For clearing snow", quantity: 1 },
    { name: "Ice Scraper", description: "For vehicle windows", quantity: 2 },
    { name: "Winter Boots", description: "Waterproof winter boots", quantity: 2 },
    { name: "Winter Coats", description: "Heavy winter coats", quantity: 2 },
    { name: "Gloves", description: "Waterproof gloves", quantity: 4 },
    { name: "Hats", description: "Warm winter hats", quantity: 2 },
    { name: "Scarves", description: "Winter scarves", quantity: 2 },
    { name: "Emergency Radio", description: "For weather updates", quantity: 1 },
    { name: "First Aid Kit", description: "For medical emergencies", quantity: 1 },
    { name: "Flashlight", description: "For visibility", quantity: 2 },
  ],
  polar_vortex: [
    { name: "Space Heaters", description: "Portable heaters", quantity: 2 },
    { name: "Extra Blankets", description: "Heavy winter blankets", quantity: 4 },
    { name: "Winter Boots", description: "Extreme cold boots", quantity: 2 },
    { name: "Winter Coats", description: "Heavy winter coats", quantity: 2 },
    { name: "Gloves", description: "Extreme cold gloves", quantity: 4 },
    { name: "Hats", description: "Warm winter hats", quantity: 2 },
    { name: "Scarves", description: "Winter scarves", quantity: 2 },
    { name: "Emergency Radio", description: "For weather updates", quantity: 1 },
    { name: "First Aid Kit", description: "For medical emergencies", quantity: 1 },
    { name: "Flashlight", description: "For visibility", quantity: 2 },
  ],
  fire: [
    { name: "Fire Extinguisher", description: "ABC type fire extinguisher", quantity: 2 },
    { name: "Smoke Detectors", description: "Battery-powered smoke detectors", quantity: 3 },
    { name: "N95 Masks", description: "For smoke protection", quantity: 10 },
    { name: "Emergency Radio", description: "For updates", quantity: 1 },
    { name: "First Aid Kit", description: "For medical emergencies", quantity: 1 },
    { name: "Flashlight", description: "For visibility", quantity: 2 },
    { name: "Batteries", description: "For devices", quantity: 10 },
    { name: "Water Bottles", description: "1 gallon per person per day", quantity: 5 },
    { name: "Non-perishable Food", description: "3 days worth per person", quantity: 3 },
    { name: "Emergency Blankets", description: "For warmth", quantity: 4 },
  ],
}

export function AlertForm() {
  const router = useRouter()
  const [category, setCategory] = useState<string>("")
  const [weatherEvent, setWeatherEvent] = useState<string>("")
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({})
  const supabase = createClient()

  const handleItemQuantityChange = (itemName: string, value: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemName]: Math.max(0, value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError

      // Create group (name will be set automatically by trigger)
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{ created_by: user.id }])
        .select()
        .single()

      if (groupError) throw groupError

      // Create alert
      const { data: alertData, error: alertError } = await supabase
        .from('alerts')
        .insert([{
          group_id: groupData.id,
          category,
          weather_event_type: weatherEvent,
          title: `${weatherEvent.charAt(0).toUpperCase() + weatherEvent.slice(1)} Alert`,
          description: `Emergency alert for ${weatherEvent}`,
          created_by: user.id
        }])
        .select()
        .single()

      if (alertError) throw alertError

      // Create crisis items
      const items = defaultItems[weatherEvent as keyof typeof defaultItems] || []
      const crisisItems = items.map(item => ({
        alert_id: alertData.id,
        name: item.name,
        description: item.description,
        quantity: selectedItems[item.name] || item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('crisis_items')
        .insert(crisisItems)

      if (itemsError) throw itemsError

      // Add creator as admin to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin'
        }])

      if (memberError) throw memberError

      router.push(`/alerts/${alertData.id}`)
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="category">category of crisis</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weather">Weather</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {category === "weather" && (
          <div>
            <Label htmlFor="weatherEvent">Weather Event</Label>
            <Select value={weatherEvent} onValueChange={setWeatherEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select weather event" />
              </SelectTrigger>
              <SelectContent>
                {weatherEvents.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {weatherEvent && (
          <div className="space-y-4">
            <Label>Required Items</Label>
            <div className="space-y-4">
              {defaultItems[weatherEvent as keyof typeof defaultItems]?.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={!!selectedItems[item.name]}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleItemQuantityChange(item.name, item.quantity)
                        } else {
                          handleItemQuantityChange(item.name, 0)
                        }
                      }}
                    />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                  {selectedItems[item.name] > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleItemQuantityChange(item.name, (selectedItems[item.name] || 0) - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{selectedItems[item.name]}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleItemQuantityChange(item.name, (selectedItems[item.name] || 0) + 1)}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full bg-red-400 hover:bg-red-500 text-black">
        Create Alert
      </Button>
    </form>
  )
} 