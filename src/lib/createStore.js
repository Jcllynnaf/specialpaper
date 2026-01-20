import { writable } from 'svelte/store';

export const cardData = writable({
    name: '',
    sender: '',
    // Kartu 1-3 (Text & Image)
    card1Text: '',
    card1Image: '', // Opsional
    card2Text: '',
    card2Image: '', // Opsional
    card3Text: '',
    card3Image: '', // Opsional
    // Kartu Sobekan
    simpleText: '',
    // Musik
    spotifyTitle: '',
    spotifyId: '',
    finalText: 'look at our memories!',
    // Memories (6 Slot Foto)
    memories: Array(6).fill(null).map(() => ({ url: '', label: '' }))
});