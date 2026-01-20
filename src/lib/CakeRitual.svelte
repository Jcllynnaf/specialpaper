<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    let candles = [
        { id: 1, active: true, left: 20, top: 25 }, 
        { id: 2, active: true, left: 50, top: 40 }, 
        { id: 3, active: true, left: 80, top: 20 }  
    ];

	let audioContext, analyser, microphone;
	let isListening = false;
    let micPermitted = false;
    let lastBlowTime = 0;
    let isTransitioning = false; 
    let showError = false;

    function triggerError() {
        showError = true;
        setTimeout(() => { showError = false; }, 4000);
    }
    
	async function startMic() {
        try {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			microphone = audioContext.createMediaStreamSource(stream);
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 512;
			microphone.connect(analyser);
			
            micPermitted = true;
            isListening = true;
            if (audioContext.state === 'suspended') await audioContext.resume();
			detectBlow();
		} catch (err) {
            triggerError();
        }
	}

	function detectBlow() {
		if (!isListening) return;
		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(dataArray);
		let sum = 0;
		for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
		let average = sum / dataArray.length;

		if (average > 35) { 
            const now = Date.now();
            if (now - lastBlowTime > 1000) {
                extinguishOneCandle();
                lastBlowTime = now;
            }
		}
		requestAnimationFrame(detectBlow);
	}

    function extinguishOneCandle() {
        const activeCandles = candles.filter(c => c.active);
        
        if (activeCandles.length > 0) {
            const target = activeCandles[Math.floor(Math.random() * activeCandles.length)];
            candles = candles.map(c => c.id === target.id ? { ...c, active: false } : c);
            
            checkDone();
        }
    }

    function handleManualClick() {
        const now = Date.now();
        if (now - lastBlowTime > 500) { 
            extinguishOneCandle();
            lastBlowTime = now;
        }
    }

	function checkDone() {
		if (candles.every((c) => !c.active)) {
			isListening = false;
            if(audioContext) audioContext.close();
            isTransitioning = true;
			setTimeout(() => { 
                dispatch('completed'); 
            }, 1200); 
		}
	}
</script>

