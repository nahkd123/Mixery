import ContextMenu, { ContextMenuEntry } from "../../contextmenus/menu.js";
import Mixer from "../../mixeryaudio/mixer/mixer.js";
import MixerTrack from "../../mixeryaudio/mixer/track.js";
import { AutomationClip } from "../../mixerycore/clips.js";
import { AudioEffect } from "../../mixerycore/effect.js";
import { Session } from "../../mixerycore/session.js";
import { nearSnap, snap } from "../../utils/snapper.js";
import { UserInterface } from "../ui.js";

export class MixerInterface {
    ui: UserInterface;
    session: Session;

    mixerEngine: Mixer;
    mixerTracks: MixerTracksContainer;
    mixerTrackPlugins: MixerTracksEffects;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;

        this.mixerEngine = this.session.audioEngine.mixer;
    }

    applyUpdate() {
        this.mixerTracks = new MixerTracksContainer(this);
        this.mixerTrackPlugins = new MixerTracksEffects(this);
    }
}

export class MixerTracksContainer {
    mi: MixerInterface;
    element: HTMLDivElement;

    selected: LocalMixerTrack = {track: undefined, element: undefined};
    masterElement: HTMLDivElement;

    ctxMenu: ContextMenu = new ContextMenu();

    constructor(mi: MixerInterface) {
        this.mi = mi;
        this.element = mi.ui.element.querySelector("div.pane.plugins > div.mixer");

        this.mi.mixerEngine.tracks.forEach(track => {
            this.addMixerTrackElement(track);
        });

        this.element.addEventListener("contextmenu", event => {
            event.preventDefault();
            if (event.target === this.element) this.ctxMenu.openMenu(event.pageX, event.pageY);
        });

        this.ctxMenu.entries.push(new ContextMenuEntry("Add Track", () => {
            this.addMixerTrack();
        }));
    }

    addMixerTrackElement(track: MixerTrack) {
        let trackElement = document.createElement("div");
        trackElement.className = "mixertrack selected";
        this.selected.track = track;
        if (this.selected.element !== undefined) this.selected.element.classList.remove("selected");
        this.selected.element = trackElement;

        let trackLabel = document.createElement("div");
        trackLabel.className = "label";
        trackLabel.textContent = track.name;

        // The slider will be from 0.0 to 1.5 (because some ppl wants to create ear rape stuffs)
        let trackSlider = document.createElement("div");
        trackSlider.className = "slider";
        let trackSliderThumb = document.createElement("div");
        trackSliderThumb.className = "sliderthumb";
        trackSlider.append(trackSliderThumb);
        function updateSliderThumb() {
            trackSliderThumb.style.left = ((trackSlider.offsetWidth - 20) * (track.gain.value / 1.5)) + "px";
            if (track.gain.value > 1.0 && !trackSliderThumb.classList.contains("loud")) trackSliderThumb.classList.add("loud");
            else if (track.gain.value <= 1.0 && trackSliderThumb.classList.contains("loud")) trackSliderThumb.classList.remove("loud");
        }

        trackElement.append(trackLabel, trackSlider);
        this.element.appendChild(trackElement);
        updateSliderThumb();

        let labelCtxMenu = new ContextMenu();
        labelCtxMenu.entries.push(new ContextMenuEntry("Add Track", () => {
            this.addMixerTrack();
        }));
        labelCtxMenu.entries.push(new ContextMenuEntry("Automate Gain", () => {
            let automationClip = new AutomationClip(track.gain);
            automationClip.name = track.name + " - Gain";

            let availableTrack = this.mi.session.playlist.findUnoccupiedTrack(this.mi.session.seeker, 1);
            if (availableTrack !== undefined) {
                availableTrack.clips.push(automationClip);
            }
            this.mi.session.playlist.selectedClip = automationClip;
            this.mi.ui.canvasRenderUpdate();
        }));
        if (this.mi.mixerEngine.master !== track) {
            labelCtxMenu.entries.push(new ContextMenuEntry("Delete Track", () => {
                this.mi.mixerEngine.removeTrack(track);
                trackElement.remove();
    
                if (this.selected.track === track) {
                    this.selected.track = this.mi.mixerEngine.master;
                    this.selected.element = this.masterElement;
                    this.masterElement.classList.add("selected");
                }
            }));
        } else this.masterElement = trackElement;

        // Events
        trackSlider.addEventListener("mousedown", event => {
            let mX = 0;
            let oldGainValue = track.gain.value;

            function mouseMove(event: MouseEvent) {
                mX += event.movementX;

                let newGainValue = oldGainValue + mX / (trackSlider.offsetWidth - 20) * 1.15;
                if (!event.shiftKey) newGainValue = nearSnap(newGainValue, 0.05, 0, 1, 1.5);
                if (newGainValue > 1.5) newGainValue = 1.5;
                else if (newGainValue < 0) newGainValue = 0;
                track.gain.value = newGainValue;
                updateSliderThumb();
            }
            function mouseUp(event: MouseEvent) {
                document.removeEventListener("mousemove", mouseMove);
                document.removeEventListener("mouseup", mouseUp);
                document.exitPointerLock();
            }
            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("mouseup", mouseUp);
            trackSlider.requestPointerLock();
        });
        trackLabel.addEventListener("click", event => {
            if (this.selected.track === track) return;
            this.selected.track = track;
            this.selected.element.classList.remove("selected");
            this.selected.element = trackElement;
            trackElement.classList.add("selected");
            this.mi.mixerTrackPlugins.listEffectPlugins(track);
        });
        trackLabel.addEventListener("contextmenu", event => {
            event.preventDefault();
            labelCtxMenu.openMenu(event.pageX, event.pageY);
        });
    }

    addMixerTrack() {
        let track = this.mi.mixerEngine.addTrack();
        this.addMixerTrackElement(track);
        return track;
    }
}
interface LocalMixerTrack {
    track: MixerTrack;
    element: HTMLDivElement;
}

export class MixerTracksEffects {
    mi: MixerInterface;
    element: HTMLDivElement;

    addButton: HTMLDivElement;

    constructor(mi: MixerInterface) {
        this.mi = mi;
        this.element = mi.ui.element.querySelector("div.pane.plugins > div.mixerplugins");

        this.addButton = this.element.querySelector("div.pluginadd");
    }

    listEffectPlugins(track: MixerTrack) {
        while (this.element.children.length > 1) this.element.removeChild(this.element.firstChild);
        (track.effects as AudioEffect[]).forEach(effect => {
            this.addEffectPluginEntry(effect);
        });
    }
    addEffectPluginEntry(effect: AudioEffect) {
        let pluginEntry = document.createElement("div");
        pluginEntry.className = "pluginlistingentry";
        let entryLabel = document.createElement("div");
        entryLabel.className = "label";
        entryLabel.textContent = effect.name;

        pluginEntry.append(entryLabel);
        this.element.insertBefore(pluginEntry, this.addButton);

        entryLabel.addEventListener("click", event => {
            effect.window.show();
        });
    }
    addEffectPlugin(effect: AudioEffect) {
        this.mi.mixerTracks.selected.track.add(effect);
        this.addEffectPluginEntry(effect);
    }
}