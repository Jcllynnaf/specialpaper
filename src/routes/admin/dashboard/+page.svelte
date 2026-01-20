<script>
    import { onMount } from 'svelte';
    import { getAllGifts, updateGiftStatus, deleteGift, updateGiftPlan, auth, db } from '$lib/firebase';
    import { ref, update } from "firebase/database";
    import { onAuthStateChanged, signOut } from "firebase/auth";
    import { goto } from '$app/navigation';
    import { fly, fade, scale, slide } from 'svelte/transition';

    // --- DATA UTAMA ---
    let gifts = [];
    let isLoading = true;
    let searchQuery = "";
    
    // --- UI STATES ---
    let isSidebarOpen = false; 
    let showDetailModal = false;
    let selectedGift = null;
    let activeTab = 'all'; // 'all' (Dashboard), 'pending', 'history'

    // --- MODAL LIST STATISTIK ---
    let showRevenueList = false;
    let showActiveList = false;

    // --- FEEDBACK ---
    let confirmModal = { show: false, title: '', message: '', type: 'danger', onConfirm: null };
    let toast = { show: false, message: '', type: 'success' };

    // --- DATA PIPELINE ---
    function matchSearch(g) {
        return g.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (g.sender || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
               (g.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    }

    // 1. Data Utama (Tabel Dashboard)
    $: mainGifts = gifts.filter(g => !g.isDeleted && matchSearch(g));

    // 2. Data Pending (Log Approval)
    $: pendingGifts = gifts.filter(g => !g.isDeleted && !g.isActive && g.status !== 'expired' && g.status !== 'active');

    // 3. Data History (Log Arsip)
    $: historyGifts = gifts.filter(g => g.isDeleted);

    // 4. Data Revenue (Untuk Popup & Stats)
    $: revenueGifts = gifts.filter(g => g.status === 'active' || g.status === 'expired' || g.isActive);

    // 5. Data Active (Untuk Popup & Stats)
    $: activeGifts = gifts.filter(g => g.isActive);

    // --- HITUNG KEUANGAN ---
    $: totalRevenue = revenueGifts.reduce((acc, curr) => {
        let price = curr.paymentPlan === 'lifetime' ? 50000 : 25000;
        if (curr.paymentPlan !== 'lifetime' && curr.removeWatermark) price += 5000;
        return acc + price;
    }, 0);

    $: countStandard = revenueGifts.filter(g => g.paymentPlan === 'standard').length;
    $: countLifetime = revenueGifts.filter(g => g.paymentPlan === 'lifetime').length;
    $: totalSales = countStandard + countLifetime;
    $: percentStandard = totalSales > 0 ? (countStandard / totalSales) * 100 : 0;
    $: percentLifetime = totalSales > 0 ? (countLifetime / totalSales) * 100 : 0;

    // --- LIFECYCLE ---
    onMount(() => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) goto('/admin');
            else await loadData();
        });
    });

    async function loadData() {
        isLoading = true;
        try {
            gifts = await getAllGifts();
            gifts.sort((a, b) => b.createdAt - a.createdAt);
            if(!isLoading) showToast("Data diperbarui");
        } catch (e) { showToast("Gagal ambil data", "error"); }
        isLoading = false;
    }

    // --- HELPER ---
    function showToast(msg, type = 'success') {
        toast = { show: true, message: msg, type };
        setTimeout(() => toast.show = false, 3000);
    }
    
    function formatRupiah(n) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
    }
    
    function copyLink(slug) {
        navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
        showToast(`Link disalin!`);
    }

    // --- ACTIONS ---
    async function smartDeleteGift(slug) {
        const updates = {};
        updates['gifts/' + slug + '/isDeleted'] = true;
        updates['gifts/' + slug + '/isActive'] = false;
        await update(ref(db), updates);
    }

    function handleDelete(slug) {
        confirmModal = {
            show: true, title: "Arsipkan Data?", message: "Data akan masuk ke menu History. Pendapatan tetap aman.", type: "danger",
            onConfirm: async () => {
                try { await smartDeleteGift(slug); await loadData(); showToast("Data diarsipkan"); } 
                catch(e) { showToast("Gagal update", "error"); }
            }
        };
    }

    function toggleStatus(slug, currentStatus) {
        const nextStatus = !currentStatus;
        const nextString = nextStatus ? 'active' : 'pending'; 
        const updates = {};
        updates['gifts/' + slug + '/isActive'] = nextStatus;
        updates['gifts/' + slug + '/status'] = nextString; 
        if (nextStatus) updates['gifts/' + slug + '/expiryDate'] = Date.now() + (30 * 24 * 60 * 60 * 1000);

        update(ref(db), updates).then(() => {
            loadData(); showToast(nextStatus ? "User Aktif" : "User Nonaktif");
        });
    }

    function changePlan(slug, e) {
        const newPlan = e.target.value;
        confirmModal = {
            show: true, title: "Ubah Paket?", message: `Ubah ke ${newPlan.toUpperCase()}?`, type: "info",
            onConfirm: async () => {
                await updateGiftPlan(slug, newPlan); await loadData(); showToast("Paket diubah");
            }
        };
    }

    function openDetail(gift) {
        selectedGift = gift;
        showDetailModal = true;
    }
