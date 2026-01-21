<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { slide, fade, scale } from 'svelte/transition'; // Tambahkan scale untuk animasi popup
    import { cardData } from '$lib/createStore';
    import { saveGift } from '$lib/firebase';
    import QRCode from 'qrcode';
    import { PUBLIC_QRIS_RAW } from '$env/static/public';

    const ADMIN_WA = "6285718088297";

    // STATE
    let targetSlug = "";
    let selectedPlan = 'standard'; 
    let removeWatermark = false;
    let showQrisModal = false; 
    let dynamicQrisImage = ""; 
    let isLoading = false;

    // POPUP STATE [BARU]
    let popup = { show: false, title: '', message: '', type: 'info' }; 

    // FITUR CUSTOM DOMAIN
    let wantCustomDomain = false;
    let customDomainInput = "";

    // KONFIGURASI HARGA
    const PRICE_STANDARD_BASE = 20000;
    const PRICE_PREMIUM_BASE = 50000;
    
    // Addons
    const COST_WM = 5000;      // Biaya hapus watermark (Standard)
    const COST_DOMAIN = 5000;  // Biaya domain (Standard)

    // REACTIVE LOGIC
    $: isLifetime = selectedPlan === 'lifetime';
    
    // 1. Logika Harga Dasar
    $: basePrice = isLifetime ? PRICE_PREMIUM_BASE : PRICE_STANDARD_BASE;

    // 2. Logika Biaya Addon
    $: priceWatermark = (!isLifetime && removeWatermark) ? COST_WM : 0;
    $: priceDomain = (!isLifetime && wantCustomDomain) ? COST_DOMAIN : 0;

    // 3. Total
    $: finalTotal = basePrice + priceWatermark + priceDomain;

    onMount(() => {
        targetSlug = $page.url.searchParams.get('slug');
        if (!targetSlug && !$cardData) {
            goto('/create');
            return;
        }
        window.scrollTo(0, 0);
    });

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    }

    // FUNGSI POPUP [BARU]
    function showPopup(title, message, type = 'info') {
        popup = { show: true, title, message, type };
    }

    function closePopup() {
        popup.show = false;
    }

    // --- QRIS UTILS ---
    function calculateCRC16(str) {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
            }
        }
        let hex = (crc & 0xFFFF).toString(16).toUpperCase();
        return hex.padStart(4, '0');
    }

    async function generateDynamicQRIS(rawString, amount) {
        // 1. Bersihkan string raw (buang CRC lama jika ada)
        // Kita cari posisi tag '6304' yang menandakan awal CRC
        let cleanString = rawString;
        if (rawString.includes('6304')) {
            cleanString = rawString.split('6304')[0];
        }

        // 2. Siapkan Tag 54 (Transaction Amount)
        let amountStr = amount.toString();
        let amountLen = amountStr.length.toString().padStart(2, '0');
        let tag54 = '54' + amountLen + amountStr;

        // 3. Susun String Baru
        // Kita cari Tag 58 (Country Code '5802ID') karena Tag 54 (Amount) harus SEBELUM Tag 58
        let parts = cleanString.split('5802ID');
        
        if (parts.length !== 2) {
            console.error("Format QRIS tidak standar (tidak menemukan 5802ID)");
            // Fallback darurat: Kembalikan raw string (jadi statis tanpa nominal)
            // Biar seenggaknya bisa discan walau user harus input manual
            return rawString; 
        }

        // Hapus Tag 54 lama jika ada di bagian pertama (untuk menghindari duplikat)
        // Ini regex sederhana untuk membuang "54xx..."
        let part1 = parts[0].replace(/54\d{2}\d+/, '');

        // Gabungkan: Bagian Awal + Tag 53 (Currency) + Tag 54 (Nominal Baru) + Negara + Sisa
        // Asumsi standard: Currency (5303360) biasanya sebelum amount.
        // Jika 5303360 hilang karena replace di atas, pastikan urutannya.
        
        let newBody = part1 + tag54 + '5802ID' + parts[1] + '6304';

        // 4. Hitung CRC Baru
        let crc = calculateCRC16(newBody);
        
        return newBody + crc;
    }

    async function handleNext() {
        if (!PUBLIC_QRIS_RAW) {
            showPopup("Error", "QRIS Raw belum disetting di .env", "error"); // Ganti alert dengan popup
            return;
        }

        if (wantCustomDomain) {
            if (!customDomainInput || customDomainInput.trim().length < 3) {
                showPopup("Perhatian", "Harap isi nama Link Exclusive minimal 3 karakter", "warning"); // Ganti alert dengan popup
                return;
            }
            const regex = /^[a-z0-9-]+$/;
            if (!regex.test(customDomainInput)) {
                 showPopup("Format Salah", "Nama link hanya boleh huruf kecil, angka, dan strip (-).", "warning"); // Ganti alert dengan popup
                 return;
            }
        }

        isLoading = true;
        try {
            const dynamicString = await generateDynamicQRIS(PUBLIC_QRIS_RAW, finalTotal);
            dynamicQrisImage = await QRCode.toDataURL(dynamicString, { 
                width: 300, 
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            showQrisModal = true;
        } catch (err) {
            console.error(err);
            showPopup("Gagal", "Gagal generate QRIS. Coba refresh.", "error"); // Ganti alert dengan popup
        }
        isLoading = false;
    }

    async function handleConfirmWA() {
        const isWatermarkGone = isLifetime || removeWatermark;
        
        const finalData = {
            ...$cardData,
            removeWatermark: isWatermarkGone,
            paymentPlan: selectedPlan,
            requestCustomDomain: wantCustomDomain,
            customDomainName: wantCustomDomain ? customDomainInput : null,
            finalPrice: finalTotal,
            createdAt: Date.now()
        };

        await saveGift(targetSlug, finalData);
        
        const packageName = isLifetime ? "PAKET PREMIUM (Lifetime)" : "Paket Standard (30 Hari)";
        
        let addonInfo = "";
        if (!isLifetime && removeWatermark) addonInfo += "+ No Watermark ";
        
        // Logic Link WA Dinamis [BARU]
        // Default link (jika tidak custom domain)
        let finalLinkText = `${window.location.origin}/${targetSlug}`; 

        if (wantCustomDomain) {
            addonInfo += `\n+ REQUEST DOMAIN: ${customDomainInput}.vercel.app`;
            addonInfo += isLifetime ? " (Included)" : " (Add-on 5k)";
            // Jika custom domain, ganti link di pesan WA
            finalLinkText = `${customDomainInput}.vercel.app`; 
        }

        const message = `Halo Admin, saya sudah bayar via QRIS.\n\nLink : ${finalLinkText}\nPaket : ${packageName} ${addonInfo}\nTotal : ${formatRupiah(finalTotal)}\n\nMohon segera diproses ya!`;
        
        const waLink = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
        
        setTimeout(() => {
            window.location.href = `/${targetSlug}`;
        }, 1000);
    }
</script>

{#if popup.show}
    <div transition:fade class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div transition:scale class="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
            <div class="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 
                {popup.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600'}">
                <i class="fa-solid {popup.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'} text-xl"></i>
            </div>
            <h3 class="font-bold text-lg text-slate-800 mb-2">{popup.title}</h3>
            <p class="text-sm text-slate-500 mb-6">{popup.message}</p>
            <button on:click={closePopup} class="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition">
                Oke
            </button>
        </div>
    </div>
{/if}

<div class="fixed inset-0 w-full h-full bg-slate-50 font-sans text-slate-800 overflow-y-auto pb-40 z-50">
    <div class="bg-white px-6 py-4 shadow-sm sticky top-0 z-30">
        <div class="max-w-md mx-auto flex items-center justify-between">
            <button on:click={() => history.back()} class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <h1 class="font-bold text-lg">Pembayaran</h1>
            <div class="w-8"></div>
        </div>
    </div>

    <div class="max-w-md mx-auto p-6 space-y-6">
        
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pilih Paket</h2>
            
            <div class="space-y-3">
                <label class="relative flex flex-col p-4 border rounded-xl cursor-pointer transition
                    {selectedPlan === 'standard' ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500' : 'border-slate-200 hover:border-pink-200'}">
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-3">
                            <input type="radio" bind:group={selectedPlan} value="standard" class="accent-pink-600 w-4 h-4">
                            <div>
                                <span class="block font-bold text-slate-800">Standard</span>
                                <span class="text-xs text-slate-500">Aktif 30 Hari</span>
                            </div>
                        </div>
                        <span class="font-bold text-pink-600">{formatRupiah(PRICE_STANDARD_BASE)}</span>
                    </div>
                </label>

                <label class="relative flex flex-col p-4 border rounded-xl cursor-pointer transition
                    {selectedPlan === 'lifetime' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'border-slate-200 hover:border-purple-200'}">
                    
                    <div class="flex items-center justify-between w-full mb-3">
                        <div class="flex items-center gap-3">
                            <input type="radio" bind:group={selectedPlan} value="lifetime" class="accent-purple-600 w-4 h-4">
                            <div>
                                <span class="block font-bold text-slate-800 flex items-center gap-1">
                                    Premium <i class="fa-solid fa-crown text-yellow-500 text-xs"></i>
                                </span>
                            </div>
                        </div>
                        <span class="font-bold text-purple-600">{formatRupiah(PRICE_PREMIUM_BASE)}</span>
                    </div>

                    <div class="pl-2 border-l-2 border-purple-200 ml-1">
                        <div class="grid grid-cols-1 gap-1.5 text-[10px] text-slate-600 font-medium pl-3">
                            <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                <span>Link Lifetime</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                <span>Tanpa Watermark</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                <span>Gratis Ubah Asset/Link 3x</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                <span class="font-bold text-purple-700">Free Link Exclusive ( Custom Url )</span>
                            </div>
                        </div>
                    </div>
                </label>
            </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Fitur Tambahan</h2>
            
            <div class="space-y-4">
                
                <div class="p-4 border rounded-xl transition
                    {wantCustomDomain ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white border-slate-200 hover:border-slate-300'}">
                    
                    <label class="flex items-center justify-between cursor-pointer">
                        <div class="flex items-center gap-3">
                            <div class="relative flex items-center">
                                <input type="checkbox" bind:checked={wantCustomDomain} class="peer sr-only">
                                <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </div>
                            
                            <div>
                                <div class="flex items-center gap-2">
                                    <p class="font-bold text-sm text-slate-800">Link Exclusive</p>
                                    {#if isLifetime}
                                        <span class="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold">INCLUDED</span>
                                    {/if}
                                </div>
                                <p class="text-[10px] text-purple-600">Custom Nama Link Sendiri</p>
                            </div>
                        </div>
                        
                        <div class="text-right">
                            <span class="block text-xs font-bold {isLifetime ? 'text-emerald-500 line-through' : 'text-slate-700'}">
                                +{formatRupiah(COST_DOMAIN)}
                            </span>
                            {#if isLifetime}
                                <span class="block text-xs font-black text-purple-600">GRATIS</span>
                            {/if}
                        </div>
                    </label>

                    {#if wantCustomDomain}
                        <div transition:slide class="mt-4 pt-3 border-t border-purple-200">
                            <div class="flex items-stretch bg-white border-2 border-purple-200 rounded-xl overflow-hidden focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100 transition-all">
                                <input 
                                    type="text" 
                                    bind:value={customDomainInput}
                                    placeholder="namalink" 
                                    class="w-full min-w-0 pl-4 pr-2 py-3 text-sm font-bold text-slate-700 outline-none lowercase placeholder:font-normal placeholder:text-slate-300 bg-transparent"
                                    maxlength="30"
                                >
                                <div class="flex items-center justify-center bg-purple-50 px-4 text-xs font-bold text-purple-600 border-l-2 border-purple-100 select-none whitespace-nowrap">
                                    .vercel.app
                                </div>
                            </div>
                            <p class="text-[10px] text-purple-500 mt-2 flex items-center gap-1.5 ml-1">
                                <i class="fa-solid fa-circle-info"></i> Contoh : <b>namalink.vercel.app</b>
                            </p>
                        </div>
                    {/if}
                </div>

                {#if !isLifetime}
                    <div class="p-4 border border-slate-200 rounded-xl flex items-center justify-between transition cursor-pointer hover:border-slate-300
                        {removeWatermark ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white'}"
                        on:click={() => removeWatermark = !removeWatermark}
                    >
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg
                                {removeWatermark ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}">
                                <i class="fa-solid fa-droplet-slash"></i>
                            </div>
                            <div>
                                <p class="font-bold text-sm text-slate-800">Hapus Watermark</p>
                                <p class="text-[10px] text-slate-500">Tampilan bersih tanpa logo</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="block text-xs font-bold text-slate-700">+{formatRupiah(COST_WM)}</span>
                            {#if removeWatermark}
                                <i class="fa-solid fa-circle-check text-blue-600 text-lg mt-1"></i>
                            {:else}
                                <i class="fa-regular fa-circle text-slate-300 text-lg mt-1"></i>
                            {/if}
                        </div>
                    </div>
                {/if}

                <div class="mt-4 pt-4 border-t border-slate-100">
                    <p class="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">Perbedaan Link :</p>
                    <div class="flex flex-col gap-2"> <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3 opacity-70">
                            <i class="fa-solid fa-xmark text-slate-400 text-sm"></i>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between">
                                    <span class="text-[15px] font-bold text-slate-500">Biasa</span>
                                    <span class="text-[9px] text-slate-400">Default</span>
                                </div>
                                <p class="text-[13px] text-slate-400 truncate">specialpaper.vercel.app/namalink</p>
                            </div>
                        </div>
                        <div class="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-center gap-3">
                            <i class="fa-solid fa-check text-purple-500 text-sm"></i>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between">
                                    <span class="text-[15px] font-bold text-purple-700">Exclusive</span>
                                    <span class="text-[9px] text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded">Premium</span>
                                </div>
                                <p class="text-[13px] text-purple-500 truncate">namalink.vercel.app</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>

    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div class="max-w-md mx-auto flex items-center gap-4">
            <div class="flex-1">
                <p class="text-xs text-slate-500 font-bold uppercase">Total Pembayaran</p>
                <h3 class="text-xl font-black text-slate-800">{formatRupiah(finalTotal)}</h3>
            </div>
            <button 
                on:click={handleNext} 
                disabled={isLoading}
                class="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-300 hover:bg-slate-900 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {#if isLoading}
                    <i class="fa-solid fa-circle-notch animate-spin"></i>
                {:else}
                    Bayar Sekarang <i class="fa-solid fa-chevron-right text-xs"></i>
                {/if}
            </button>
        </div>
    </div>
</div>

{#if showQrisModal}
    <div transition:fade class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div transition:scale class="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
            
            <button on:click={() => showQrisModal = false} class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center">✕</button>

            <div class="p-8 text-center">
                <h3 class="font-bold text-xl text-slate-800 mb-1">Scan QRIS</h3>
                <p class="text-sm text-slate-500 mb-6">Scan menggunakan GoPay, Dana, ShopeePay, atau Mobile Banking.</p>

                <div class="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-inner inline-block mb-6">
                    {#if dynamicQrisImage}
                        <img src={dynamicQrisImage} alt="QRIS" class="w-48 h-48 object-contain rounded-lg mix-blend-multiply" />
                    {:else}
                        <div class="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400">Loading...</div>
                    {/if}
                </div>

                <div class="bg-pink-50 p-3 rounded-xl mb-4">
                    <p class="text-xs text-slate-500 mb-1 font-bold uppercase">Total Bayar</p>
                    <p class="text-2xl font-extrabold text-pink-600">{formatRupiah(finalTotal)}</p>
                </div>

                <p class="text-xs text-slate-500 mb-4 px-2 leading-relaxed">
                    <b>PENTING:</b> Screenshot bukti transfer kamu sekarang. Jangan tutup halaman ini sebelum menekan tombol konfirmasi di bawah.
                </p>

                <button 
                    on:click={handleConfirmWA}
                    class="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                >
                    <i class="fa-brands fa-whatsapp text-xl"></i>
                    Kirim Bukti ke Admin
                </button>
            </div>
        </div>
    </div>
{/if}