-- Create enum for alert categories
CREATE TYPE alert_category AS ENUM ('weather', 'other');

-- Create enum for weather event types
CREATE TYPE weather_event_type AS ENUM (
    'tornado',
    'flood',
    'blizzard',
    'polar_vortex',
    'fire',
    'hurricane',
    'earthquake',
    'tsunami',
    'drought',
    'heat_wave'
);

-- Create groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Create function to generate group name
CREATE OR REPLACE FUNCTION generate_group_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name := 'Emergency Response Group ' || TO_CHAR(NEW.created_at, 'YYYYMMDD-HH24MI');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set group name
CREATE TRIGGER set_group_name
    BEFORE INSERT ON groups
    FOR EACH ROW
    EXECUTE FUNCTION generate_group_name();

-- Create group_members table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Create alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    category alert_category NOT NULL,
    weather_event_type weather_event_type,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
);

-- Create crisis_items table
CREATE TABLE crisis_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    claimed_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create item_claims table
CREATE TABLE item_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES crisis_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create alert_messages table
CREATE TABLE alert_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create message_reactions table
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES alert_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reaction TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(message_id, user_id, reaction)
);

-- Insert default crisis items for different weather events
INSERT INTO crisis_items (alert_id, name, description, quantity) VALUES
-- Tornado items
(NULL, 'Emergency Radio', 'Battery-powered radio for weather updates', 1),
(NULL, 'First Aid Kit', 'Basic medical supplies', 1),
(NULL, 'Flashlight', 'Battery-powered flashlight', 2),
(NULL, 'Batteries', 'Various sizes for devices', 10),
(NULL, 'Water Bottles', '1 gallon per person per day', 5),
(NULL, 'Non-perishable Food', '3 days worth per person', 3),
(NULL, 'Emergency Blankets', 'Space blankets for warmth', 4),
(NULL, 'Whistle', 'For signaling help', 1),
(NULL, 'Dust Masks', 'For protection from debris', 10),
(NULL, 'Plastic Sheeting', 'For temporary shelter', 1),

-- Flood items
(NULL, 'Sandbags', 'For flood protection', 20),
(NULL, 'Waterproof Boots', 'For walking in water', 2),
(NULL, 'Life Jackets', 'For water safety', 2),
(NULL, 'Waterproof Containers', 'For important documents', 2),
(NULL, 'Emergency Radio', 'Water-resistant radio', 1),
(NULL, 'First Aid Kit', 'Waterproof medical supplies', 1),
(NULL, 'Flashlight', 'Water-resistant flashlight', 2),
(NULL, 'Batteries', 'Water-resistant batteries', 10),
(NULL, 'Water Bottles', '1 gallon per person per day', 5),
(NULL, 'Non-perishable Food', '3 days worth per person', 3),

-- Blizzard items
(NULL, 'Snow Shovel', 'For clearing snow', 1),
(NULL, 'Ice Scraper', 'For vehicle windows', 2),
(NULL, 'Winter Boots', 'Waterproof winter boots', 2),
(NULL, 'Winter Coats', 'Heavy winter coats', 2),
(NULL, 'Gloves', 'Waterproof gloves', 4),
(NULL, 'Hats', 'Warm winter hats', 2),
(NULL, 'Scarves', 'Winter scarves', 2),
(NULL, 'Emergency Radio', 'For weather updates', 1),
(NULL, 'First Aid Kit', 'For medical emergencies', 1),
(NULL, 'Flashlight', 'For visibility', 2),

-- Polar Vortex items
(NULL, 'Space Heaters', 'Portable heaters', 2),
(NULL, 'Extra Blankets', 'Heavy winter blankets', 4),
(NULL, 'Winter Boots', 'Extreme cold boots', 2),
(NULL, 'Winter Coats', 'Heavy winter coats', 2),
(NULL, 'Gloves', 'Extreme cold gloves', 4),
(NULL, 'Hats', 'Warm winter hats', 2),
(NULL, 'Scarves', 'Winter scarves', 2),
(NULL, 'Emergency Radio', 'For weather updates', 1),
(NULL, 'First Aid Kit', 'For medical emergencies', 1),
(NULL, 'Flashlight', 'For visibility', 2),

-- Fire items
(NULL, 'Fire Extinguisher', 'ABC type fire extinguisher', 2),
(NULL, 'Smoke Detectors', 'Battery-powered smoke detectors', 3),
(NULL, 'N95 Masks', 'For smoke protection', 10),
(NULL, 'Emergency Radio', 'For updates', 1),
(NULL, 'First Aid Kit', 'For medical emergencies', 1),
(NULL, 'Flashlight', 'For visibility', 2),
(NULL, 'Batteries', 'For devices', 10),
(NULL, 'Water Bottles', '1 gallon per person per day', 5),
(NULL, 'Non-perishable Food', '3 days worth per person', 3),
(NULL, 'Emergency Blankets', 'For warmth', 4); 