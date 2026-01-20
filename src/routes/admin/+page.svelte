<script>
    import { signInWithEmailAndPassword } from "firebase/auth";
    import { goto } from '$app/navigation';
    import { auth } from '$lib/firebase'; // <--- Import auth dari file kita sendiri

    let email = "";
    let password = "";
    let error = "";
    let isLoading = false;

    async function handleLogin() {
        if (!email || !password) {
            error = "Isi email dan password dulu!";
            return;
        }

        isLoading = true;
        error = "";
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Berhasil! Pindah ke dashboard
            goto('/admin/dashboard'); 
        } catch (err) {
            console.error(err); // Cek console browser (F12) kalau masih gagal
            // Translate error biar enak dibaca
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                error = "Email atau Password salah!";
            } else if (err.code === 'auth/too-many-requests') {
                error = "Terlalu banyak mencoba. Tunggu sebentar.";
            } else {
                error = "Login gagal: " + err.message;
            }
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-4">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <h1 class="text-2xl font-bold text-slate-800 mb-6 text-center">Admin Login</h1>
        
        <form on:submit|preventDefault={handleLogin} class="space-y-4">
            <div>
                <label class="block text-sm font-bold text-slate-600 mb-1">Email</label>
                <input type="email" bind:value={email} class="w-full border p-2 rounded-lg" required>
            </div>
            
            <div>
                <label class="block text-sm font-bold text-slate-600 mb-1">Password</label>
                <input type="password" bind:value={password} class="w-full border p-2 rounded-lg" required>
            </div>

            {#if error}
                <p class="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>
            {/if}

            <button type="submit" class="w-full bg-pink-600 text-white py-3 rounded-lg font-bold hover:bg-pink-700 transition" disabled={isLoading}>
                {isLoading ? 'Masuk...' : 'Login'}
            </button>
        </form>
    </div>
</div>