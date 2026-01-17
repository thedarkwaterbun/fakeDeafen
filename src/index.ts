/**
 * Vencord Plugin - Fake Deafen/Fake Mute
 * 
 * Adds fake deafen and fake mute options to the right-click context menu
 * when clicking on yourself in a voice channel.
 * 
 * This allows you to appear deafened/muted to other users while still
 * being able to talk and hear normally.
 */

// Vencord plugin API types (injected by Vencord at runtime)
interface VencordPlugin {
    name: string;
    start?: () => void;
    stop?: () => void;
    patches?: Array<{
        find?: string;
        replacement?: {
            match: RegExp;
            replace: string;
        };
    }>;
    registerContextMenu?: () => void;
    unregisterContextMenu?: () => void;
    renderFakeStateMenu?: (voiceState: VoiceState) => any;
}

declare const Vencord: {
    Webpack: {
        Common: Record<string, any>;
        getModule: (filters: Record<string, any> | ((m: any) => boolean)) => Promise<any>;
    };
    Plugins: {
        registerPlugin: (plugin: VencordPlugin) => VencordPlugin;
    };
    API: {
        dataBus: {
            emit: (event: string, data: any) => void;
        };
    };
    Util: {
        getTheme: () => string;
    };
};

interface VoiceState {
    channelId: string | null;
    guildId: string | null;
    userId: string;
    selfDeaf: boolean;
    selfMute: boolean;
    suppress: boolean;
}

interface ContextMenuProps {
    userId?: string;
    guildId?: string;
}

const isSelfInVoiceChannel = (userId: string): boolean => {
    try {
        const voiceStateStore = Vencord.Webpack.Common.VoiceStateStore;
        if (!voiceStateStore) return false;
        
        const getVoiceStateForUser = voiceStateStore.getVoiceStateForUser || 
                                     voiceStateStore.getVoiceState;
        if (!getVoiceStateForUser) return false;
        
        const guildId = voiceStateStore.getGuildId?.();
        if (!guildId) return false;
        
        const voiceState = getVoiceStateForUser(guildId, userId);
        return voiceState?.channelId != null;
    } catch {
        return false;
    }
};

const getSelfVoiceState = (userId: string): VoiceState | null => {
    try {
        const voiceStateStore = Vencord.Webpack.Common.VoiceStateStore;
        if (!voiceStateStore) return null;
        
        const getVoiceStateForUser = voiceStateStore.getVoiceStateForUser || 
                                     voiceStateStore.getVoiceState;
        const guildId = voiceStateStore.getGuildId?.();
        
        if (!getVoiceStateForUser || !guildId) return null;
        
        const voiceState = getVoiceStateForUser(guildId, userId);
        if (!voiceState?.channelId) return null;
        
        return {
            channelId: voiceState.channelId,
            guildId: guildId,
            userId: userId,
            selfDeaf: voiceState.selfDeaf ?? false,
            selfMute: voiceState.selfMute ?? false,
            suppress: voiceState.suppress ?? false
        };
    } catch {
        return null;
    }
};

const getCurrentUserId = (): string => {
    try {
        const userStore = Vencord.Webpack.Common.UserStore;
        return userStore?.getCurrentUser?.()?.id ?? "";
    } catch {
        return "";
    }
};

const updateVoiceState = (voiceState: VoiceState, updates: Partial<VoiceState>): void => {
    const updatedState: VoiceState = {
        ...voiceState,
        ...updates
    };
    
    try {
        const fluxDispatcher = Vencord.Webpack.Common.FluxDispatcher;
        if (fluxDispatcher) {
            fluxDispatcher.dispatch({
                type: "VOICE_STATE_UPDATED",
                voiceState: updatedState
            });
        } else {
            console.log("[FakeDeafen] Voice state update (FluxDispatcher not available):", updates);
        }
    } catch (error) {
        console.error("[FakeDeafen] Failed to update voice state:", error);
    }
};

const plugin: VencordPlugin = {
    name: "fakeDeafen",
    start() {
        this.registerContextMenu();
    },
    stop() {
        this.unregisterContextMenu();
    },
    registerContextMenu() {
        try {
            const contextMenuApi = Vencord.Webpack.Common.ContextMenuApi;
            if (contextMenuApi?.Api?.register) {
                contextMenuApi.Api.register({
                    id: "fake-deafen-context-menu",
                    predicate: (props: ContextMenuProps) => {
                        const currentUserId = getCurrentUserId();
                        return props?.userId === currentUserId && isSelfInVoiceChannel(currentUserId);
                    },
                    render: (props: ContextMenuProps) => {
                        const currentUserId = getCurrentUserId();
                        const voiceState = getSelfVoiceState(currentUserId);
                        
                        if (!voiceState) return null;
                        
                        return this.renderFakeStateMenu(voiceState);
                    }
                });
            }
        } catch (error) {
            console.error("[FakeDeafen] Failed to register context menu:", error);
        }
    },
    unregisterContextMenu() {
        try {
            const contextMenuApi = Vencord.Webpack.Common.ContextMenuApi;
            if (contextMenuApi?.Api?.unregister) {
                contextMenuApi.Api.unregister("fake-deafen-context-menu");
            }
        } catch (error) {
            console.error("[FakeDeafen] Failed to unregister context menu:", error);
        }
    },
    renderFakeStateMenu(voiceState: VoiceState) {
        try {
            const React = Vencord.Webpack.Common.React;
            const ContextMenu = Vencord.Webpack.Common.ContextMenuApi;
            
            if (!React || !ContextMenu) return null;
            
            const isFakeDeafened = voiceState.selfDeaf;
            const isFakeMuted = voiceState.selfMute;
            
            return React.createElement(
                ContextMenu.ModalRoot,
                null,
                React.createElement(
                    ContextMenu.Items.Group,
                    null,
                    React.createElement(ContextMenu.Items.Submenu, {
                        label: "Fake State",
                        color: isFakeDeafened || isFakeMuted ? "yellow" : undefined,
                        items: [
                            React.createElement(ContextMenu.Items.Checkbox, {
                                key: "fake-deafen",
                                label: "Fake Deafen",
                                checked: isFakeDeafened,
                                action: () => updateVoiceState(voiceState, { selfDeaf: !isFakeDeafened })
                            }),
                            React.createElement(ContextMenu.Items.Checkbox, {
                                key: "fake-mute",
                                label: "Fake Mute",
                                checked: isFakeMuted,
                                action: () => updateVoiceState(voiceState, { selfMute: !isFakeMuted })
                            }),
                            React.createElement(ContextMenu.Items.Separator, { key: "sep" }),
                            React.createElement(ContextMenu.Items.Button, {
                                key: "fake-both",
                                label: "Fake Both",
                                action: () => updateVoiceState(voiceState, { selfDeaf: true, selfMute: true }),
                                disabled: isFakeDeafened && isFakeMuted
                            }),
                            React.createElement(ContextMenu.Items.Button, {
                                key: "clear-fakes",
                                label: "Clear All Fakes",
                                action: () => updateVoiceState(voiceState, { selfDeaf: false, selfMute: false }),
                                disabled: !isFakeDeafened && !isFakeMuted
                            })
                        ]
                    })
                )
            );
        } catch (error) {
            console.error("[FakeDeafen] Failed to render menu:", error);
            return null;
        }
    }
};

if (typeof Vencord !== "undefined") {
    Vencord.Plugins.registerPlugin(plugin);
}

export default plugin;
