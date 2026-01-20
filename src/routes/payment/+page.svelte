<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { slide, fade } from 'svelte/transition';
    import { cardData } from '$lib/createStore';
    import { saveGift } from '$lib/firebase';
    import QRCode from 'qrcode';

    // 1. IMPORT DARI ENV (Hapus const MY_QRIS_RAW yang lama)
    import { PUBLIC_QRIS_RAW } from '$env/static/public';

    const ADMIN_WA = "6285718088297";

    let targetSlug = $page.url.searchParams.get('slug');
    let selectedPlan = 'standard'; 
    let removeWatermark = false;   
    let showQrisModal = false; 
    let dynamicQrisImage = ""; 

    const PRICE_STANDARD = 25000;
    const PRICE_LIFETIME = 50000;
    const PRICE_WATERMARK = 5000;

    $: isLifetime = selectedPlan === 'lifetime';
    $: basePrice = isLifetime ? PRICE_LIFETIME : PRICE_STANDARD;
    $: addonPrice = (!isLifetime && removeWatermark) ? PRICE_WATERMARK : 0;
    $: finalTotal = basePrice + addonPrice;

    onMount(() => {
        if (!targetSlug) goto('/create');
    });

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    }

    // --- RUMUS CRC16 MANUAL ---
    function calculateCRC16(str) {
        let crc = 0xFFFF;
        for (let c = 0; c < str.length; c++) {
            crc ^= str.charCodeAt(c) << 8;
            for (let i = 0; i < 8; i++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
            }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }

    // --- GENERATOR STRING QRIS ---
    async function generateDynamicQRIS(originalString, amount) {
        let cleanString = originalString;

        // 1. Potong CRC lama
        const crcTagIndex = cleanString.lastIndexOf("6304");
        if(crcTagIndex !== -1) {
            cleanString = cleanString.substring(0, crcTagIndex);
        }

        // 2. Siapkan Nominal (Tag 54)
        const amountStr = amount.toString();
        const lengthStr = amountStr.length.toString().padStart(2, '0');
        const tag54 = "54" + lengthStr + amountStr;

        // 3. Selipkan
        if (cleanString.includes("5802ID")) {
            cleanString = cleanString.replace("5802ID", tag54 + "5802ID");
        } else {
            cleanString = cleanString + tag54;
        }

        // 4. Tambah Tag CRC baru
        cleanString += "6304";

        // 5. Hitung Nilai CRC
        const crcValue = calculateCRC16(cleanString);
        
        return cleanString + crcValue;
    }

    async function handleNext() {
        // Ganti MY_QRIS_RAW dengan PUBLIC_QRIS_RAW
        if (!PUBLIC_QRIS_RAW) { 
            alert("Setting QRIS Raw belum ada di .env!");
            return; 
        }

        try {
            // Gunakan variabel dari env
            const dynamicString = await generateDynamicQRIS(PUBLIC_QRIS_RAW, finalTotal);
            dynamicQrisImage = await QRCode.toDataURL(dynamicString, { 
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            showQrisModal = true;
        } catch (err) {
            console.error(err);
            alert("Gagal membuat QRIS.");
        }
    }

    async function handleConfirmWA() {
        const isWatermarkGone = isLifetime || removeWatermark;

        const finalData = {
            ...$cardData,
            removeWatermark: isWatermarkGone,
            paymentPlan: selectedPlan
        };

        await saveGift(targetSlug, finalData);
        
        const packageName = isLifetime ? "PAKET PREMIUM (Lifetime)" : "Paket Standard (30 Hari)";
        const addonInfo = removeWatermark ? "+ No Watermark" : "";

        // 2. LOGIKA DOMAIN DINAMIS
        // Ambil domain website secara otomatis (misal: localhost:5173 atau namasitus.com)
        const domain = window.location.origin; 
        
        // Gunakan variabel 'domain' di dalam pesan
        const message = `Halo Admin, saya sudah bayar via QRIS.\n\nLink : ${domain}/${targetSlug}\nPaket : ${packageName} ${addonInfo}\nTotal : ${formatRupiah(finalTotal)}\n\nMohon segera diaktifkan ya!`;
        
        const waLink = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;
        
        window.open(waLink, '_blank');
        
        setTimeout(() => {
            window.location.href = `/${targetSlug}`;
        }, 1000);
    }
</script>

<svelte:head>
    <link href="https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-[#fff0f5] flex flex-col items-center justify-center p-6 font-['Gamja_Flower'] pb-32">
    
    <div class="bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-md w-full border border-pink-100 relative overflow-hidden">
        
        <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-slate-700 mb-1">Pilih Paket Kado</h2>
            <div class="inline-block bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                <p class="text-slate-500 text-sm font-sans">
                    Link: <span class="text-pink-600 font-bold">/{targetSlug}</span>
                </p>
            </div>
        </div>

        <div class="space-y-4 mb-6">
            <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">1. Pilih Durasi Aktif</p>
            
            <label class="block relative cursor-pointer group">
                <input type="radio" bind:group={selectedPlan} value="standard" class="peer sr-only">
                <div class="p-4 rounded-2xl border-2 transition-all duration-200 
                    peer-checked:border-pink-500 peer-checked:bg-pink-50 
                    border-slate-100 hover:border-pink-200 bg-white">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-bold text-lg text-slate-700">Paket Standard</h3>
                            <p class="text-xs text-slate-500 font-sans">Aktif 30 Hari</p>
                        </div>
                        <span class="font-bold text-pink-600 text-lg">{formatRupiah(PRICE_STANDARD)}</span>
                    </div>
                </div>
            </label>

            <label class="block relative cursor-pointer group">
                <input type="radio" bind:group={selectedPlan} value="lifetime" class="peer sr-only">
                <div class="p-4 rounded-2xl border-2 transition-all duration-200 
                    peer-checked:border-purple-500 peer-checked:bg-purple-50 
                    border-slate-100 hover:border-purple-200 bg-white relative overflow-hidden">
                    <div class="absolute top-0 right-0 bg-purple-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-sans font-bold">RECOMMENDED</div>
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                                PAKET PREMIUM <i class="fa-solid fa-crown text-yellow-400"></i>
                            </h3>
                            <ul class="text-xs text-slate-500 font-sans list-disc list-inside mt-1">
                                <li>Aktif Selamanya</li>
                                <li>Garansi 2x Ganti</li>
                                <li class="text-purple-600 font-bold">Free Hapus Watermark</li>
                            </ul>
                        </div>
                        <div class="text-right">
                            <span class="block font-bold text-purple-600 text-lg">{formatRupiah(PRICE_LIFETIME)}</span>
                        </div>
                    </div>
                </div>
            </label>
        </div>

        {#if selectedPlan === 'standard'}
            <div transition:slide class="mb-8 border-t border-dashed border-slate-200 pt-4">
                <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">2. Tambahan</p>
                <label class="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" bind:checked={removeWatermark} class="w-5 h-5 text-pink-600 rounded focus:ring-pink-500 border-gray-300">
                        <div class="text-left">
                            <p class="text-slate-700 font-bold text-sm">Hapus Watermark</p>
                            <p class="text-xs text-slate-400">Tanpa  WM Created by justcode.my.id</p>
                        </div>
                    </div>
                    <span class="text-sm font-bold text-slate-600">+{formatRupiah(PRICE_WATERMARK)}</span>
                </label>
            </div>
        {/if}
    </div>

    <div class="fixed bottom-0 left-0 w-full bg-white border-t border-pink-100 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-40">
        <div class="max-w-md mx-auto flex items-center justify-between gap-4">
            <div class="flex flex-col">
                <span class="text-xs text-slate-400 font-sans">Total Pembayaran</span>
                <span class="text-2xl font-bold text-pink-600 leading-none">{formatRupiah(finalTotal)}</span>
            </div>
            <button 
                on:click={handleNext}
                class="bg-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 transition transform hover:scale-105 flex-1 max-w-[200px]"
            >
                Bayar QRIS <i class="fa-solid fa-qrcode ml-2"></i>
            </button>
        </div>
    </div>

    {#if showQrisModal}
        <div transition:fade class="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
            
            <div class="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-[popIn_0.3s_ease-out] font-sans">
                
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-slate-800">Scan QRIS</h3>
                    <button on:click={() => showQrisModal = false} class="bg-slate-100 w-8 h-8 rounded-full text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold">✕</button>
                </div>

                <div class="bg-white p-2 border-2 border-slate-800 rounded-xl inline-block mb-4 relative">
                    {#if dynamicQrisImage}
                        <img src={dynamicQrisImage} alt="QRIS Dinamis" class="w-60 h-60 object-contain">
                    {:else}
                        <div class="w-60 h-60 flex items-center justify-center bg-slate-100 text-slate-400 text-sm">Generating QR...</div>
                    {/if}
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                         <i class="fa-solid fa-qrcode text-6xl"></i>
                    </div>
                </div>

                <div class="bg-pink-50 p-3 rounded-xl mb-4">
                    <p class="text-xs text-slate-500 mb-1 font-bold uppercase">Total Bayar</p>
                    <p class="text-2xl font-extrabold text-pink-600">{formatRupiah(finalTotal)}</p>
                </div>

                <p class="text-xs text-slate-500 mb-4 px-2 leading-relaxed">
                    <b>Scan menggunakan Aplikasi GoPay, ShopeePay, Dana, atau Mobile Banking apa saja.</b>
                </p>

                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left flex items-start gap-2">
                    <i class="fa-solid fa-triangle-exclamation text-yellow-600 text-sm mt-0.5"></i>
                    <p class="text-xs text-yellow-800 leading-tight">
                        <b>PENTING:</b> Screenshot bukti transfer kamu sekarang. Jangan tutup halaman ini sebelum menekan tombol konfirmasi di bawah atau WhatsApp +6285718088297
                    </p>
                </div>

                <button 
                    on:click={handleConfirmWA}
                    class="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                >
                    <i class="fa-brands fa-whatsapp text-xl"></i> Kirim Bukti ke Admin
                </button>
            </div>
        </div>
    {/if}

</div>