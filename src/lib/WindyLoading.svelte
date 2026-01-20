<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';

    export let loadingText = "Sending wishes through the wind...";
</script>

<div class="loading-overlay" out:fade={{ duration: 800 }}>
    <div class="wind-scene">
        <div class="paper-fly">
            <div class="paper-content"></div>
        </div>
        
        <div class="wind-line line-1"></div>
        <div class="wind-line line-2"></div>
        <div class="wind-line line-3"></div>
    </div>

    <p class="loading-text gamja-font">{loadingText}</p>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap');

    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #f399ca;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .wind-scene {
        position: relative;
        width: 200px;
        height: 200px;
    }

    .paper-fly {
        position: absolute;
        width: 80px;
        height: 100px;
        background: white;
        border: 1px solid #eee;
        box-shadow: 5px 15px 30px rgba(0,0,0,0.1);
        border-radius: 2px;
        animation: paperWind 4s ease-in-out infinite;
        transform-style: preserve-3d;
    }

    .paper-content {
        width: 100%;
        height: 100%;
        background: linear-gradient(transparent 10px, #f0f0f0 10px, #f0f0f0 12px, transparent 12px);
        background-size: 100% 15px;
        padding: 10px;
    }

    @keyframes paperWind {
        0% {
            transform: translate(-50px, 50px) rotateX(0deg) rotateY(0deg) rotateZ(-20deg);
        }
        25% {
            transform: translate(50px, -20px) rotateX(45deg) rotateY(20deg) rotateZ(10deg);
        }
        50% {
            transform: translate(100px, 40px) rotateX(0deg) rotateY(45deg) rotateZ(30deg);
        }
        75% {
            transform: translate(20px, 80px) rotateX(-45deg) rotateY(10deg) rotateZ(10deg);
        }
        100% {
            transform: translate(-50px, 50px) rotateX(0deg) rotateY(0deg) rotateZ(-20deg);
        }
    }

    .wind-line {
        position: absolute;
        height: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        animation: windLines 2s linear infinite;
    }

    .line-1 { width: 80px; top: 40%; left: -100px; animation-delay: 0s; }
    .line-2 { width: 120px; top: 60%; left: -120px; animation-delay: 0.5s; }
    .line-3 { width: 60px; top: 80%; left: -80px; animation-delay: 1.2s; }

    @keyframes windLines {
        0% { transform: translateX(0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(400px); opacity: 0; }
    }

    .loading-text {
        margin-top: 40px;
        font-size: 1.5rem;
        color: #ff006a;
        letter-spacing: 1px;
    }

    .gamja-font {
        font-family: 'Gamja Flower', cursive;
    }
</style>