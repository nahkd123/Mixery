export var AudioSampleRates;
(function (AudioSampleRates) {
    /** Low sample rate for telephones */
    AudioSampleRates.TELEPHONE = 8000;
    /** Used in VoIP applications or wideband telephones */
    AudioSampleRates.VOIP = 16000;
    /** The most common sample rate, mostly used on CDs and MP3s */
    AudioSampleRates.CD = 44100;
    /** Standard sampling rate used by professional digital video equipment */
    AudioSampleRates.PROFESSIONAL_LOW = 48000;
    AudioSampleRates.PROFESSIONAL_HI = 88200;
    AudioSampleRates.DVD_AUDIO = 96000;
    AudioSampleRates.RATES = [AudioSampleRates.TELEPHONE, AudioSampleRates.VOIP, AudioSampleRates.CD, AudioSampleRates.PROFESSIONAL_LOW, AudioSampleRates.PROFESSIONAL_HI, AudioSampleRates.DVD_AUDIO];
    /** Common sample rate (or 44.1KHz) */
    AudioSampleRates.COMMON = AudioSampleRates.CD;
})(AudioSampleRates || (AudioSampleRates = {}));