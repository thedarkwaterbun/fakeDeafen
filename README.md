# Fake Deafen Plugin for Vencord

A Vencord plugin that adds **Fake Deafen** and **Fake Mute** options to the right-click context menu when clicking on yourself in a voice channel.

## Features

- **Fake Deafen**: Appear deafened to other users while still hearing them
- **Fake Mute**: Appear muted to other users while still being able to talk
- **Fake Both**: Enable both fake states at once
- **Clear All Fakes**: Remove all fake states

## Installation

1. Open Vencord settings in Discord
2. Go to **Vencord** → **Plugins**
3. Click **Open Plugins Folder**
4. Copy the `dist/fakeDeafen.js` file to the plugins folder
5. Enable the plugin in Vencord settings

## Building from Source

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# The output will be in dist/fakeDeafen.js
```

## Usage

1. Join a voice channel
2. Right-click on yourself in the voice channel user list
3. Look for the **"Fake State"** submenu in the context menu
4. Toggle **Fake Deafen** and/or **Fake Mute** as desired

The plugin only appears when:
- You are in a voice channel
- You right-click on yourself (not other users)

## How It Works

This plugin uses Discord's context menu API to inject custom menu items that let you toggle fake deafen/mute states. When activated, it dispatches a `VOICE_STATE_UPDATED` event with modified voice state properties, making it appear to other users that you are deafened/muted while you retain full audio functionality.
