<script>
    import { cardData } from '$lib/createStore';
    import BirthdayCard from '$lib/BirthdayCard.svelte';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { bgmStore } from '$lib/audioStore';
    import { getGift } from '$lib/firebase'; 

    let showPreview = false;
    let isCompressing = false;

    // --- VARIABEL UNTUK CEK LINK & POPUP ---
    let customSlug = '';
    let slugError = '';
    let isCheckingSlug = false;
    let showConfirmModal = false;
    let isSlugAvailable = false;
    let successMsg = "";
    let showAlertModal = false;
    let alertMessage = "";

    // Posisi fix untuk Memories Preview
    const memoryPositions = [
        { rotate: '-5deg', top: '4%', left: '6%' },
        { rotate: '6deg', top: '5%', left: '55%' },
        { rotate: '-8deg', top: '37%', left: '55%' },
        { rotate: '4deg', top: '37%', left: '6%' },
        { rotate: '-4deg', top: '69%', left: '55%' },
        { rotate: '7deg', top: '69%', left: '6%' },
    ];

    onMount(() => {
        bgmStore.hideButton();
    });

    function togglePreview() { showPreview = !showPreview; }

    // --- LOGIKA CEK LINK & POPUP ---

    // 1. Cek Link Saja
    async function checkLinkOnly() {
    if (!customSlug) {
        slugError = "Isi nama link dulu ya!";
        return;
    }
    
    // TAMBAHAN: Batasi panjang slug agar database tidak error/spam
    if (customSlug.length < 3 || customSlug.length > 30) {
        slugError = "Panjang link harus 3 - 30 karakter.";
        return;
    }

    const cleanSlug = customSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        customSlug = cleanSlug;
        
        isCheckingSlug = true;
        slugError = "";
        successMsg = "";

        const exist = await getGift(cleanSlug);
        isCheckingSlug = false;

        if (exist) {
            slugError = "Yah, nama ini sudah dipakai orang lain :(";
            isSlugAvailable = false;
        } else {
            successMsg = "Link tersedia! Silakan lanjut.";
            isSlugAvailable = true;
        }
    }

    // 2. Reset saat ketik ulang
    function resetCheck() {
        isSlugAvailable = false;
        successMsg = "";
        slugError = "";
    }

    function triggerPaymentConfirm() {
        // Cek Link Valid
        if (!customSlug || !isSlugAvailable) {
            // Scroll otomatis ke section link biar user tau
            const sectionLink = document.getElementById('section-link');
            if(sectionLink) sectionLink.scrollIntoView({ behavior: 'smooth' });
            
            // Panggil Popup Baru
            simpleAlert("Eits, Link websitenya belum dicek atau masih merah. Cek di Section 5 dulu ya!");
            return;
        }
        
        // Cek Nama Pengirim/Penerima (Validasi Dasar)
        if (!$cardData.name || !$cardData.sender) {
            // Scroll ke atas
            const container = document.querySelector('.overflow-y-auto');
            if(container) container.scrollTo({ top: 0, behavior: 'smooth' });

            // Panggil Popup Baru
            simpleAlert("Nama pengirim dan penerima (Section 1) jangan lupa diisi ya!");
            return;
        }

        showConfirmModal = true; // Munculkan popup konfirmasi bayar
    }

    // 4. Lanjut Bayar
    function proceedToPayment() {
        goto(`/payment?slug=${customSlug}`);
    }

    // Fungsi pembantu untuk memanggil popup
    function simpleAlert(msg) {
        alertMessage = msg;
        showAlertModal = true;
    }

    // --- LOGIKA KOMPRESI FOTO ---
    async function handleFileUpload(e, targetField) {
        const file = e.target.files[0];
        if (file) {
            isCompressing = true;
            try {
                const compressed = await compressImage(file);
                $cardData[targetField] = compressed;
            } catch (err) { console.error(err); } 
            finally { isCompressing = false; }
        }
    }

    async function handleMemoryUpload(e, index) {
        const file = e.target.files[0];
        if (file) {
            isCompressing = true;
            try {
                const compressed = await compressImage(file);
                const newMemories = [...$cardData.memories];
                newMemories[index].url = compressed;
                $cardData.memories = newMemories;
            } catch (err) { console.error(err); } 
            finally { isCompressing = false; }
        }
    }

    async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Kecilkan resolusi maksimal (HP rata-rata cuma butuh 400-600px lebarnya)
                const maxWidth = 600; 
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Turunkan kualitas ke 0.6 (60%) agar file ringan
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}
</script>

