export function initMenu() {
    window.switchMenu = function(menuId) {
        // 1. Sembunyikan semua konten
        document.querySelectorAll('.menu-content').forEach(c => c.style.display = 'none');

        // 2. Tampilkan target
        const target = document.getElementById(menuId);
        if (target) target.style.display = 'block';

        // 3. Update Status Tombol
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const btnType = btn.id.replace('btn-', '');
            const isMatch = menuId.toLowerCase().includes(btnType.toLowerCase());
            btn.classList.toggle('active', isMatch);
        });
    };
}