<div class="overlay">
    {#if showError}
        <div class="error-toast">
            <div class="error-content">
                <i class="fa-solid fa-microphone-slash" style="margin-bottom:5px;"></i>
                <span>Microphone permission required!<br>or Manual candle click.</span>
            </div>
            <div class="progress-track"><div class="progress-fill"></div></div>
        </div>
    {/if}

    <div class="bg-abstract">
         <div class="orb o1"></div>
         <div class="orb o2"></div>
         <div class="orb o3"></div>
         <div class="grain"></div>
    </div>

    {#if isTransitioning}
        <div class="transition-fill"></div>
    {/if}

    <div class="ritual-card" class:fade-out={isTransitioning}>
        
        <h2 class="wish-title">Blow Out The Candles</h2>

        <div class="cake-wrapper" on:click={handleManualClick}>
            
            <div class="cake">
                <div class="plate"></div>
                <div class="layer layer-bottom"></div>
                <div class="layer layer-middle"></div>
                <div class="layer layer-top"></div>
                <div class="icing"></div>
                <div class="drip drip1"></div>
                <div class="drip drip2"></div>
                <div class="drip drip3"></div>
                
                <div class="candles-group">
                    {#each candles as candle (candle.id)}
                        <div 
                            class="candle" 
                            style="
                                left: {candle.left}%; 
                                top: {candle.top}px;
                                transform: translateX(-50%); 
                                z-index: 20;"
                        >
                            <div class="wax"></div>
                            <div class="wick"></div>

                            {#if candle.active}
                                <div class="flame"></div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

        </div>

        <div class="ui-controls">
            {#if !micPermitted}
                <button on:click={startMic} class="mic-btn">
             Allow Access to Mic
                </button>
            {:else if isListening}
                <div class="pulse-text">Blow or Click</div>
            {:else}
                <div class="h-spacer"></div> 
            {/if}
        </div>

    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
    :root {
        --vanilla: #f0d0ee;
        --vanilla-light: #f4d9f2;
        --vanilla-lighter: #f6e0f7;
        --chocolate: #553c13;
        --chocolate-light: #694a17;
        --chocolate-dark: #30220b;
        --candle-color: #7B020B;
        --candle-light: #96030e;
        --plate: #ccc;
        --plate-dark: #b3b3b3;
    }

    .overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 20px; }
    
    .bg-abstract { position: absolute; inset: 0; background: #333; overflow: hidden; }
    .orb { position: absolute; border-radius: 50%; filter: blur(20px); opacity: 0.6; animation: float 8s infinite ease-in-out; }
    .o1 { width: 300px; height: 300px; background: #fbcfe8; top: -50px; left: -50px; }
    .o2 { width: 400px; height: 400px; background: #fd47c0; bottom: -100px; right: -50px; animation-delay: 2s; }
    .o3 { width: 250px; height: 250px; background: #fdb5f0; top: 40%; left: 30%; animation-delay: 4s; }
    .grain { position: absolute; inset: 0; opacity: 0.4; background-image: url('https://www.transparenttextures.com/patterns/stardust.png'); }

    .ritual-card {
        position: relative; width: 100%; max-width: 380px; padding: 2rem 0;
        border-radius: 10px; background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5);
        display: flex; flex-direction: column; align-items: center;
        transition: opacity 0.8s;
    }
    .ritual-card.fade-out { opacity: 0; }
    .wish-title { font-family: 'Fredoka One', cursive; font-size: 1rem; color: #fff; text-transform: uppercase; margin-bottom: 5rem; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

    .cake-wrapper {
        position: relative;
        width: 250px;
        height: 200px;
        cursor: pointer;
        transform: scale(0.85);
    }

    .cake {
        position: absolute;
        width: 250px;
        height: 200px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .plate {
        width: 270px;
        height: 110px;
        position: absolute;
        bottom: -10px;
        left: -10px;
        background-color: var(--plate);
        border-radius: 50%;
        box-shadow:
            0 2px 0 var(--plate-dark),
            0 4px 0 var(--plate-dark),
            0 5px 40px rgba(0,0,0,0.5);
    }

    .cake > * { position: absolute; }

    .layer {
        position: absolute;
        display: block;
        width: 250px;
        height: 100px;
        border-radius: 50%;
        background-color: var(--chocolate);
        box-shadow:
            0 2px 0px var(--chocolate-light),
            0 4px 0px var(--chocolate-dark),
            0 6px 0px var(--chocolate-dark),
            0 8px 0px var(--chocolate-dark),
            0 10px 0px var(--chocolate-dark),
            0 12px 0px var(--chocolate-dark),
            0 14px 0px var(--chocolate-dark),
            0 16px 0px var(--chocolate-dark),
            0 18px 0px var(--chocolate-dark),
            0 20px 0px var(--chocolate-dark),
            0 22px 0px var(--chocolate-dark),
            0 24px 0px var(--chocolate-dark),
            0 26px 0px var(--chocolate-dark),
            0 28px 0px var(--chocolate-dark),
            0 30px 0px var(--chocolate-dark);
    }

    .layer-top { top: 0px; }
    .layer-middle { top: 33px; }
    .layer-bottom { top: 66px; }

    .icing {
        top: 2px;
        left: 5px;
        background-color: var(--vanilla);
        width: 240px;
        height: 90px;
        border-radius: 50%;
    }
    .icing::before {
        content: "";
        position: absolute;
        top: 4px; right: 5px; bottom: 6px; left: 5px;
        background-color: var(--vanilla-light);
        box-shadow:
            0 0 4px var(--vanilla-lighter),
            0 0 4px var(--vanilla-lighter),
            0 0 4px var(--vanilla-lighter);
        border-radius: 50%;
        z-index: 1;
    }

    .drip {
        display: block;
        width: 50px;
        height: 60px;
        border-bottom-left-radius: 25px;
        border-bottom-right-radius: 25px;
        background-color: var(--vanilla);
    }

    .drip1 {
        top: 53px; left: 5px;
        transform: skewY(15deg);
        height: 48px; width: 40px;
    }
    .drip2 {
        top: 69px; left: 181px;
        transform: skewY(-15deg);
    }
    .drip3 {
        top: 54px; left: 90px;
        width: 80px;
        border-bottom-left-radius: 40px;
        border-bottom-right-radius: 40px;
    }

    .candles-group {
        position: absolute;
        width: 180px;
        height: 50px;
        top: -35px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 20;
    }
    .candle {
        position: absolute;
        width: 16px;
        height: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .wax {
        width: 100%; 
        height: 100%;
        background-color: var(--candle-color);
        border-radius: 4px;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        position: relative;
    }
    .candle::before {
        content: "";
        position: absolute;
        top: 0; left: 0;
        width: 16px; height: 8px;
        border-radius: 50%;
        background-color: var(--candle-light);
    }

    .flame {
        position: absolute;
        background-color: orange;
        width: 15px;
        height: 35px;
        border-radius: 10px 10px 10px 10px / 25px 25px 10px 10px;
        top: -34px;
        left: 50%;
        margin-left: -7.5px;
        z-index: 10;
        box-shadow:
            0 0 10px rgba(255, 165, 0, 0.5),
            0 0 20px rgba(255, 165, 0, 0.5),
            0 0 60px rgba(255, 165, 0, 0.5),
            0 0 80px rgba(255, 165, 0, 0.5);
        transform-origin: 50% 90%;
        animation: flicker 1s ease-in-out alternate infinite;
    }

    .ui-controls { margin-top: 30px; height: 60px; display: flex; align-items: center; justify-content: center; }
    .mic-btn { background: #3b1e39; color: white; padding: 12px 30px; border-radius: 50px; font-weight: bold; border: 2px solid #55334c; cursor: pointer; display: flex; gap: 8px; font-size: 1.1rem; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.3); transition: transform 0.1s; }
    .mic-btn:active { transform: scale(0.95); }
    .pulse-text { font-weight: 900; letter-spacing: 2px; color: #fff; animation: pulse 1s infinite; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
    .h-spacer { height: 10px; }
    .transition-fill {
        position: fixed;
        top: 50%;
        left: 50%;
        width: 150vmax;
        height: 150vmax;
        transform: translate(-50%, -50%) scale(0); 
        z-index: 100;
        background: radial-gradient(circle, #fff 0%, #fe8aed 20%, #f916c0 60%, #ff00d9 100%);
        border-radius: 50%;
        pointer-events: none;
        
        animation: fill-screen 1.2s forwards ease-in-out;
    }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }
    @keyframes fill-screen {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
        }
        20% {
            opacity: 1;
        }
        100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }    
    @keyframes flicker {
        0% { transform: skewX(5deg); box-shadow: 0 0 10px rgba(255, 165, 0, 0.2), 0 0 20px rgba(255, 165, 0, 0.2), 0 0 60px rgba(255, 165, 0, 0.2), 0 0 80px rgba(255, 165, 0, 0.2); }
        25% { transform: skewX(-5deg); box-shadow: 0 0 10px rgba(255, 165, 0, 0.5), 0 0 20px rgba(255, 165, 0, 0.5), 0 0 60px rgba(255, 165, 0, 0.5), 0 0 80px rgba(255, 165, 0, 0.5); }
        50% { transform: skewX(10deg); box-shadow: 0 0 10px rgba(255, 165, 0, 0.3), 0 0 20px rgba(255, 165, 0, 0.3), 0 0 60px rgba(255, 165, 0, 0.3), 0 0 80px rgba(255, 165, 0, 0.3); }
        75% { transform: skewX(-10deg); box-shadow: 0 0 10px rgba(255, 165, 0, 0.4), 0 0 20px rgba(255, 165, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.4), 0 0 80px rgba(255, 165, 0, 0.4); }
        100% { transform: skewX(5deg); box-shadow: 0 0 10px rgba(255, 165, 0, 0.5), 0 0 20px rgba(255, 165, 0, 0.5), 0 0 60px rgba(255, 165, 0, 0.5), 0 0 80px rgba(255, 165, 0, 0.5); }
    }

    .error-toast {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        top: 1.7%;
        background: #d63384;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        overflow: hidden;
        min-width: 260px;
        max-width: 90%;
        animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .error-content {
        padding: 5px;
        color: #fff;
        font-family: 'Fredoka One', cursive;
        font-size: 0.95rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        line-height: 1.5;
    }

    .progress-track { width: 100%; height: 4px; background: rgba(255,255,255,0.1); }
    .progress-fill {
        height: 100%; width: 100%;
        background: #ffffff;
        animation: shrinkBar 3s linear forwards;
    }

    @media (min-width: 1024px) {
        .error-toast {
            top: 3%;
            
            min-width: 350px;
        }
        
        .error-content {
            font-size: 1.1rem;
            flex-direction: row;
            text-align: left;
        }
    }

    @keyframes popIn {
        from { opacity: 0; transform: translate(-50%, -20px) scale(0.9); }
        to { opacity: 1; transform: translate(-50%, 0) scale(1); }
    }
    @keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }
</style>