import { AudioClip, Clip, MIDIClip } from "./clips.js";
import { Session } from "./session.js";
import { trimText } from "../utils/trimtext.js";
import { Tools } from "./tools.js";
import drawAudioBuffer from "../utils/audiobufferdraw.js";
import { beatsToMS } from "../utils/msbeats.js";

export class PlaylistTrack {
    playlist: Playlist;
    get session() {return this.playlist.session;}

    name: string = "Track";
    unmuted: boolean = true;

    sidebarElement: HTMLDivElement;
    viewCanvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    clips: Clip[] = [];

    constructor(playlist: Playlist) {
        this.playlist = playlist;
    }

    renderUpdate() {
        if (this.viewCanvas) {
            if (!this.ctx) this.ctx = this.viewCanvas.getContext("2d");

            let clipAlpha = this.unmuted? 1 : 0.5;
            this.ctx.globalAlpha = clipAlpha;

            this.ctx.clearRect(0, 0, this.viewCanvas.width, this.viewCanvas.height);
            this.ctx.font = "12px 'Nunito Sans', 'Noto Sans', 'Ubuntu', Calibri, sans-serif";

            // Render seek thing
            const seekerDraw = this.session.seeker * this.session.pxPerBeat - this.session.scrolledPixels;
            if (seekerDraw >= 0 && seekerDraw <= this.viewCanvas.width) {
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = "white";
                this.ctx.beginPath();
                this.ctx.moveTo(seekerDraw, 0);
                this.ctx.lineTo(seekerDraw, 39);
                this.ctx.stroke();
                this.ctx.closePath();
            }

            const seekerPlayingDraw = seekerDraw + this.session.playedBeats * this.session.pxPerBeat;
            if (this.session.playing && seekerPlayingDraw >= 0 && seekerPlayingDraw <= this.viewCanvas.width) {
                this.ctx.strokeStyle = "rgb(252, 186, 3)";
                this.ctx.beginPath();
                this.ctx.moveTo(seekerPlayingDraw, 0);
                this.ctx.lineTo(seekerPlayingDraw, 39);
                this.ctx.stroke();
                this.ctx.closePath();
            }

            this.clips.forEach(clip => {
                const drawX = clip.offset * this.session.pxPerBeat - this.session.scrolledPixels;
                const drawW = clip.length * this.session.pxPerBeat;
                const drawPX = Math.max(drawX, 0);
                const drawPW = drawX < 0? drawW + drawX : drawW;
                if (drawX + drawW <= 0) return;

                if (this.session.settings.rendering.renderNotes) {
                    this.ctx.fillStyle = clip.bgcolor;
                    this.ctx.fillRect(drawX, 0, drawW, 14);
                    this.ctx.globalAlpha = 0.25;
                    this.ctx.fillRect(drawX, 14, drawW, 39);
                    this.ctx.globalAlpha = clipAlpha;

                    if (clip instanceof MIDIClip) {
                        let minNote = -1;
                        let maxNote = -1;
                        clip.notes.forEach(note => {
                            minNote = minNote === -1? note.note : Math.min(minNote, note.note);
                            maxNote = maxNote === -1? note.note : Math.max(maxNote, note.note);
                        });

                        const noteH = 25 / (maxNote - minNote + 1);
                        for (let i = 0; i < clip.notes.length; i++) {
                            const note = clip.notes[i];
                            const noteDrawingIndex = maxNote - note.note;
                            const noteX = note.start * this.session.pxPerBeat;
                            const noteY = noteDrawingIndex * noteH;
                            const noteW = note.duration * this.session.pxPerBeat;
                            
                            if (noteX + noteW > drawW) break;

                            this.ctx.fillStyle = clip.bgcolor;
                            this.ctx.fillRect(drawX + noteX, 14 + noteY, noteW, noteH);
                        }
                    } else if (clip instanceof AudioClip) {
                        // clip.buffer.getChannelData(0);
                        this.ctx.strokeStyle = clip.bgcolor;
                        this.ctx.lineWidth = 1;
                        drawAudioBuffer(clip.buffer, this.ctx, drawX, 14, drawW, 25, 0, beatsToMS(clip.length, this.session.bpm));
                    }
                } else {
                    this.ctx.fillStyle = clip.bgcolor;
                    this.ctx.fillRect(drawX, 0, drawW, 39);
                }

                this.ctx.fillStyle = clip.fgcolor;
                this.ctx.fillText(trimText(clip.name, this.ctx, drawPW - 10), drawPX + 5, 10);

                if (this.playlist.selectedClip === clip) {
                    this.ctx.strokeStyle = "rgb(255, 127, 0)";
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(drawX, 1, drawW, 38);
                }
            });
        }
    }
}

export class Playlist {
    session: Session;
    tracks: PlaylistTrack[] = [];

    // Editor
    selectedTool: Tools = Tools.NOTHING;
    selectedClip: Clip = undefined;

    constructor(session: Session) {
        this.session = session;
    }

    addTrack(name: string = "Track " + (this.tracks.length + 1)) {
        let track = new PlaylistTrack(this);
        track.name = name;

        this.tracks.push(track);
        return track;
    }
}