<script>
    import { fade, scale } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { getGift } from '$lib/firebase'; 

    let slug = $page.params.slug;
    let loading = true;
    let senderName = '';

    // Layout posisi foto (sama seperti aslinya)
    const layoutConfig = [
        { rotate: '-5deg', top: '4%', left: '6%' },
        { rotate: '6deg', top: '5%', left: '55%' },
        { rotate: '-8deg', top: '40%', left: '55%' },
        { rotate: '4deg', top: '38%', left: '6%' },
        { rotate: '-4deg', top: '75%', left: '55%' },
        { rotate: '7deg', top: '75%', left: '6%' },
    ];

    let photos = layoutConfig.map((pos, i) => ({
        ...pos,
        url: '', 
        label: 'Loading...'
    }));

    onMount(async () => {
        try {
            // Langsung ambil data secepat mungkin
            const data = await getGift(slug);
            
            if (data && data.memories) {
                senderName = data.sender;
                photos = layoutConfig.map((pos, i) => {
                    const userPhoto = data.memories[i];
                    return {
                        ...pos,
                        url: userPhoto?.url || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=No+Image', 
                        label: userPhoto?.label || `Moment ${i+1}`
                    };
                });
            }
        } catch (error) {
            console.error("Gagal memuat kenangan:", error);
        } finally {
            // Matikan loading segera setelah data diproses
            loading = false;
        }
    });

    function openPhotobooth() {
        goto(`/${slug}/createphoto`);
    }
</script>

<div class="wall-container" in:fade={{ duration: 800 }}>
    <div class="retro-header">
        <button class="back-btn" on:click={() => goto('/' + slug)} in:fade={{ delay: 1000 }}>
            Back to Card
        </button> 
        <h1 class="title">Memories</h1>
    </div>

    {#if !loading}
        <div class="wall-area">
        {#each photos as photo, i}
            <div 
                class="photo-pin photo-{i}" 
                style="top: {photo.top}; left: {photo.left}; transform: rotate({photo.rotate});"
                in:scale={{ delay: i * 150, duration: 600, start: 0.5 }}
            >
                <div class="nail"></div>
                <div class="polaroid">
                    <img src={photo.url} alt={photo.label} loading="lazy" />
                    <p class="caption">{photo.label}</p>
                </div>
            </div>
        {/each}
        </div>
    {:else}
        <div class="loading-wrapper">
            <div class="cute-icon-group">
                <div class="camera-emoji">📸</div>
                <div class="heart-emoji h1">❤️</div>
                <div class="heart-emoji h2">✨</div>
            </div>
            <p class="font-['Fredoka_One'] text-pink-500 animate-pulse mt-4 tracking-wide">
                Mengambil album kenangan...
            </p>
        </div>
    {/if}
    
    <button class="next-step" on:click={openPhotobooth} in:fade={{ delay: 1000 }}>
        Make your own!
    </button>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Handlee&display=swap');

    .wall-container {
        min-height: 100vh;
        width: 100%;
        background-color: #fec7f9;
        background-image: 
            radial-gradient(#fde68a 1px, transparent 1px),
            linear-gradient(45deg, #fec7f9 25%, #fffbeb 25%, #fffbeb 50%, #fec7f9 50%, #fec7f9 75%, #fffbeb 75%, #fffbeb 100%);
        background-size: 20px 20px, 100px 100px;
        position: relative;
        overflow-y: auto;
        padding-bottom: 120px;
    }

    .retro-header {
        padding: 20px 1px 1px 20px;
        text-align: center;
        z-index: 10;
        position: sticky;
        top: 0;
    }

    .back-btn {
        position: fixed;
        bottom: 15px; left: 40px;
        background: #ec468b; color: white;
        padding: 12px 20px; border-radius: 50px;
        font-family: 'Fredoka One'; font-size: 1rem;
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2); z-index: 100;
    }

    .title {
        font-family: 'Fredoka One', cursive;
        color: #be185d; font-size: 2rem;
        text-shadow: 3px 3px 0 #fbcfe8;
    }

    .wall-area {
        position: relative;
        width: 100%;
        max-width: 600px;
        height: 750px;
        margin: 0 auto;
    }

    .photo-pin {
        position: absolute;
        width: 180px;
        transition: transform 0.3s ease;
        z-index: 2;
    }

    .photo-pin:hover {
        transform: scale(1.1) rotate(0deg) !important;
        z-index: 50;
    }

    .nail {
        width: 12px; height: 12px;
        background: radial-gradient(circle at 30% 30%, #94a3b8, #475569);
        border-radius: 50%; position: absolute;
        top: -8px; left: 50%; transform: translateX(-50%);
        z-index: 10;
        box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .polaroid {
        background: white;
        padding: 8px 8px 20px 8px;
        box-shadow: 5px 10px 20px rgba(0,0,0,0.1);
        border: 1px solid #ddd;
    }

    .polaroid img {
        width: 100%; height: 120px;
        object-fit: cover;
        border: 1px solid #eee;
    }

    .caption {
        font-family: 'Handlee', cursive;
        text-align: center; margin-top: 8px;
        color: #334155; font-size: 0.9rem;
    }

    .next-step {
        position: fixed;
        bottom: 15px; right: 40px;
        background: #1e293b; color: white;
        padding: 12px 20px; border-radius: 50px;
        font-family: 'Fredoka One'; font-size: 1rem;
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2); z-index: 100;
    }

    /* --- STYLE UNTUK ANIMASI LOADING BARU --- */
    .loading-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-top: 100px;
        height: 60vh;
        width: 100%;
    }

    .cute-icon-group {
        position: relative;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .camera-emoji {
        font-size: 4rem;
        animation: bounce 2s infinite ease-in-out;
        z-index: 2;
    }

    .heart-emoji {
        position: absolute;
        font-size: 1.5rem;
        opacity: 0;
    }

    .h1 { top: -10px; right: -10px; animation: floatHeart 2s infinite ease-in-out; color: #ec4899; }
    .h2 { bottom: 0; left: -10px; animation: floatHeart 2.5s infinite 0.5s ease-in-out; color: #fbbf24; font-size: 1.2rem; }

    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    @keyframes floatHeart {
        0% { transform: translateY(0) scale(0.5); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(-20px) scale(1.2); opacity: 0; }
    }

    @media (max-width: 600px) {
        .photo-pin { width: 150px; }
        .wall-area { height: 600px; }
    }

    @media (min-width: 1024px) {
        .wall-area {
            max-width: 1100px;
            height: 650px;
        }

        .photo-pin {
            width: 190px;
        }

        .photo-0 { top: 5% !important; left: 5% !important; }
        .photo-1 { top: 10% !important; left: 40% !important; }
        .photo-2 { top: 5% !important; left: 75% !important; }
        .photo-3 { top: 50% !important; left: 10% !important; }
        .photo-4 { top: 55% !important; left: 45% !important; }
        .photo-5 { top: 50% !important; left: 80% !important; }
    }
</style>