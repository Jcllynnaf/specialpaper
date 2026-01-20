<script>
    import { fly, scale } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { bgmStore } from '$lib/audioStore';

    // TAMBAHAN BARU: Menerima data dari luar (untuk preview)
    export let customData = null; 
    export let isPreview = false;
    export let slug = '';

    onMount(() => {
        if (!isPreview) {
        bgmStore.showButton();
    } else {
        bgmStore.hideButton();
    }
    });

    // Data Default (Yang lama hardcoded dipindah kesini)
    const defaultCards = [
        { id: 1, type: 'cover', bgClass: 'bg-lavender', name: 'Wisp' },
        { id: 2, type: 'text', bgClass: 'bg-paper', image: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTR4c201d3Q5a2U0MGNjYWJhaWF0ZGo2azVvZGszYmJ1a2gwMHExZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l9fVX1zfHYGd4rIk47/giphy.gif', text: 'Your words, your words, your words...', from: '- JustCode', color: '#000' },
        { id: 3, type: 'text', bgClass: 'bg-paper', image: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHNwNm1wbHkwbmZrZmdxMWh6MHNlbTMxMTBjaTV0MnN0dnY2c21oYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YpdffG6XDooX5KVlbK/giphy.gif', text: 'Your words, your words, your words...', from: '- JustCode', color: '#be185d' },
        { id: 4, type: 'text', bgClass: 'bg-paper', image: 'https://media0.giphy.com/media/v1.Y2lkPTNhYWU4ZTViM3h0djV5OHJudXRhbGdpZ2pyZnc3YTRrMTd6ejFnOHNwajZrZG0yYyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/l3mZaDLAkulVmve5a/200.gif', text: 'Your words, your words, your words...', from: '- JustCode', color: '#be185d' },
        { id: 99, type: 'simple-paper', bgClass: 'bg-paper', text: 'your words, your words, your words', from: '- JustCode', color: '#334155' },
        { id: 5, type: 'spotify', title: 'Song for You', trackId: '4rWWNbsiorGPfSb7B4c8sy' },
        { id: 6, type: 'final', bgClass: 'bg-gradient-pink', text: 'look at our memories!' },
    ];

    // Reactive: Jika ada customData (Preview), pakai itu. Jika tidak, pakai defaultCards (Halaman Utama).
    $: cardsSource = customData ? [
    { id: 1, type: 'cover', bgClass: 'bg-lavender', name: customData.name || 'Name' },
    { id: 2, type: 'text', bgClass: 'bg-paper', image: customData.card1Image || defaultGifs[0], text: customData.card1Text, from: '- ' + customData.sender, color: '#000' },
    { id: 3, type: 'text', bgClass: 'bg-paper', image: customData.card2Image || defaultGifs[1], text: customData.card2Text, from: '- ' + customData.sender, color: '#be185d' },
    { id: 4, type: 'text', bgClass: 'bg-paper', image: customData.card3Image || defaultGifs[2], text: customData.card3Text, from: '- ' + customData.sender, color: '#be185d' },
    { id: 99, type: 'simple-paper', bgClass: 'bg-paper', text: customData.simpleText, from: '- ' + customData.sender, color: '#334155' },
    { id: 5, type: 'spotify', title: customData.spotifyTitle, trackId: getSpotifyId(customData.spotifyId) },
    { id: 6, type: 'final', bgClass: 'bg-gradient-pink', text: customData.finalText },
    ] : defaultCards;

    const defaultGifs = [
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTR4c201d3Q5a2U0MGNjYWJhaWF0ZGo2azVvZGszYmJ1a2gwMHExZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l9fVX1zfHYGd4rIk47/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHNwNm1wbHkwbmZrZmdxMWh6MHNlbTMxMTBjaTV0MnN0dnY2c21oYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YpdffG6XDooX5KVlbK/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTNhYWU4ZTViM3h0djV5OHJudXRhbGdpZ2pyZnc3YTRrMTd6ejFnOHNwajZrZG0yYyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/l3mZaDLAkulVmve5a/200.gif'
    ];

    // Logic sorting kartu tetap sama
    let cards = [];
    $: cards = [...cardsSource]; // Init awal

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    function startDrag(e) {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    }

    function onDrag(e) {
        if (!isDragging) return;
        const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        currentX = x - startX;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        if (Math.abs(currentX) > 100) {
            if (currentX < 0) nextCard();
            else prevCard();
        }
        currentX = 0;
    }

    function nextCard() { 
        const first = cards[0];
        cards = [...cards.slice(1), first];
    }

    function prevCard() { 
        const last = cards[cards.length - 1];
        cards = [last, ...cards.slice(0, cards.length - 1)];
    }


    // TAMBAHKAN FUNGSI INI
    function getSpotifyId(input) {
    if (!input) return '4rWWNbsiorGPfSb7B4c8sy'; // Lagu Default
    if (input.includes('spotify.com')) {
        try {
            return input.split('track/')[1].split('?')[0];
        } catch (e) { return input; }
    }
    return input;
}

    function openGift() { goto('/createphoto'); }
    function openGallery() {
    // LOGIKA BARU:
    // Jika ada slug (berarti ini halaman user), ke /[slug]/memories
    if (slug) {
        goto(`/${slug}/memories`);
    } 
    // Jika tidak ada slug (berarti halaman demo/preview), ke default /memories
    else {
        goto('/memories');
    }
}

    function openSnapStudio() {
    if (slug) {
        // Jika ada nama user (slug), masuk ke halaman createphoto khusus user
        goto(`/${slug}/createphoto`);
    } else {
        // Jika tidak ada (halaman utama/demo), masuk ke createphoto umum
        goto('/createphoto');
    }
}
</script>

<svelte:window 
    on:mousemove={onDrag} 
    on:mouseup={endDrag} 
    on:touchmove={onDrag} 
    on:touchend={endDrag} 
/>

<div class="scene-container">
    
    {#if !customData?.removeWatermark}
    <div class="top-indicator" style={isPreview ? "top: 10px; padding: 4px 12px; font-size: 10px; transform: translateX(-50%) scale(0.9);" : ""}>
        Created by justcode.my.id
    </div>
{/if}
    <div class="stack-wrapper">
        
        <div class="backing-card purple-accent"></div>

        {#each cards.slice(0, 3).reverse() as card, i (card.id)}
            {@const displayIndex = (cards.slice(0, 3).length - 1) - i}
            
            <div 
                class="card-base {card.bgClass}"
                class:active-card={displayIndex === 0}
                class:dragging={displayIndex === 0 && isDragging} 
                
                on:mousedown={displayIndex === 0 ? startDrag : null}
                on:touchstart={displayIndex === 0 ? startDrag : null}

                style="
                    z-index: {100 - displayIndex};
                    
                    /* LOGIKA TRANSFORMASI: STACK + SWIPE */
                    transform: 
                        {displayIndex === 0 && isDragging 
                            ? `translate(${currentX}px, ${currentX * 0.1}px) rotate(${currentX * 0.05}deg)` 
                            : 
                            displayIndex === 0 ? 'rotate(0deg)' :
                            displayIndex === 1 ? 'translate(8px, -5px) rotate(3deg)' :
                            displayIndex === 2 ? 'translate(-8px, 5px) rotate(-2deg)' : ''
                        };
                "
                in:scale={{ duration: 300, start: 0.9 }}
                out:fly={{ x: -300, opacity: 0, duration: 500 }}
            >
                {#if card.type === 'cover'}
                    <div class="cover-design">
                        <div class="abstract-bg"></div>
                        <div class="content-wrapper">
                            <div class="happy-row">
                                <span class="char c1">H</span><span class="char c2">A</span><span class="char c3">P</span><span class="char c4">P</span><span class="char c5">Y</span>
                            </div>
                            <h1 class="birthday-title">BIRTHDAY</h1>
                            <div class="name-badge">For {card.name} ❤️</div>
                        </div>
                    </div>

                {:else if card.type === 'text'}
                    <div class="text-design">
                        <div class="polaroid">
                            <img src={card.image} alt="Gif" loading="lazy">
                            <span class="icon-sparkle top-right">✨</span>
                            <span class="icon-sparkle bottom-left">💖</span>
                        </div>
                        <p class="msg" style="color: {card.color || '#555'}">"{card.text}"</p>
                        <span class="sender" style="color: {card.color || '#555'}">{card.from}</span>
                    </div>

                    {:else if card.type === 'simple-paper'}
                    <div class="simple-paper-design">
                        <div class="tape-strip"></div>
                        
                        <div class="paper-content">
                            <p class="paper-msg" style="color: {card.color}">"{card.text}"</p>
                            <span class="paper-sender" style="color: {card.color}">{card.from}</span>
                        </div>
                    </div>

                {:else if card.type === 'spotify'}
                    <div class="spotify-clean-card">
                        {#if card.title}
                            <h3 class="spotify-header">{card.title}</h3>
                        {/if}

                        <div class="single-track-wrapper">
                            <iframe 
                                src="https://open.spotify.com/embed/track/{card.trackId}?utm_source=generator&theme=0" 
                                width="100%" 
                                height="352" 
                                frameBorder="0" 
                                allowfullscreen="" 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                loading="lazy">
                            </iframe>
                        </div>
                    </div>

                {:else if card.type === 'final'}
                        <div class="final-design">
                            <div class="photo-stack-art">
                                <div class="photo-leaf p1"></div>
                                <div class="photo-leaf p2"></div>
                                <div class="photo-leaf p3">
                                    <div class="inner-photo">
                                        <div class="heart-icon">❤️</div>
                                    </div>
                                </div>
                            </div>
                            
                            <h2 class="gamja-font">Photo Memory</h2>
                            <p class="gamja-font">{card.text}</p>
                            
                            <button 
    class="reply-btn gamja-font" 
    on:click={isPreview ? () => alert("Halaman memories bisa di lihat saat udah jadi ya!") : openGallery}
    style="opacity: {isPreview ? 0.5 : 1}"
>
    Tap to Open
</button>
                        </div>
                    {/if}
            </div>
        {/each}

    </div>

    <div class="controls-area">
    {#if !isPreview} 
        <div class="buttons-row">
            <button on:click={prevCard} class="nav-btn prev">
                <i class="fa-solid fa-arrow-left"></i>
            </button>

            <button 
    class="circle-btn" 
    on:click={openSnapStudio} 
    title="Snap Studio">Create Photo</button>

            <button on:click={nextCard} class="nav-btn next">
                <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    {:else}
        <div class="flex flex-col items-center gap-2 translate-y-12">
            <p class="text-white text-xs opacity-70 font-bold bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                Mode Preview
            </p>
            <p class="text-black/60 text-[15px] font-bold animate-pulse tracking-wide">
                ← Geser kiri & kanan →
            </p>
        </div>
    {/if}
</div>

</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Homemade+Apple&display=swap');    
    .scene-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        perspective: 1000px;
    }

    .top-indicator {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        background: rgba(255,255,255,0.6);
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        color: #64748b;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    .stack-wrapper {
        position: absolute;
        top: 50%; 
        left: 50%;
        transform: translate(-50%, -50%); 
        width: 330px; 
        height: 460px; 
        z-index: 10;
        margin-top: -30px;
    }

    .backing-card {
        position: absolute; inset: 0;
        border-radius: 0;
        z-index: -1;
        transform: translate(-12px, -8px) rotate(-4deg);
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .purple-accent { background: #d8b4fe; } 

    .card-base {
        position: absolute;
        inset: 0;
        border-radius: 0;
        background: white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        border: 1px solid rgba(0,0,0,0.05);
        overflow: hidden;
        transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s;
        transform-origin: center center;
        user-select: none;
        touch-action: none;
    }

    .card-base.dragging {
        transition: none !important;
        cursor: grabbing;
        box-shadow: 0 20px 40px -5px rgba(0,0,0,0.2);
    }

    .active-card {
    }

    .controls-area {
        position: absolute;
        bottom: 80px; 
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 320px;
        z-index: 20;
    }
    
    .buttons-row { 
        display: flex; gap: 15px; width: 100%; justify-content: space-between; align-items: center; 
    }

    .nav-btn { 
        width: 50px;
        height: 50px; 
        border-radius: 50%; 
        border: none; 
        background: white; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
        font-size: 1.2rem; 
        cursor: pointer; 
        color: #1e293b;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .nav-btn:hover { transform: scale(1.1); background: #f8fafc; }
    
    .circle-btn { 
        flex: 1;
        height: 50px;
        background: rgba(242, 32, 172, 0.685); 
        border: 1px solid rgb(255, 255, 255); 
        border-radius: 50px; 
        font-weight: bold; 
        color: #fcfcfc; 
        cursor: pointer;
        backdrop-filter: blur(4px); 
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    .bg-lavender { background: #f3e8ff; }
    .bg-paper { background: #fff; background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px; }
    .bg-gradient-pink { background: linear-gradient(135deg, #fbcfe8, #f472b6); }

    .cover-design { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
    .abstract-bg { position: absolute; inset: -50px; background: radial-gradient(circle at 80% 20%, #fde047 0%, transparent 40%), radial-gradient(circle at 20% 80%, #f472b6 0%, transparent 40%); filter: blur(40px); opacity: 0.6; }
    .content-wrapper { z-index: 10; text-align: center; }
    .happy-row { display: flex; gap: 5px; justify-content: center; margin-bottom: 1px; }
    .char { font-family: 'Fredoka One', cursive; font-size: 4rem; color: white; text-shadow: 3px 3px 0px rgba(0,0,0,0.1); display: inline-block; }
    .c1 { transform: rotate(-5deg); text-shadow: 3px 3px 0 #ec4899; }
    .c2 { transform: rotate(3deg); text-shadow: 3px 3px 0 #a855f7; }
    .c3 { transform: rotate(-3deg); text-shadow: 3px 3px 0 #eab308; }
    .c4 { transform: rotate(5deg); text-shadow: 3px 3px 0 #3b82f6; }
    .c5 { transform: rotate(-4deg); text-shadow: 3px 3px 0 #f43f5e; }
    .birthday-title { font-family: 'Fredoka One', cursive; font-size: 3rem; color: #334155; letter-spacing: 2px; margin: 0; }
    .name-badge { margin-top: 20px; background: white; padding: 15px 25px; border-radius: 50px; font-family: 'Handlee', cursive; font-weight: bold; color: #475569; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transform: rotate(-2deg); display: inline-block; }

    .text-design { padding: 20px; height: 100%; display: flex; flex-direction: column; font-family: 'Handlee', cursive; }
    .polaroid {
    position: relative;
    background-color: #fff;
    background-image: url("https://www.transparenttextures.com/patterns/cream-paper.png");
    padding: 10px 10px 10px 10px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    transform: rotate(2deg);
    margin-bottom: 30px;
}
    .polaroid img { width: 100%; height: 180px; object-fit: contain; display: block; pointer-events: none; }
    .polaroid::before {
    content: "";
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%) rotate(-2deg);
    width: 60px;
    height: 20px;
    background: rgba(244, 114, 182, 0.5);
    backdrop-filter: blur(2px);
    z-index: 2;
}
    .msg {
        /* Pastikan font dan warna tetap ada */
        font-family: 'Gamja Flower', cursive;
        font-size: 1.2rem; /* Sesuaikan ukuran */
        line-height: 1.2;
        text-align: center;
        
        /* INI KUNCI AGAR TEKS MEMBUNGKUS */
        white-space: pre-wrap;      /* Baca Enter + Wrap Otomatis */
        word-wrap: break-word;      /* Potong kata jika kepanjangan */
        overflow-wrap: break-word;  /* Standar baru agar tidak tembus */
        max-width: 100%;            /* Batasi lebar agar tidak melebar */
        display: block;             /* Pastikan dia blok, bukan inline */
        padding: 0 10px;            /* Jarak kiri kanan dikit biar cantik */
    }
    .sender { font-family: 'Homemade Apple', cursive; margin-top: auto; text-align: right; font-weight: bold; color: #94a3b8; }

    .final-design { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; }
    .big-icon { font-size: 4rem; margin-bottom: 10px; }
    .final-design h2 { font-family: 'Fredoka One'; color: #be185d; font-size: 2rem; margin: 0 0 10px 0; }
    .reply-btn { margin-top: 30px; background: #1e293b; color: white; padding: 12px 30px; border-radius: 50px; font-weight: bold; border: none; cursor: pointer; transition: transform 0.2s; }
    .reply-btn:active { transform: scale(0.95); }

    .spotify-clean-card {
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, #f713ff 0%, #000000 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        border-radius: 0px;
    }

    .spotify-header {
        font-family: 'Gamja Flower', cursive;
        color: #ffffff;
        margin-bottom: 25px;
        font-size: 1.2rem;
    }

    .single-track-wrapper {
        width: 100%;
        max-width: 330px;
        border-radius: 0px;
        overflow: hidden;
        line-height: 0;
        transition: transform 0.3s ease;
    }

    .single-track-wrapper:hover {
        transform: translateY(-5px);
    }

    @media (min-width: 1024px) {
        .stack-wrapper {
            width: 380px;
            height: 500px;
            margin-top: -0px;
        }
        .controls-area {
            max-width: 450px;
            bottom: 15px;
        }

        .card-base:hover {
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }
        .msg { font-size: 1.35rem; line-height: 1.5; text-align: center; }

    }

    .icon-sparkle {
    position: absolute;
    font-size: 1.2rem;
    z-index: 5;
}
.top-right { top: 30px; right: 5px; }
.bottom-left { bottom: 30px; left: 5px; }

.photo-stack-art {
        position: relative;
        width: 120px;
        height: 120px;
        margin: 0 auto 40px;
        animation: global-float 4s ease-in-out infinite;
        will-change: transform;
    }

    .photo-leaf {
        position: absolute;
        width: 120px;
        height: 120px;
        background: white;
        border: 1px solid #ddd;
        box-shadow: 2px 4px 10px rgba(0,0,0,0.1);
        border-radius: 4px;
        left: 5px;
        top: 10px;
    }

    .p1 { transform: rotate(-15deg); background: #f9fafb; }
    .p2 { transform: rotate(10deg); background: #f3f4f6; }
    .p3 { 
        transform: rotate(-5deg); 
        z-index: 3; 
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
    }

    .inner-photo {
        width: 100%;
        height: 70%;
        background: #fbcfe8;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 2px;
    }

    .heart-icon {
        font-size: 2rem;
        animation: heartbeat 1.5s ease-in-out infinite;
    }


    @keyframes global-float {
        0%, 100% { transform: translateY(0) rotate(0); }
        50% { transform: translateY(-15px) rotate(5deg); }
    }

    @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }

    .gamja-font {
        font-family: 'Gamja Flower', cursive; font-size: 25px;
    }
    
    .simple-paper-design {
        height: 100%;
        padding: 30px 20px;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .tape-strip {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%) rotate(-2deg);
        width: 100px;
        height: 30px;
        background-color: rgba(255, 255, 255, 0.4);
        border-left: 2px dotted rgba(0,0,0,0.1);
        border-right: 2px dotted rgba(0,0,0,0.1);
        backdrop-filter: blur(2px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 5;
    }

    .paper-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        border: 1px dashed rgba(0,0,0,0.08);
        padding: 5px;
        border-radius: 4px;
        padding-top: 0px;
    }

    .paper-msg {
        font-family: 'Gamja Flower', cursive;
        font-size: 1.35rem;
        line-height: 1.5; /* Jarak antar baris lebih lega */
        text-align: center;
        margin-top: 10px;
        color: #444;

        /* INI KUNCI AGAR TEKS MEMBUNGKUS */
        white-space: pre-wrap;       /* PENTING: Ganti pre-line jadi pre-wrap */
        word-wrap: break-word;       /* Agar kata panjang turun ke bawah */
        overflow-wrap: break-word;   /* Agar tidak tembus kertas */
        width: 100%;                 /* Paksa lebar ikut kertas */
        max-width: 100%;
    }

    .paper-sender {
        font-family: 'Homemade Apple', cursive;
        font-size: 1rem;
        font-weight: bold;
        text-align: right;
        margin-top: auto;
        opacity: 0.8;
    }

    @media (min-width: 1024px) {
        
        .simple-paper-design {
            padding: 30px 10px;
        }

        .tape-strip {
            width: 140px;
            height: 40px;
            top: -18px;
        }

        .paper-content {
            padding: 10px;
            border-width: 2px;
        }

        .paper-msg {
            font-size: 1.1rem;
            line-height: 1.8;
        }

        .paper-sender {
            font-size: 1.2rem;
        }
    }
</style>