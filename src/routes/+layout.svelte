<script>
    import "../app.css";
    import { onMount } from 'svelte';
    import { bgmStore } from '$lib/audioStore';

    let audio;
    let isFullscreen = false;

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.log(`Error fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    $: if (audio) {
        if ($bgmStore.isPlaying) {
            audio.play().catch(() => console.log("Menunggu interaksi user..."));
        } else {
            audio.pause();
        }
    }

    onMount(() => {
        const handleFullscreenChange = () => {
            isFullscreen = !!document.fullscreenElement;
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    });
</script>

<audio bind:this={audio} src="/music/bgm.mp3" loop preload="auto"></audio>

{#if $bgmStore.isVisible}
    <div class="control-group">
        
        <button 
            class="circle-btn"
            on:click={() => bgmStore.togglePlay()}
            title="Toggle Music"
        >
            {#if $bgmStore.isPlaying}
                <i class="fa-solid fa-volume-high"></i>
            {:else}
                <i class="fa-solid fa-volume-xmark"></i>
            {/if}
        </button>

        <button 
            class="circle-btn"
            on:click={toggleFullscreen}
            title="Toggle Fullscreen"
        >
            {#if isFullscreen}
                <i class="fa-solid fa-compress"></i> 
            {:else}
                <i class="fa-solid fa-expand"></i> 
            {/if}
        </button>

    </div>
{/if}

<slot />

<style>
    .control-group {
        position: fixed;
        z-index: 100;
        top: 20px;
        right: 20px;
        display: flex;
        gap: 15px;
        flex-direction: column;
    }

    .circle-btn {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.8);
        border: 2px solid #ff91c9;
        color: #d63384;
        
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        backdrop-filter: blur(4px);
        transition: all 0.2s ease;
    }

    .circle-btn:hover {
        transform: scale(1.1);
        background: #fff;
    }

    .circle-btn:active {
        transform: scale(0.95);
    }

    @media (max-width: 640px) {
        .control-group {
            top: 10px;
            right: 15px;
            gap: 10px;
        }
        .circle-btn {
            width: 40px;
            height: 40px;
            font-size: 1rem;
        }
    }
</style>