<div class="bg-slate-50 h-screen w-full overflow-y-auto overflow-x-hidden relative pb-32 scroll-smooth">
    
    <header class="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md p-4 shadow-sm z-40 flex justify-between items-center border-b border-pink-100 transition-all">
        <h1 class="font-bold text-xl text-pink-600 font-['Gamja_Flower']">🎁 Create Gift</h1>
        
        <button 
            class="bg-pink-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 transition transform active:scale-95" 
            on:click={triggerPaymentConfirm}
        >
            Lanjut Bayar
        </button>
    </header>

    <div class="max-w-2xl mx-auto p-4 space-y-6 pt-24">
    
        <section class="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h2 class="text-lg font-bold mb-4 text-slate-700 flex items-center gap-2">
                <span class="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span> Nama
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Untuk Siapa?</label>
                    <input type="text" bind:value={$cardData.name} class="w-full border-slate-200 border p-3 rounded-xl focus:ring-2 ring-pink-300 outline-none" placeholder="Nama Dia">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Dari Siapa?</label>
                    <input type="text" bind:value={$cardData.sender} class="w-full border-slate-200 border p-3 rounded-xl focus:ring-2 ring-pink-300 outline-none" placeholder="Nama Kamu">
                </div>
            </div>
        </section>

        <section class="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h2 class="text-lg font-bold mb-4 text-slate-700 flex items-center gap-2">
                <span class="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span> Isi Surat
            </h2>
            
            <div class="space-y-6">
                {#each [{ id: 'card1', label: 'Halaman 1' }, { id: 'card2', label: 'Halaman 2' }, { id: 'card3', label: 'Halaman 3' }] as card}
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label class="block text-sm font-bold text-slate-700 mb-2">{card.label}</label>
                        <div class="grid grid-cols-2 gap-2 mb-2">
                            <input type="text" bind:value={$cardData[card.id + 'Image']} class="text-xs border p-2 rounded bg-white" placeholder="Link GIF (Opsional)">
                            <div class="relative">
                                <input type="file" accept="image/*" on:change={(e) => handleFileUpload(e, card.id + 'Image')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                                <button class="w-full bg-white border border-slate-200 text-xs py-2 rounded text-slate-500 hover:bg-slate-100 text-left px-2 truncate">
                                    {isCompressing ? 'Memproses...' : '📂 Upload Galeri'}
                                </button>
                            </div>
                        </div>
                        <div class="relative">
                            <textarea bind:value={$cardData[card.id + 'Text']} maxlength="203" class="w-full border p-3 rounded-xl h-24 text-sm focus:ring-2 ring-pink-200 outline-none resize-none" placeholder="Tulis ucapanmu..."></textarea>
                            <div class="absolute bottom-2 right-2 text-[10px] text-slate-400 font-mono bg-white/80 px-1 rounded">{$cardData[card.id + 'Text']?.length || 0} / 203</div>
                        </div>
                    </div>
                {/each}

                <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Kertas Polos (Pesan Panjang)</label>
                    <div class="relative">
                        <textarea bind:value={$cardData.simpleText} maxlength="328" class="w-full border p-3 rounded-xl h-32 text-sm focus:ring-2 ring-pink-200 outline-none resize-none" placeholder="Jika ucapan terlalu panjang..."></textarea>
                        <div class="absolute bottom-2 right-2 text-[10px] text-slate-400 font-mono bg-white/80 px-1 rounded">{$cardData.simpleText?.length || 0} / 328</div>
                    </div>
                </div>
            </div>
        </section>

        <section class="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h2 class="text-lg font-bold mb-4 text-slate-700 flex items-center gap-2">
                <span class="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span> Musik Spotify
            </h2>
            <div class="space-y-3">
                <input type="text" bind:value={$cardData.spotifyTitle} class="w-full border p-3 rounded-xl focus:ring-2 ring-pink-200 outline-none" placeholder="Judul Lagu">
                <div class="flex items-center gap-2 bg-slate-100 p-2 rounded-xl">
                    <i class="fa-brands fa-spotify text-green-500 text-xl ml-2"></i>
                    <input type="text" bind:value={$cardData.spotifyId} class="flex-1 bg-transparent border-none outline-none font-mono text-sm" placeholder="Paste Link Spotify / ID">
                </div>
            </div>
        </section>

        <section class="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h2 class="text-lg font-bold mb-4 text-slate-700 flex items-center gap-2">
                <span class="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span> Memories Galeri
            </h2>
            <p class="text-sm text-slate-500 mb-4">Upload 6 foto kenangan.</p>

            <div class="grid grid-cols-1 gap-4 mb-8">
                {#each $cardData.memories as memory, i}
                    <div class="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border">
                        <span class="text-slate-400 text-xs font-bold w-6">#{i+1}</span>
                        <div class="relative w-10 h-10 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                            {#if memory.url}
                                <img src={memory.url} class="w-full h-full object-cover" alt="preview">
                            {:else}
                                <div class="flex items-center justify-center h-full text-xs text-slate-400">{isCompressing ? '...' : '📷'}</div>
                            {/if}
                            <input type="file" accept="image/*" on:change={(e) => handleMemoryUpload(e, i)} class="absolute inset-0 opacity-0 cursor-pointer">
                        </div>
                        <input type="text" bind:value={memory.label} class="flex-1 text-sm bg-transparent border-b border-slate-200 outline-none px-2 py-1" placeholder="Label moment">
                    </div>
                {/each}
            </div>

            <div class="mt-12 mb-6 flex flex-col items-center justify-center gap-2">
                <div class="w-full h-px bg-slate-200"></div> 
                <span class="bg-slate-100 text-slate-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-200 -mt-4">Live Preview</span>
            </div>

            <div class="relative w-full h-[500px] bg-[#fff0f5] rounded-xl overflow-hidden shadow-inner border border-pink-100 mx-auto max-w-sm">
                <div class="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                {#each $cardData.memories as memory, i}
                        {@const pos = memoryPositions[i]}
                        <div 
                            class="absolute bg-white p-2 shadow-lg transform transition-all duration-500 hover:z-50 hover:scale-110"
                            style="
                                top: {pos.top}; left: {pos.left}; 
                                transform: rotate({pos.rotate});
                                width: 120px;
                            "
                        >
                            <div class="w-full h-24 bg-slate-100 overflow-hidden mb-2">
                                {#if memory.url}
                                    <img src={memory.url} alt="mem" class="w-full h-full object-cover">
                                {:else}
                                    <div class="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Img</div>
                                {/if}
                            </div>
                            <p class="text-center font-['Gamja_Flower'] text-slate-600 text-sm leading-none pb-1">
                                {memory.label || 'Moment ' + (i+1)}
                            </p>
                        </div>
                    {/each}
            </div>
        </section>

        <section id="section-link" class="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 mb-24">
            <h2 class="text-lg font-bold mb-4 text-slate-700 flex items-center gap-2">
                <span class="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span> 
                Bikin Link Unik
            </h2>
            <p class="text-sm text-slate-500 mb-4">Cek ketersediaan link dulu sebelum lanjut.</p>

            <div class="bg-slate-50 p-4 rounded-xl border border-pink-200 text-left mb-4">
                <label class="text-xs font-bold text-pink-400 uppercase">Link Website</label>
                <div class="flex items-center mt-1 w-full gap-2">
                    <span class="text-slate-400 text-xs sm:text-sm whitespace-nowrap">specialpaper.vercel.app/</span>
                    <input type="text" bind:value={customSlug} on:input={resetCheck} class="bg-transparent border-b-2 border-pink-300 outline-none flex-1 min-w-0 font-bold text-slate-700 text-lg py-1 w-full" placeholder="nama-dia">
                </div>
                {#if slugError}
                    <p class="text-red-500 text-xs mt-2 font-bold"><i class="fa-solid fa-circle-xmark"></i> {slugError}</p>
                {/if}
                {#if successMsg}
                    <p class="text-green-600 text-xs mt-2 font-bold"><i class="fa-solid fa-circle-check"></i> {successMsg}</p>
                {/if}
            </div>

            <button 
                class="w-full py-3 rounded-xl font-bold text-sm border-2 transition flex justify-center items-center gap-2 {isSlugAvailable ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-pink-500 border-pink-200 hover:bg-pink-50'}"
                on:click={checkLinkOnly}
                disabled={isCheckingSlug}
            >
                {#if isCheckingSlug}
                    <i class="fa-solid fa-spinner fa-spin"></i> Mengecek...
                {:else if isSlugAvailable}
                    <i class="fa-solid fa-check"></i> Link Tersedia (Aman)
                {:else}
                    Cek Ketersediaan Link
                {/if}
            </button>
        </section>

    </div>

    <div class="fixed bottom-6 right-6 z-40">
        <button on:click={togglePreview} class="bg-slate-800 text-white px-4 py-2 rounded-full shadow-2xl font-bold hover:scale-105 transition-transform flex items-center gap-2 border-2 border-slate-700">
            <i class="fa-solid fa-eye"></i> Preview
        </button>
    </div>

    {#if showPreview}
        <div transition:fade class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="relative w-full max-w-[360px] h-[650px] bg-white rounded-[30px] overflow-hidden shadow-2xl border-4 border-slate-800">
                <button on:click={togglePreview} class="absolute top-4 right-4 z-[60] bg-black/50 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold backdrop-blur-md">✕</button>
                <div class="w-full h-full relative flex items-center justify-center bg-gray-50 transform scale-[0.9] origin-center"> 
                    <BirthdayCard customData={$cardData} isPreview={true} />
                </div>
            </div>
        </div>
    {/if}

    {#if showConfirmModal}
        <div transition:fade class="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-[popIn_0.3s_ease-out]">
                
                <div class="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h3 class="text-lg font-bold text-slate-800 mb-2">Konfirmasi</h3>
                <p class="text-slate-600 text-sm mb-6">
                    Apakah semua sudah di isi dengan benar dan sesuai?
                </p>

                <div class="flex flex-col gap-3">
                    <button 
                        on:click={proceedToPayment}
                        class="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition shadow-lg"
                    >
                        YA, Lanjut Bayar
                    </button>
                    
                    <button 
                        on:click={() => showConfirmModal = false}
                        class="w-full bg-slate-100 text-slate-500 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                        Kembali Kustomisasi
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

{#if showAlertModal}
        <div transition:fade class="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl animate-[popIn_0.3s_ease-out] border-2 border-pink-100">
                
                <div class="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 animate-pulse">
                    <i class="fa-solid fa-circle-exclamation"></i>
                </div>

                <h3 class="text-lg font-bold text-slate-800 mb-2">Oops!</h3>
                <p class="text-slate-600 text-sm mb-6 leading-relaxed">
                    {alertMessage}
                </p>

                <button 
                    on:click={() => showAlertModal = false}
                    class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition shadow-lg"
                >
                    Oke, Siap!
                </button>

            </div>
        </div>
    {/if}