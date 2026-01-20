<script>
    import { fade, fly, scale, slide } from 'svelte/transition';
    import { goto } from '$app/navigation';
    
    const MAX_PHOTOS = 3; 
    
    let step = 'upload';
    let uploadedImages = [];
    
    let igRatio = '4:5';
    
    let fileInput;
    let canvas;
    let resultDataUrl = null;
    let loadingText = "Preparing magic...";
    let isSharing = false;
    function triggerUpload() { fileInput.click(); }

    function handleFileSelect(event) {
        const files = Array.from(event.target.files);
        const remainingSlots = MAX_PHOTOS - uploadedImages.length;
        const filesToProcess = files.slice(0, remainingSlots);

        filesToProcess.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedImages = [...uploadedImages, e.target.result];
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function removeImage(index) {
        uploadedImages = uploadedImages.filter((_, i) => i !== index);
    }

    async function processPhotos() {
        if (uploadedImages.length === 0) return;
        step = 'processing';
        
        const texts = ["Developing photos...", "Arranging layout...", "Finalizing PNG..."];
        for (let i = 0; i < texts.length; i++) {
            loadingText = texts[i];
            await new Promise(r => setTimeout(r, 800));
        }

        await generateResult();
        step = 'result';
    }

    async function generateResult() {
        const ctx = canvas.getContext('2d');

        const bgWhite = '#ffffff';
        const bgPaper = '#fdfbf7';
        const loadedImages = [];
        for (let src of uploadedImages) {
            const img = new Image();
            img.src = src;
            img.crossOrigin = "anonymous"; 
            await new Promise(r => img.onload = r);
            loadedImages.push(img);
        }

        if (igRatio === '1:1') {
            const size = 1080;
            canvas.width = size;
            canvas.height = size;
            ctx.fillStyle = bgWhite;
            ctx.fillRect(0, 0, size, size);

            const margin = 60;
            const bottomMargin = 250; 
            const photoW = size - (margin * 2);
            const photoH = size - margin - bottomMargin;

            ctx.fillStyle = "white";
            ctx.shadowColor = "rgba(0,0,0,0.3)";
            ctx.shadowBlur = 20;
            ctx.fillRect(0, 0, size, size); 
            ctx.shadowColor = "transparent";

            if (loadedImages[0]) {
                drawImageProp(ctx, loadedImages[0], margin, margin, photoW, photoH);
                ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 2;
                ctx.strokeRect(margin, margin, photoW, photoH);
            }

            const textCenterY = size - (bottomMargin / 2);
            drawFooterText(ctx, size / 2, textCenterY, 60, 30, '#1e293b');
        }

        else if (igRatio === '4:5') {
            const width = 1080;
            const height = 1350;
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = bgWhite;
            ctx.fillRect(0, 0, width, height);            
            const gap = 40;
            const cellW = (width - (gap * 3)) / 2;
            const cellH = (height - (gap * 3)) / 2;

            const positions = [
                { x: gap, y: gap },                     
                { x: gap + cellW + gap, y: gap },       
                { x: gap, y: gap + cellH + gap },       
            ];

            loadedImages.forEach((img, i) => {
                if (i < 3) { 
                    ctx.fillStyle = "white";
                    ctx.fillRect(positions[i].x, positions[i].y, cellW, cellH);
                    drawImageProp(ctx, img, positions[i].x, positions[i].y, cellW, cellH);
                    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 8;
                    ctx.strokeRect(positions[i].x, positions[i].y, cellW, cellH);
                }
            });

            const textX = gap + cellW + gap + (cellW / 2);
            const textY = gap + cellH + gap + (cellH / 2);
            ctx.fillStyle = '#fff1f2'; 
            ctx.fillRect(gap + cellW + gap, gap + cellH + gap, cellW, cellH);
            drawFooterText(ctx, textX, textY, 70, 40, '#db2777');
        }

        else if (igRatio === '9:16') {
            const width = 1080;
            const height = 1920;
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = bgPaper;
            ctx.fillRect(0, 0, width, height);

            const photoW = 700;
            const photoH = 500; 
            
            const layoutConfig = [
                { x: width/2, y: 350, rot: -6 * Math.PI / 180 },
                { x: width/2, y: 880, rot: 4 * Math.PI / 180 },
                { x: width/2, y: 1400, rot: -3 * Math.PI / 180 }
            ];

            loadedImages.forEach((img, i) => {
                if (i < 3) {
                    const cfg = layoutConfig[i];
                    ctx.save();
                    ctx.translate(cfg.x, cfg.y);
                    ctx.rotate(cfg.rot);

                    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                    ctx.shadowBlur = 25;
                    ctx.shadowOffsetX = 5;
                    ctx.shadowOffsetY = 15;
                    
                    const frameW = photoW + 60; 
                    const frameH = photoH + 120; 
                    ctx.fillStyle = "white";
                    ctx.fillRect(-frameW/2, -frameH/2, frameW, frameH);

                    ctx.shadowColor = "transparent";
                    drawImageProp(ctx, img, -photoW/2, -frameH/2 + 30, photoW, photoH);
                    
                    ctx.fillStyle = "rgba(255,255,255,0.6)";
                    ctx.fillRect(-60, -frameH/2 - 20, 120, 40);

                    ctx.restore();
                }
            });

            ctx.save();
            ctx.translate(width/2, 1750); 
            
            ctx.fillStyle = '#db2777';
            ctx.font = 'bold 80px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText("HAPPY BIRTHDAY!", 0, 0);
            
            ctx.font = '40px "Courier New", monospace';
            ctx.fillStyle = '#64748b';
            ctx.fillText(new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }), 0, 80);
            
            ctx.restore();
        }

        resultDataUrl = canvas.toDataURL('image/png');
    }

    function downloadImage() {
        if (!resultDataUrl) return;
        const link = document.createElement('a');
        link.href = resultDataUrl;
        const timestamp = new Date().getTime();
        link.download = `BirthdayMemory_${timestamp}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function shareImage() {
        if (!resultDataUrl) return;
        isSharing = true;
        try {
            const response = await fetch(resultDataUrl);
            const blob = await response.blob();
            const file = new File([blob], "birthday-wish.png", { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Happy Birthday!',
                    text: 'Here is a photostrip memory for you! 🎉'
                });
            } else {
                alert("Browser tidak support share. Coba download dulu ya!");
            }
        } catch (error) {
            console.error(error);
        } finally {
            isSharing = false;
        }
    }

    function drawFooterText(ctx, x, y, titleSize, dateSize, color) {
        ctx.fillStyle = color;
        ctx.font = `bold ${titleSize}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("HAPPY", x, y - (titleSize * 0.7));
        ctx.fillText("BIRTHDAY!", x, y + (titleSize * 0.4));
        ctx.fillStyle = '#94a3b8'; 
        ctx.font = `${dateSize}px "Courier New", monospace`;
        ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), x, y + titleSize + 30);
    }

    function drawImageProp(ctx, img, x, y, w, h) {
        var offsetX = 0.5, offsetY = 0.5;
        var iw = img.width, ih = img.height, r = Math.min(w / iw, h / ih), nw = iw * r, nh = ih * r, cx, cy, cw, ch, ar = 1;
        if (nw < w) ar = w / nw; if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
        nw *= ar; nh *= ar; cw = iw / (nw / w); ch = ih / (nh / h); cx = (iw - cw) * offsetX; cy = (ih - ch) * offsetY;
        if (cx < 0) cx = 0; if (cy < 0) cy = 0; if (cw > iw) cw = iw; if (ch > ih) ch = ih;
        ctx.drawImage(img, cx, cy, cw, ch,  x, y, w, h);
    }

    function reset() { step = 'upload'; uploadedImages = []; resultDataUrl = null; }
    function goBack() { goto('/memories'); }
