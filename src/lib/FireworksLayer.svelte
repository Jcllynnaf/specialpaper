<script>
    import { onMount } from 'svelte';
    import confetti from 'canvas-confetti';

    let rockets = [];
    let idCounter = 0;

    const colors = ['#ff0055', '#00ffaa', '#5500ff', '#ffcc00', '#ff00ff', '#00ccff'];

    function launchSingleRocket() {
        const id = idCounter++;
        const startX = 5 + Math.random() * 90; 
        const endY = 30 + Math.random() * 40;   
        const duration = 1200 + Math.random() * 600;
        const color = colors[Math.floor(Math.random() * colors.length)];

        rockets = [...rockets, { id, startX, endY, duration, color }];

        setTimeout(() => {
            explode(startX, endY, color);
            removeRocket(id);
        }, duration);
    }

    function launchVolley() {
        const count = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                launchSingleRocket();
            }, i * 300);
        }
    }

    function explode(x, y, color) {
        const originX = x / 100;
        const originY = y / 100;

        confetti({
            particleCount: 50,
            spread: 100,
            origin: { x: originX, y: originY },
            colors: [color, '#ffffff'],
            disableForReducedMotion: true,
            gravity: 1,
            scalar: 1, 
            ticks: 300
        });
    }

    function removeRocket(id) {
        rockets = rockets.filter(r => r.id !== id);
    }

    onMount(() => {
        setTimeout(launchVolley, 1500);
        const interval = setInterval(() => {
            launchVolley();
        }, 20000);

        return () => clearInterval(interval);
    });
</script>

<div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {#each rockets as rocket (rocket.id)}
        <div 
            class="rocket"
            style="
                --start-x: {rocket.startX}%;
                --end-y: {rocket.endY}%;
                --duration: {rocket.duration}ms;
                --color: {rocket.color};
            "
        >
            <div class="rocket-head"></div>
            <div class="rocket-trail"></div>
        </div>
    {/each}
</div>

<style>
    .rocket {
        position: absolute;
        left: var(--start-x);
        bottom: 0;
        width: 4px;
        height: 4px;
        animation: launch var(--duration) ease-out forwards;
    }

    .rocket-head {
        width: 6px;
        height: 12px;
        background-color: var(--color);
        border-radius: 50%;
        box-shadow: 0 0 15px var(--color), 0 0 30px var(--color);
    }

    .rocket-trail {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 100px;
        background: linear-gradient(to bottom, var(--color), transparent);
        opacity: 0.7;
    }

    @keyframes launch {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(calc(-100vh + var(--end-y) + 5vh)) scale(0.5); opacity: 0; }
    }
</style>