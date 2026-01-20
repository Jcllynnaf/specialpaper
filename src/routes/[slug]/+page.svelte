<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { getGift } from '$lib/firebase';
    import BirthdayCard from '$lib/BirthdayCard.svelte';
    import CakeRitual from '$lib/CakeRitual.svelte';
    import FireworksLayer from '$lib/FireworksLayer.svelte';
    import WindyLoading from '$lib/WindyLoading.svelte';
    import { fade } from 'svelte/transition';

    let slug = $page.params.slug;
    let giftData = null;
    let loading = true;
    
    // Status State
    let status = 'loading'; // loading, active, pending, expired, not_found
    let showModal = true;

    function handleCelebration() { showModal = false; }

    onMount(async () => {
        const data = await getGift(slug);
        
        if (data) {
            giftData = data;
            
            // Cek Status Pembayaran
            if (data.status === 'pending') {
                status = 'pending';
            } else if (data.expiryDate && Date.now() > data.expiryDate) {
                status = 'expired';
            } else {
                status = 'active'; // HORE!
            }
        } else {
            status = 'not_found';
        }
        loading = false;
    });

    const ADMIN_WA = "6285718088297"; 

    function contactAdmin() {
        const currentSlug = $page.params.slug;
        const message = `Halo Admin, saya butuh bantuan/info mengenai link ini:\n\nspecialpaper.vercel.app/${currentSlug}`;
        const waLink = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
    }
</script>

{#if loading}
    <WindyLoading loadingText="Mencari kado spesial..." />

{:else if status === 'active'}
    <main class="h-screen w-screen flex flex-col items-center justify-center overflow-hidden relative bg-[#fff0f5]">
        <div class="absolute inset-0 opacity-40 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

        {#if !showModal}
            <div in:fade={{ duration: 2000 }} class="absolute inset-0 z-0">
                <FireworksLayer />
            </div>
        {/if}

        <div 
    class="z-10 transition-all duration-1000 ease-in-out w-full flex justify-center h-full items-center"
    class:blur-md={showModal} 
    class:scale-90={showModal}
    class:brightness-90={showModal}
>
    <BirthdayCard customData={giftData} slug={slug} />
</div>

        {#if showModal}
            <div out:fade={{ duration: 1000 }} class="absolute inset-0 z-50 flex items-center justify-center">
                <CakeRitual on:completed={handleCelebration} />
            </div>
        {/if}
    </main>

{:else if status === 'pending'}
    <div class="h-screen w-screen flex flex-col items-center justify-center bg-pink-50 text-center p-6">
        <h1 class="text-6xl mb-4">⏳</h1>
        <h2 class="text-2xl font-bold text-pink-700">Menunggu Aktivasi Admin</h2>
        <p class="text-slate-600 mt-2 max-w-md">
            Halo <b>{giftData.sender}</b><br>pesanan untuk <b>/{slug}</b><br>sudah kami terima silahkan selesaikan<br>pembayaran dan konfirmasi ke Admin agar link ini bisa diakses.
        </p>
        <button 
    on:click={contactAdmin} 
    class="mt-6 bg-pink-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 transition flex items-center justify-center gap-2 mx-auto"
>
    <i class="fa-brands fa-whatsapp text-xl"></i> Hubungi WhatsApp
</button>
    </div>

{:else if status === 'expired'}
    <div class="h-screen w-screen flex flex-col items-center justify-center bg-pink-100 text-center p-6">
        <h1 class="text-6xl mb-4 text-slate-300">🕰️</h1>
        <h2 class="text-2xl font-bold text-slate-500">Masa Aktif Berakhir</h2>
        <p class="text-slate-400 mt-2">Link kenangan ini sudah melewati batas waktu tayang.</p>
    </div>

{:else}
    <div class="h-screen w-screen flex flex-col items-center justify-center bg-pink-50 text-slate-600 text-center p-6">
        <h1 class="text-4xl mb-4">💔</h1>
        <p class="text-xl font-bold">Kado tidak ditemukan</p>
        <a href="/" class="mt-4 text-pink-500 underline">Kembali ke Beranda</a>
    </div>
{/if}