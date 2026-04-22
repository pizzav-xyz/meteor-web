export type Category =
  | "Combat" | "Player" | "Movement" | "Render" | "World" | "Misc";

export type SettingType =
  | "bool" | "int" | "double" | "enum" | "select" | "keybind";

export interface Setting {
  name: string;
  type: SettingType;
  group: string;
  value: boolean | number | string;
  options?: string[]; // for enum
  min?: number;
  max?: number;
  selectedCount?: number; // for "select" types
  totalCount?: number;
}

export interface Module {
  id: string;
  name: string;
  category: Category;
  description: string;
  settings: Setting[];
}

const mk = (
  name: string,
  category: Category,
  description = "Module description.",
  settings: Setting[] = []
): Module => ({
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  category,
  description,
  settings: [
    ...settings,
    { name: "Bind", type: "keybind", group: "Bind", value: "None" },
    { name: "Toggle on bind release", type: "bool", group: "Bind", value: false },
    { name: "Chat Feedback", type: "bool", group: "Bind", value: true },
  ],
});

export const MODULES: Module[] = [
  // Combat
  mk("Anchor Aura", "Combat"),
  mk("Anti Anvil", "Combat"),
  mk("Anti Bed", "Combat"),
  mk("Arrow Dodge", "Combat"),
  mk("Attribute Swap", "Combat"),
  mk("Auto Anvil", "Combat"),
  mk("Auto Armor", "Combat"),
  mk("Auto City", "Combat"),
  mk("Auto Exp", "Combat"),
  mk("Auto Log", "Combat"),
  mk("Auto Totem", "Combat"),
  mk("Auto Trap", "Combat"),
  mk("Auto Weapon", "Combat"),
  mk("Auto Web", "Combat"),
  mk("Bed Aura", "Combat"),
  mk("Bow Aimbot", "Combat"),
  mk("Bow Spam", "Combat"),
  mk("Burrow", "Combat"),
  mk("Criticals", "Combat"),
  mk("Crystal Aura", "Combat"),
  mk("Hitboxes", "Combat"),
  mk("Hole Filler", "Combat"),
  mk("Kill Aura", "Combat", "Attacks specified entities around you.", [
    { name: "Attack When Holding", type: "enum", group: "General", value: "Weapons", options: ["Weapons", "Any", "Tools"] },
    { name: "Selected Weapon Types", type: "select", group: "General", value: "", selectedCount: 3, totalCount: 5 },
    { name: "Rotate", type: "enum", group: "General", value: "Always", options: ["Always", "On Hit", "Never"] },
    { name: "Auto Switch", type: "bool", group: "General", value: false },
    { name: "Shield Mode", type: "enum", group: "General", value: "None", options: ["None", "Always", "Smart"] },
    { name: "Only On Click", type: "bool", group: "General", value: false },
    { name: "Only On Look", type: "bool", group: "General", value: false },
    { name: "Pause Baritone", type: "bool", group: "General", value: true },
    { name: "Entities", type: "select", group: "Targeting", value: "", selectedCount: 1, totalCount: 80 },
    { name: "Priority", type: "enum", group: "Targeting", value: "ClosestAngle", options: ["ClosestAngle", "Health", "Distance"] },
    { name: "Max Targets", type: "int", group: "Targeting", value: 1, min: 1, max: 10 },
    { name: "Range", type: "double", group: "Targeting", value: 4.5, min: 0, max: 6 },
    { name: "Walls Range", type: "double", group: "Targeting", value: 3.5, min: 0, max: 6 },
    { name: "Passive Mob Age Filter", type: "enum", group: "Targeting", value: "Adult", options: ["Adult", "Baby", "Both"] },
    { name: "Hostile Mob Age Filter", type: "enum", group: "Targeting", value: "Both", options: ["Adult", "Baby", "Both"] },
    { name: "Ignore Named", type: "bool", group: "Targeting", value: false },
    { name: "Ignore Passive", type: "bool", group: "Targeting", value: true },
    { name: "Ignore Tamed", type: "bool", group: "Targeting", value: false },
    { name: "Pause On Lag", type: "bool", group: "Timing", value: true },
    { name: "Pause On Use", type: "bool", group: "Timing", value: true },
    { name: "Pause On CA", type: "bool", group: "Timing", value: true },
    { name: "TPS Sync", type: "bool", group: "Timing", value: true },
    { name: "Custom Delay", type: "bool", group: "Timing", value: false },
    { name: "Switch Delay", type: "int", group: "Timing", value: 0, min: 0, max: 20 },
  ]),
  mk("Offhand", "Combat"),
  mk("Quiver", "Combat"),
  mk("Self Anvil", "Combat"),
  mk("Self Trap", "Combat"),
  mk("Self Web", "Combat"),
  mk("Surround", "Combat"),

  // Player
  mk("Air Place", "Player"),
  mk("Anti Afk", "Player"),
  mk("Anti Hunger", "Player"),
  mk("Auto Clicker", "Player"),
  mk("Auto Eat", "Player", "Automatically eats food.", [
    { name: "Blacklist", type: "select", group: "General", value: "", selectedCount: 9, totalCount: 30 },
    { name: "Pause Auras", type: "bool", group: "General", value: true },
    { name: "Pause Baritone", type: "bool", group: "General", value: true },
    { name: "Search Inventory", type: "bool", group: "General", value: false },
    { name: "Food Priority", type: "enum", group: "General", value: "Saturation", options: ["Saturation", "Hunger", "Best"] },
    { name: "Threshold Mode", type: "enum", group: "Threshold", value: "Any", options: ["Any", "All"] },
    { name: "Health Threshold", type: "double", group: "Threshold", value: 10, min: 0, max: 20 },
    { name: "Hunger Threshold", type: "int", group: "Threshold", value: 16, min: 0, max: 20 },
  ]),
  mk("Auto Fish", "Player"),
  mk("Auto Gap", "Player"),
  mk("Auto Mend", "Player"),
  mk("Auto Replenish", "Player"),
  mk("Auto Respawn", "Player"),
  mk("Auto Tool", "Player"),
  mk("Break Delay", "Player"),
  mk("Chest Swap", "Player"),
  mk("Exp Thrower", "Player"),
  mk("Fake Player", "Player"),
  mk("Fast Use", "Player"),
  mk("Ghost Hand", "Player"),
  mk("Instant Rebreak", "Player"),
  mk("Liquid Interact", "Player"),
  mk("Middle Click Extra", "Player"),
  mk("Multitask", "Player"),
  mk("Name Protect", "Player"),
  mk("No Interact", "Player"),
  mk("No Mining Trace", "Player"),
  mk("No Rotate", "Player"),
  mk("No Status Effects", "Player"),
  mk("Portals", "Player"),
  mk("Potion Saver", "Player"),
  mk("Reach", "Player"),
  mk("Rotation", "Player"),
  mk("Speed Mine", "Player"),

  // Movement
  mk("Air Jump", "Movement"),
  mk("Anchor", "Movement"),
  mk("Anti Void", "Movement"),
  mk("Auto Jump", "Movement"),
  mk("Auto Walk", "Movement"),
  mk("Auto Wasp", "Movement"),
  mk("Blink", "Movement"),
  mk("Click Tp", "Movement"),
  mk("Elytra Boost", "Movement"),
  mk("Elytra Fly", "Movement"),
  mk("Fast Climb", "Movement"),
  mk("Flight", "Movement"),
  mk("Gui Move", "Movement"),
  mk("High Jump", "Movement"),
  mk("Jesus", "Movement"),
  mk("Long Jump", "Movement"),
  mk("No Fall", "Movement"),
  mk("No Slow", "Movement"),
  mk("Parkour", "Movement"),
  mk("Reverse Step", "Movement"),
  mk("Safe Walk", "Movement"),
  mk("Scaffold", "Movement"),
  mk("Slippy", "Movement"),
  mk("Sneak", "Movement"),
  mk("Speed", "Movement"),
  mk("Spider", "Movement"),
  mk("Sprint", "Movement"),
  mk("Step", "Movement"),
  mk("Trident Boost", "Movement"),
  mk("Velocity", "Movement"),

  // Render
  mk("Better Tab", "Render"),
  mk("Better Tooltips", "Render"),
  mk("Block Esp", "Render"),
  mk("Block Selection", "Render"),
  mk("Blur", "Render"),
  mk("Boss Stack", "Render"),
  mk("Breadcrumbs", "Render"),
  mk("Break Indicators", "Render"),
  mk("Camera Tweaks", "Render"),
  mk("Chams", "Render"),
  mk("City Esp", "Render"),
  mk("Entity Owner", "Render"),
  mk("Esp", "Render"),
  mk("Free Look", "Render"),
  mk("Freecam", "Render"),
  mk("Fullbright", "Render", "Lights up your world!", [
    { name: "Mode", type: "enum", group: "General", value: "Gamma", options: ["Gamma", "Night Vision", "Luminance"] },
  ]),
  mk("Hand View", "Render"),
  mk("Hole Esp", "Render"),
  mk("Item Highlight", "Render"),
  mk("Item Physics", "Render"),
  mk("Light Overlay", "Render"),
  mk("Logout Spots", "Render"),
  mk("Marker", "Render"),
  mk("Nametags", "Render"),
  mk("No Render", "Render"),
  mk("Pop Chams", "Render"),
  mk("Storage Esp", "Render"),
  mk("Time Changer", "Render"),
  mk("Tracers", "Render"),
  mk("Trail", "Render"),
  mk("Trajectories", "Render"),
  mk("Tunnel Esp", "Render"),
  mk("Void Esp", "Render"),

  // World
  mk("Ambience", "World"),
  mk("Auto Breed", "World"),
  mk("Auto Brewer", "World"),
  mk("Auto Mount", "World"),
  mk("Auto Nametag", "World"),
  mk("Auto Shearer", "World"),
  mk("Auto Sign", "World"),
  mk("Auto Smelter", "World"),
  mk("Build Height", "World"),
  mk("Collisions", "World"),
  mk("Echest Farmer", "World"),
  mk("Enderman Look", "World"),
  mk("Flamethrower", "World"),
  mk("Highway Builder", "World"),
  mk("Liquid Filler", "World"),
  mk("Mount Bypass", "World"),
  mk("No Ghost Blocks", "World"),
  mk("Nuker", "World"),
  mk("Packet Mine", "World"),
  mk("Spawn Proofer", "World"),
  mk("Stash Finder", "World"),
  mk("Timer", "World", "Changes the speed of everything in your game.", [
    { name: "Multiplier", type: "double", group: "General", value: 1.0, min: 0.1, max: 10 },
  ]),
  mk("Vein Miner", "World"),

  // Misc
  mk("Anti Packet Kick", "Misc"),
  mk("Auto Reconnect", "Misc"),
  mk("Better Beacons", "Misc"),
  mk("Better Chat", "Misc"),
  mk("Book Bot", "Misc"),
  mk("Discord Presence", "Misc"),
  mk("Inventory Tweaks", "Misc"),
  mk("Message Aura", "Misc"),
  mk("Notebot", "Misc"),
  mk("Notifier", "Misc"),
  mk("Offhand Crash", "Misc"),
  mk("Packet Canceller", "Misc"),
  mk("Packet Logger", "Misc"),
  mk("Server Spoof", "Misc"),
  mk("Sound Blocker", "Misc"),
  mk("Spam", "Misc"),
  mk("Swarm", "Misc"),
];

export const CATEGORIES: Category[] = ["Combat", "Player", "Movement", "Render", "World", "Misc"];

export const TABS = ["Modules", "Config", "GUI", "HUD", "Friends", "Macros", "Profiles"] as const;
export type Tab = typeof TABS[number];
