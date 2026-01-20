<script>
    import { onMount } from 'svelte';
    import CakeRitual from '$lib/CakeRitual.svelte';
    import BirthdayCard from '$lib/BirthdayCard.svelte';
    import FireworksLayer from '$lib/FireworksLayer.svelte';
    import WindyLoading from '$lib/WindyLoading.svelte';
    import { fade } from 'svelte/transition';

    let showModal = true;
    let isLoading = true;

    function handleCelebration() {
        showModal = false;
    }

    onMount(() => {
        setTimeout(() => {
            isLoading = false;
        }, 3500);
    });

</script>

{#if isLoading}
    <WindyLoading loadingText="Special paper for you..." />
{:else}
    <main in:fade>
        <BirthdayCard />
    </main>
{/if}

<main class="h-screen w-screen flex flex-col items-center justify-center overflow-hidden relative bg-[#fff0f5]">
    
    <div class="absolute inset-0 opacity-40 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

    {#if !showModal}
        <div in:fade={{ duration: 2000 }} class="absolute inset-0 z-0">
            <FireworksLayer />
        </div>
    {/if}

    <div class="z-10 transition-all duration-1000 ease-in-out w-full flex justify-center h-full items-center"
         class:blur-md={showModal} 
         class:scale-90={showModal}
         class:brightness-90={showModal}
    >
        <BirthdayCard />
    </div>

    {#if showModal}
        <div out:fade={{ duration: 1000 }} class="absolute inset-0 z-50 flex items-center justify-center">
            <CakeRitual on:completed={handleCelebration} />
        </div>
    {/if}

</main>