</script>

<div class="page-container">
    
    <div class="header">
        <button on:click={goBack} class="nav-btn">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 class="app-title">Create Photo - Special Paper</h1>
        <div style="width: 40px;"></div> </div>

    <div class="content-wrapper">
        <div class="content-area">

            {#if step === 'upload'}
                <div class="upload-section" in:fade>
                    
                    <div class="photo-grid">
                        {#each Array(MAX_PHOTOS) as _, i}
                            <div class="photo-slot">
                                {#if uploadedImages[i]}
                                    <img src={uploadedImages[i]} alt="uploaded" class="thumb" />
                                    <button class="remove-btn" on:click={() => removeImage(i)}>×</button>
                                {:else}
                                    <div class="empty-placeholder" on:click={triggerUpload}><span>+</span></div>
                                {/if}
                            </div>
                        {/each}
                    </div>

                    <div class="layout-selector">
                        <p class="label-text">Select Size :</p>
                        <div class="toggle-container sub">
                            <button class="chip-btn {igRatio === '1:1' ? 'active' : ''}" on:click={() => igRatio = '1:1'}>
                                <i class="fa-regular fa-square"></i> 1:1
                            </button>
                            <button class="chip-btn {igRatio === '4:5' ? 'active' : ''}" on:click={() => igRatio = '4:5'}>
                                <i class="fa-solid fa-portrait"></i> 4:5
                            </button>
                            <button class="chip-btn {igRatio === '9:16' ? 'active' : ''}" on:click={() => igRatio = '9:16'}>
                                <i class="fa-solid fa-mobile-screen"></i> 9:16
                            </button>
                        </div>
                    </div>

                    <input type="file" accept="image/*" multiple bind:this={fileInput} on:change={handleFileSelect} style="display: none;" />

                    <div class="actions">
                        <button class="btn-main" on:click={triggerUpload} disabled={uploadedImages.length >= MAX_PHOTOS}>
                            <i class="fa-solid fa-images"></i> Select Photo
                        </button>
                        {#if uploadedImages.length > 0}
                            <button class="btn-process" on:click={processPhotos} transition:scale>Make Memories</button>
                        {/if}
                    </div>
                </div>

            {:else if step === 'processing'}
                <div class="processing-section" in:fade>
                    <div class="loader"><div class="spinner"></div></div>
                    <p class="loading-text">{loadingText}</p>
                </div>

            {:else if step === 'result'}
                <div class="result-section" in:fly={{ y: 50, duration: 800 }}>
                    <h3 class="success-title">Yeay! Ready to Post 🎉</h3>
                    
                    <div class="result-frame 
                        {igRatio === '9:16' ? 'view-story' : ''}
                        {igRatio === '1:1' ? 'view-square' : ''}">
                        
                        <div class="transparency-grid">
                            <img src={resultDataUrl} alt="Result" class="final-image" />
                        </div>
                    </div>

                    <div class="result-actions">
                        <button class="btn-icon" on:click={reset}>
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>
                        
                        <button class="btn-action share" on:click={shareImage} disabled={isSharing}>
                            {#if isSharing}
                               <i class="fa-solid fa-spinner fa-spin"></i>
                            {:else}
                               <i class="fa-solid fa-share-nodes"></i> Share
                            {/if}
                        </button>

                        <button class="btn-action download" on:click={downloadImage}>
                            <i class="fa-solid fa-download"></i> Save
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <canvas bind:this={canvas} style="display: none;"></canvas>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Handlee&display=swap');

    .page-container { 
        position: fixed; inset: 0; 
        background: 
            url('https://www.transparenttextures.com/patterns/stardust.png'), 
            radial-gradient(circle at 20% 20%, #1f2221 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, #243b78 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, #b09aa6 0%, #f1148e 100%);
        
        background-color: #fdf2f8;
        color: white; 
        display: flex; flex-direction: column; 
    }

    .header { 
        flex: 0 0 auto;
        padding: 20px 10px 20px 20px;
        display: flex; align-items: center; justify-content: space-between; 
        z-index: 50;
        text-shadow: 2px 2px 2px #631340; 
    }
    .app-title { font-family: 'Fredoka One'; font-size: 0.8rem; color: #fbcfe8; letter-spacing: 1px; }
    .nav-btn { width: 45px; height: 45px; background: rgba(255,255,255,0.1); border-radius: 50%; border: none; color: white; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .nav-btn:active { background: rgba(255,255,255,0.2); }

    .content-wrapper {
        flex: 1; 
        overflow-y: auto;
        display: flex; flex-direction: column;
        width: 100%;
    }
    .content-area { 
        flex: 1;
        display: flex; flex-direction: column; 
        align-items: center; justify-content: center;
        padding: 20px; width: 100%; max-width: 500px; margin: 0 auto; 
        min-height: 100%;
    }

    .upload-section { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 25px; }
    .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; }
    .photo-slot { aspect-ratio: 1/1; background: #1f293782; border-radius: 16px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .empty-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #ffffff; cursor: pointer; }
    .thumb { width: 100%; height: 100%; object-fit: cover; }
    .remove-btn { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: #ef4444; color: white; border: none; border-radius: 50%; font-weight: bold; cursor: pointer; }

    .layout-selector { width: 100%; background: #1f293782; padding: 20px; border-radius: 20px; border: 1px solid #374151; }
    .label-text { font-size: 1rem; color: #9ca3af; margin-bottom: 12px; text-align: center; font-weight: bold; }
    .toggle-container { display: flex; gap: 10px; }
    .chip-btn { flex: 1; padding: 12px; font-size: 0.85rem; border-radius: 12px; border: 1px solid #4b5563; background: transparent; color: #d1d5db; cursor: pointer; transition: 0.2s; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .chip-btn i { font-size: 1.4rem; }
    .chip-btn.active { background: #db2777; border-color: #db2777; color: white; box-shadow: 0 4px 12px rgba(219, 39, 119, 0.3); }

    .actions { display: flex; flex-direction: column; gap: 15px; width: 100%; margin-top: 10px; }
    .btn-main { background: #1f293782; color: white; padding: 18px; border-radius: 50px; font-weight: bold; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1rem; }
    .btn-process { background: #ec4899; color: white; padding: 18px; border-radius: 50px; font-weight: bold; border: none; cursor: pointer; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4); animation: pulse 2s infinite; }

    .processing-section { display: flex; flex-direction: column; align-items: center; gap: 20px; margin-top: 50px; }
    .loader { width: 80px; height: 80px; border-radius: 50%; background: #1f293782; display: flex; align-items: center; justify-content: center; }
    .spinner { width: 60px; height: 60px; border: 4px solid #374151; border-top-color: #ec4899; border-radius: 50%; animation: spin 1s linear infinite; }
    .loading-text { font-family: 'Fredoka One'; font-size: 1.2rem; color: #fbcfe8; letter-spacing: 1px; }

    .result-section { display: flex; flex-direction: column; align-items: center; gap: 25px; width: 100%; padding-bottom: 50px; }
    .success-title { font-family: 'Fredoka One'; color: #f472b6; margin-bottom: 0px; font-size: 1.2rem; text-shadow: 2px 2px 2px #631340; }
    
    .result-frame { 
        padding: 0; 
        border-radius: 8px; 
        box-shadow: 0 20px 50px rgba(0,0,0,0.5); 
        transition: all 0.3s; 
        width: 100%; 
        max-width: 380px; 
        overflow: hidden; 
        background: #2d3748;
    }
    .result-frame.view-story { width: 280px; }
    .result-frame.view-square { max-width: 340px; }
    
    .transparency-grid {
        width: 100%; height: 100%;
        background: #e5e7eb;
        display: flex; align-items: center; justify-content: center;
    }

    .final-image { width: 100%; display: block; height: auto; }

    .result-actions { display: flex; gap: 12px; width: 100%; justify-content: center; margin-top: 10px; }
    .btn-icon { background: #3b82f6; color: white; width: 55px; height: 55px; border-radius: 50%; font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-icon:active { background: rgba(255,255,255,0.1); transform: scale(0.9); }

    .btn-action { padding: 0 25px; height: 55px; border-radius: 50px; font-weight: bold; border: none; cursor: pointer; display: flex; gap: 8px; align-items: center; justify-content: center; flex: 1; max-width: 140px; font-size: 1rem; transition: transform 0.1s; }
    .btn-action:active { transform: scale(0.95); }

    .download { background: #db2777; color: white; box-shadow: 0 5px 15px rgba(196, 38, 165, 0.179); }
    .share { background: #3b82f6; color: white; box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3); }
    .share:disabled { opacity: 0.7; cursor: wait; }

    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
    @keyframes spin { to { transform: rotate(360deg); } }

    :global(html, body, #svelte) {
        width: 100%;
        height: 100%;
        overflow: hidden;
        margin: 0;
        padding: 0;
        position: fixed;
    }

    .result-container {
        overflow: hidden !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100vw;
    }

    :global(::-webkit-scrollbar) {
        display: none;
    }
</style>