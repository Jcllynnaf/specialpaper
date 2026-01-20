<script>
    import { fade, scale } from 'svelte/transition';
    import { goto } from '$app/navigation';

    const photos = [
        { url: 'https://i.pinimg.com/736x/db/ec/24/dbec24c5298f0dd717b1acf2586adb2b.jpg', label: 'moment 1', rotate: '-5deg', top: '4%', left: '6%' },
        { url: 'https://i.pinimg.com/736x/26/4e/ea/264eeab3b730247de4c6489ecb512689.jpg', label: 'moment 2', rotate: '6deg', top: '5%', left: '55%' },
        { url: 'https://i.pinimg.com/736x/42/76/11/427611d7fcffbbf37ce1821e52c5c86a.jpg', label: 'moment 3', rotate: '-8deg', top: '40%', left: '55%' },
        { url: 'https://i.pinimg.com/736x/dd/fa/a4/ddfaa44d045dbe6177ab633f259d91ad.jpg', label: 'moment 4', rotate: '4deg', top: '38%', left: '6%' },
        { url: 'https://i.pinimg.com/736x/70/9c/05/709c05d339b60779d491485058253d7a.jpg', label: 'moment 5', rotate: '-4deg', top: '75%', left: '55%' },
        { url: 'https://i.pinimg.com/736x/aa/72/61/aa726129fc025a530e7d20925b7eb86d.jpg', label: 'moment 6', rotate: '7deg', top: '75%', left: '6%' },
    ];
</script>

<div class="wall-container" in:fade={{ duration: 800 }}>
    <div class="retro-header">
        <button class="back-btn" on:click={() => goto('/')} in:fade={{ delay: 1000 }}>Back to Card</button> 
        <h1 class="title">Memories</h1>
    </div>

    <div class="wall-area">
    {#each photos as photo, i}
        <div 
            class="photo-pin photo-{i}" 
            style="top: {photo.top}; left: {photo.left}; transform: rotate({photo.rotate});"
            in:scale={{ delay: i * 150, duration: 600, start: 0.5 }}
        >
            <div class="nail"></div>
            <div class="polaroid">
                <img src={photo.url} alt={photo.label} />
                <p class="caption">{photo.label}</p>
            </div>
        </div>
    {/each}
</div>
    
    <button class="next-step" on:click={() => goto('/createphoto')} in:fade={{ delay: 1000 }}>
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
        position: fixed; bottom: 15px; left: 40px;
        background: #ec468b; color: white;
        padding: 12px 20px; border-radius: 50px;
        font-family: 'Fredoka One'; font-size: 1rem;
        border: none; cursor: pointer;
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
        z-index: 10; box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .polaroid {
        background: white; padding: 8px 8px 20px 8px;
        box-shadow: 5px 10px 20px rgba(0,0,0,0.1);
        border: 1px solid #ddd;
    }

    .polaroid img {
        width: 100%; height: 120px;
        object-fit: cover; border: 1px solid #eee;
    }

    .caption {
        font-family: 'Handlee', cursive;
        text-align: center; margin-top: 8px;
        color: #334155; font-size: 0.9rem;
    }

    .next-step {
        position: fixed; bottom: 15px; right: 40px;
        background: #1e293b; color: white;
        padding: 12px 20px; border-radius: 50px;
        font-family: 'Fredoka One'; font-size: 1rem;
        border: none; cursor: pointer;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2); z-index: 100;
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