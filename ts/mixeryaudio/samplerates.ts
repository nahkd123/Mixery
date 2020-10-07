export namespace AudioSampleRates {
    /** Low sample rate for telephones */
    export const TELEPHONE          = 8000;

    /** Used in VoIP applications or wideband telephones */
    export const VOIP               = 16000;

    /** The most common sample rate, mostly used on CDs and MP3s */
    export const CD                 = 44100;

    /** Standard sampling rate used by professional digital video equipment */
    export const PROFESSIONAL_LOW   = 48000;
    export const PROFESSIONAL_HI    = 88200;
    export const DVD_AUDIO          = 96000;

    export const RATES = [TELEPHONE, VOIP, CD, PROFESSIONAL_LOW, PROFESSIONAL_HI, DVD_AUDIO];

    /** Common sample rate (or 44.1KHz) */
    export const COMMON = CD;
}