</script>

{#if toast.show}
    <div transition:fly={{ y: 20 }} class="fixed bottom-5 right-5 z-[10000] px-4 py-2 rounded shadow-lg text-white text-xs font-bold {toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}">
        {toast.message}
    </div>
{/if}

{#if confirmModal.show}
    <div transition:fade class="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div transition:scale class="bg-white rounded-xl shadow-xl w-full max-w-xs p-5 text-center">
            <h3 class="font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
            <p class="text-xs text-slate-500 mb-4">{confirmModal.message}</p>
            <div class="flex gap-2">
                <button on:click={() => confirmModal.show = false} class="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">Batal</button>
                <button on:click={() => { confirmModal.onConfirm(); confirmModal.show = false; }} class="flex-1 py-2 text-white rounded-lg text-xs font-bold {confirmModal.type==='danger'?'bg-rose-500':'bg-blue-500'}">Ya</button>
            </div>
        </div>
    </div>
{/if}

{#if showDetailModal && selectedGift}
    <div transition:fade class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
        <div transition:scale={{start: 0.9}} class="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">📦 Detail Aset: <span class="text-pink-600">/{selectedGift.slug}</span></h2>
                    <p class="text-xs text-slate-500">Melihat data mentah yang diinput user.</p>
                </div>
                <button on:click={() => showDetailModal = false} class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition">✕</button>
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h3 class="text-xs font-bold text-slate-400 uppercase mb-3">Info Pengirim</h3>
                        <div class="space-y-2 text-sm">
                            <p><span class="text-slate-500">Dari:</span> <b class="text-slate-800">{selectedGift.sender}</b></p>
                            <p><span class="text-slate-500">Untuk:</span> <b class="text-slate-800">{selectedGift.name}</b></p>
                            <p><span class="text-slate-500">Spotify:</span> <b class="text-green-600">{selectedGift.spotifyTitle || '-'}</b></p>
                            <p class="text-xs text-slate-400 truncate">{selectedGift.spotifyId || 'No ID'}</p>
                        </div>
                    </div>
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h3 class="text-xs font-bold text-slate-400 uppercase mb-3">Isi Pesan Pendek</h3>
                        <div class="h-24 overflow-y-auto text-sm text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">"{selectedGift.simpleText || 'Tidak ada pesan'}"</div>
                    </div>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><i class="fa-regular fa-images"></i> Pesan Kartu</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {#each ['card1', 'card2', 'card3'] as card, i}
                            <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                                <span class="text-xs font-bold text-pink-500">Halaman {i+1}</span>
                                {#if selectedGift[card+'Image']}
                                    <img src={selectedGift[card+'Image']} alt="Asset" class="w-full h-32 object-cover rounded-lg bg-slate-100">
                                {:else}
                                    <div class="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">No Image</div>
                                {/if}
                                <p class="text-xs text-slate-600 bg-slate-50 p-2 rounded h-20 overflow-y-auto border border-slate-100">{selectedGift[card+'Text'] || '-'}</p>
                            </div>
                        {/each}
                    </div>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><i class="fa-solid fa-camera-retro"></i> Galeri Kenangan</h3>
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {#if selectedGift.memories && selectedGift.memories.length > 0}
                                {#each selectedGift.memories as mem, i}
                                    <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden border relative group">
                                        {#if mem.url}
                                            <img src={mem.url} alt="mem" class="w-full h-full object-cover transition transform group-hover:scale-105">
                                            <div class="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[8px] text-white text-center truncate">{mem.label || `Foto ${i+1}`}</div>
                                        {:else}
                                            <div class="w-full h-full flex items-center justify-center text-xs text-slate-300">Kosong</div>
                                        {/if}
                                    </div>
                                {/each}
                            {:else}
                                <p class="text-xs text-slate-400 col-span-full text-center py-4">Tidak ada foto memories.</p>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-4 border-t border-slate-100 bg-white flex justify-end">
                <button on:click={() => showDetailModal = false} class="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 transition">Tutup Detail</button>
            </div>
        </div>
    </div>
{/if}

<div class="h-screen w-full bg-slate-50 font-sans text-slate-800 flex overflow-hidden">
    
    <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out transform {isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-64 md:flex flex-col">
        <div class="p-6 border-b border-slate-100 flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-pink-200">J</div>
            <div><h2 class="text-lg font-bold tracking-tight text-slate-900 leading-tight">Justcode</h2></div>
            <button on:click={() => isSidebarOpen = false} class="md:hidden ml-auto text-slate-400 hover:text-rose-500"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>
        
        <nav class="flex-1 p-4 space-y-2">
            <button on:click={() => { activeTab = 'all'; isSidebarOpen = false; }} class="w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border shadow-sm transition {activeTab === 'all' ? 'bg-slate-50 text-pink-600 border-pink-100' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}">
                <i class="fa-solid fa-chart-line"></i> Dashboard
            </button>
            <button on:click={() => { activeTab = 'pending'; isSidebarOpen = false; }} class="w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border shadow-sm transition {activeTab === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}">
                <i class="fa-solid fa-hourglass-half"></i> Pending
            </button>
            <button on:click={() => { activeTab = 'history'; isSidebarOpen = false; }} class="w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border shadow-sm transition {activeTab === 'history' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}">
                <i class="fa-solid fa-clock-rotate-left"></i> History Arsip
            </button>
            <div class="px-4 py-2 mt-4"><p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</p></div>
            <button on:click={() => signOut(auth).then(()=>goto('/admin'))} class="w-full flex items-center gap-3 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-3 rounded-xl font-bold transition"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
        </nav>
        
        <div class="p-4 border-t border-slate-100">
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p class="text-[10px] text-slate-400 font-bold uppercase">System Status</p>
                <div class="flex items-center gap-2 mt-1"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span class="text-xs font-bold text-slate-600">Online v1.5</span></div>
            </div>
        </div>
    </aside>

    {#if isSidebarOpen} <div transition:fade={{duration: 200}} on:click={() => isSidebarOpen = false} class="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"></div> {/if}

    <main class="flex-1 flex flex-col h-full overflow-hidden relative">
        <header class="h-20 absolute top-0 left-0 right-0 z-30 px-4 md:px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky-top">
            <div class="flex items-center gap-4 flex-1 md:flex-none">
                <button on:click={() => isSidebarOpen = true} class="md:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition shadow-sm"><i class="fa-solid fa-bars"></i></button>
                <h1 class="text-xl font-bold text-slate-800 hidden md:block">Overview</h1>
                <div class="md:hidden relative w-full max-w-[150px] ml-auto">
                    <input type="text" bind:value={searchQuery} placeholder="Cari..." class="w-full pl-8 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold focus:outline-none focus:ring-1 focus:ring-pink-300">
                    <i class="fa-solid fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                </div>
            </div>
            <div class="flex items-center gap-4 hidden md:flex">
                <div class="relative w-64 group">
                    <input type="text" bind:value={searchQuery} placeholder="Search data..." class="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all">
                    <i class="fa-solid fa-search absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-pink-500 transition-colors text-xs"></i>
                </div>
                <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div class="text-right hidden sm:block"><p class="text-sm font-bold text-slate-800">Admin</p><p class="text-[10px] text-slate-400 uppercase font-bold">justcode</p></div>
                    <div class="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold border-2 border-white shadow-lg">A</div>
                </div>
            </div>
        </header>

        <div class="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28 pb-20 scroll-smooth">
            <div class="max-w-6xl mx-auto space-y-6">

                {#if activeTab === 'all'}
                    <div transition:slide class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button on:click={() => showRevenueList = true} class="text-left w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition flex items-center gap-3 group">
                            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg group-hover:scale-110 transition"><i class="fa-solid fa-money-bill-wave"></i></div>
                            <div class="min-w-0"><p class="text-[10px] text-slate-400 font-bold uppercase truncate">Revenue</p><h3 class="text-sm font-black text-slate-800 truncate">{formatRupiah(totalRevenue)}</h3></div>
                        </button>
                        <button on:click={() => showActiveList = true} class="text-left w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition flex items-center gap-3 group">
                            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg group-hover:scale-110 transition"><i class="fa-solid fa-users"></i></div>
                            <div class="min-w-0"><p class="text-[10px] text-slate-400 font-bold uppercase truncate">Active</p><h3 class="text-sm font-black text-slate-800">{activeGifts.length}</h3></div>
                        </button>
                        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-lg transition flex items-center gap-3 group">
                            <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg group-hover:scale-110 transition"><i class="fa-solid fa-cart-shopping"></i></div>
                            <div class="min-w-0"><p class="text-[10px] text-slate-400 font-bold uppercase truncate">Total Sold</p><h3 class="text-sm font-black text-slate-800">{totalSales}</h3></div>
                        </div>
                        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-lg transition flex items-center gap-3 group">
                            <div class="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-lg group-hover:scale-110 transition"><i class="fa-solid fa-server"></i></div>
                            <div class="min-w-0"><p class="text-[10px] text-slate-400 font-bold uppercase truncate">DB Status</p><div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span class="text-[10px] font-bold text-slate-600">ON</span></div></div>
                        </div>
                    </div>

                    <div transition:slide class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 class="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><div class="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs"><i class="fa-solid fa-chart-pie"></i></div> Analytics Paket</h3>
                        <div class="flex flex-col md:flex-row gap-8">
                            <div class="flex-1">
                                <div class="flex justify-between text-xs mb-2"><span class="text-slate-500 font-bold">Standard</span><span class="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{countStandard} Unit</span></div>
                                <div class="w-full bg-slate-50 rounded-full h-3 overflow-hidden border border-slate-100"><div class="bg-gradient-to-r from-pink-400 to-pink-600 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(236,72,153,0.5)]" style="width: {percentStandard}%"></div></div>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between text-xs mb-2"><span class="text-slate-500 font-bold">Lifetime</span><span class="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{countLifetime} Unit</span></div>
                                <div class="w-full bg-slate-50 rounded-full h-3 overflow-hidden border border-slate-100"><div class="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style="width: {percentLifetime}%"></div></div>
                            </div>
                        </div>
                    </div>
                {/if}

                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div class="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <h3 class="font-bold text-slate-700 text-sm">
                            {#if activeTab === 'all'} 🗂️ Semua Data
                            {:else if activeTab === 'pending'} ⏳ Log Pending Approval
                            {:else if activeTab === 'history'} 📜 Log History & Arsip
                            {/if}
                        </h3>
                        <button on:click={loadData} disabled={isLoading} class="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-pink-600 transition shadow-sm active:scale-95 disabled:opacity-50">
                            <i class="fa-solid fa-arrows-rotate {isLoading ? 'animate-spin' : ''}"></i>
                        </button>
                    </div>

                    {#if activeTab === 'pending'}
                        <div class="p-4 space-y-3">
                            {#if pendingGifts.length === 0}
                                <div class="text-center p-10 text-slate-400 text-xs">Tidak ada data pending.</div>
                            {:else}
                                {#each pendingGifts as gift}
                                    <div class="flex items-center justify-between p-3 bg-white border border-orange-100 rounded-xl shadow-sm hover:border-orange-300 transition">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xs font-bold">P</div>
                                            <div>
                                                <p class="text-sm font-bold text-slate-700">/{gift.slug}</p>
                                                <p class="text-[10px] text-slate-400">{new Date(gift.createdAt).toLocaleDateString('id-ID')} • {gift.sender}</p>
                                            </div>
                                        </div>
                                        <div class="flex gap-2">
                                            <button on:click={() => openDetail(gift)} class="text-[10px] px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 font-bold transition">Cek</button>
                                            <button on:click={() => toggleStatus(gift.slug, gift.isActive)} class="text-[10px] px-3 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-bold transition">Approve</button>
                                        </div>
                                    </div>
                                {/each}
                            {/if}
                        </div>

                    {:else if activeTab === 'history'}
                        <div class="p-4 space-y-2">
                            {#if historyGifts.length === 0}
                                 <div class="text-center p-10 text-slate-400 text-xs">History kosong.</div>
                            {:else}
                                {#each historyGifts as gift}
                                    <div class="relative pl-6 py-2 group">
                                        <div class="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-100 group-hover:bg-slate-200"></div>
                                        <div class="absolute left-[3px] top-4 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <div class="flex items-center gap-2">
                                                    <span class="font-mono text-[10px] text-slate-400 bg-white px-1 rounded border">{new Date(gift.createdAt).toLocaleDateString('id-ID')}</span>
                                                    <span class="font-bold text-xs text-slate-600 line-through decoration-rose-500">/{gift.slug}</span>
                                                </div>
                                                <div class="mt-1 flex gap-2 text-[10px] text-slate-500">
                                                    <span class="bg-white px-1.5 rounded border">Paket: {gift.paymentPlan}</span>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <span class="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">ARCHIVED</span>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            {/if}
                        </div>

                    {:else}
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-white text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                                    <tr><th class="px-6 py-4">User / Link</th><th class="px-6 py-4">Paket</th><th class="px-6 py-4">Status</th><th class="px-6 py-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50 text-sm">
                                    {#if isLoading}
                                        <tr><td colspan="4" class="p-12 text-center text-slate-400 text-xs animate-pulse">Sedang memuat data...</td></tr>
                                    {:else if mainGifts.length === 0}
                                        <tr><td colspan="4" class="p-12 text-center text-slate-400 text-xs">Tidak ada data ditemukan.</td></tr>
                                    {:else}
                                        {#each mainGifts as gift (gift.slug)}
                                            <tr class="hover:bg-slate-50/80 transition group">
                                                <td class="px-6 py-4">
                                                    <div class="flex items-center gap-3">
                                                        <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg border border-slate-200">{gift.slug.charAt(0).toUpperCase()}</div>
                                                        <div class="flex flex-col">
                                                            <div class="flex items-center gap-2">
                                                                <a href="/{gift.slug}" target="_blank" class="font-bold text-slate-700 hover:text-pink-600 transition">/{gift.slug}</a>
                                                                <button on:click={() => copyLink(gift.slug)} class="text-slate-300 hover:text-slate-500 transition" title="Copy URL"><i class="fa-regular fa-copy"></i></button>
                                                            </div>
                                                            <span class="text-xs text-slate-400 font-medium">{gift.sender} <i class="fa-solid fa-arrow-right text-[10px] mx-1 opacity-50"></i> {gift.name}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <div class="relative w-32">
                                                        <select on:change={(e) => changePlan(gift.slug, e)} class="w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-none transition {gift.paymentPlan === 'lifetime' ? 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}">
                                                            <option value="standard" selected={gift.paymentPlan !== 'lifetime'}>Standard</option>
                                                            <option value="lifetime" selected={gift.paymentPlan === 'lifetime'}>Lifetime</option>
                                                        </select>
                                                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-40"><i class="fa-solid fa-chevron-down text-[10px]"></i></div>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <button on:click={() => toggleStatus(gift.slug, gift.isActive)} class="relative overflow-hidden text-[10px] font-bold px-3 py-1 rounded-full border transition group/status {gift.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}">
                                                        <span class="relative z-10 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full {gift.isActive ? 'bg-emerald-500' : 'bg-slate-400'}"></span>{gift.isActive ? 'ACTIVE' : 'OFF'}</span>
                                                    </button>
                                                </td>
                                                <td class="px-6 py-4 text-right">
                                                    <div class="flex items-center justify-end gap-2">
                                                        <button on:click={() => openDetail(gift)} class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition shadow-sm" title="Lihat Detail"><i class="fa-regular fa-eye"></i></button>
                                                        <button on:click={() => handleDelete(gift.slug)} class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition shadow-sm" title="Arsipkan"><i class="fa-solid fa-trash-can"></i></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        {/each}
                                    {/if}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </main>
</div>

{#if showRevenueList}
    <div transition:fade class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div transition:scale class="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div class="p-4 border-b flex justify-between items-center bg-emerald-50">
                <h3 class="font-bold text-emerald-800 flex items-center gap-2"><i class="fa-solid fa-money-bill-wave"></i> Log Pemasukan</h3>
                <button on:click={() => showRevenueList = false} class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">✕</button>
            </div>
            <div class="overflow-y-auto p-4 space-y-3">
                {#each revenueGifts as gift}
                    <div class="flex justify-between items-center p-3 border border-emerald-100 rounded-xl bg-white hover:bg-emerald-50 transition">
                        <div>
                            <p class="font-bold text-xs text-slate-700">/{gift.slug}</p>
                            <p class="text-[10px] text-slate-400 capitalize">{gift.paymentPlan} {gift.removeWatermark ? '+WM' : ''}</p>
                        </div>
                        <span class="font-bold text-sm text-emerald-600">{formatRupiah(gift.paymentPlan === 'lifetime' ? (gift.removeWatermark?55000:50000) : (gift.removeWatermark?30000:25000))}</span>
                    </div>
                {/each}
            </div>
            <div class="p-3 bg-slate-50 text-center border-t"><p class="text-xs font-bold text-slate-500">Total: {formatRupiah(totalRevenue)}</p></div>
        </div>
    </div>
{/if}

{#if showActiveList}
    <div transition:fade class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div transition:scale class="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div class="p-4 border-b flex justify-between items-center bg-blue-50">
                <h3 class="font-bold text-blue-800 flex items-center gap-2"><i class="fa-solid fa-link"></i> Link Aktif</h3>
                <button on:click={() => showActiveList = false} class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">✕</button>
            </div>
            <div class="overflow-y-auto p-4 space-y-2">
                {#each activeGifts as gift}
                    <a href="/{gift.slug}" target="_blank" class="block p-3 border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition">
                        <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span class="font-bold text-sm text-blue-600">/{gift.slug}</span></div>
                        <p class="text-[10px] text-slate-400 mt-1 pl-4">Created: {new Date(gift.createdAt).toLocaleDateString('id-ID')}</p>
                    </a>
                {/each}
            </div>
            <div class="p-3 bg-slate-50 text-center border-t"><p class="text-xs font-bold text-slate-500">Total: {activeGifts.length} Link</p></div>
        </div>
    </div>
{/if}