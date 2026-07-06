document.addEventListener("DOMContentLoaded", function () {
    const currentPath = window.location.pathname; // Đường dẫn hiện tại
    const menuLinks = document.querySelectorAll(".sidebar-links a"); // Lấy tất cả các liên kết

    menuLinks.forEach(link => {
        // Bỏ qua các liên kết không có href hoặc chỉ là dấu #
        if (!link.href || link.href === "#") return;

        // Lấy đường dẫn từ href của link 
        const linkPath = new URL(link.href, window.location.origin).pathname;

        // So sánh đường dẫn hiện tại với href
        if (currentPath === linkPath) {
             
            // Nếu link nằm trong submenu, mở submenu và thêm lớp active vào tiêu đề cha
            const parentSubmenu = link.closest("ul.sidebar-submenu");
            if (parentSubmenu) {
                link.classList.add("active");
                parentSubmenu.style.display = "block";
                const parentTitle = parentSubmenu.previousElementSibling;
                if (parentTitle) {
                    parentTitle.classList.add("active");
                }
            }
        }
    });
});

