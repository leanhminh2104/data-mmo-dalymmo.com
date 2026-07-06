
function getCurrentPath() {
    return window.location.pathname;
}
function getCurrentDomain() {
    return window.location.origin;
}
function newActiveState() {
    const currentPath = getCurrentPath();
    const navItems = document.querySelectorAll('#bottom-bar a');
    let activeFound = false;
    
    navItems.forEach(item => {
        const itemPath = item.getAttribute('data-path');
        const itemHref = item.getAttribute('href'); // Bây giờ href là /path/..., sau khi fixRelativeUrls chạy sẽ là full
        if (currentPath.includes(itemPath) || 
            window.location.href.includes(itemHref) ||
            (currentPath === '/' && itemPath === 'home')) {
            item.classList.add('active');
            activeFound = true;
        } else {
            item.classList.remove('active');
        }
    });
    if (!activeFound && navItems.length > 0) {
        navItems[0].classList.add('active'); // Mặc định active item đầu tiên nếu không tìm thấy
    }
}
function handleNavigation(e) {
    e.preventDefault();
    document.querySelectorAll('#bottom-bar a').forEach(link => {
        link.classList.remove('active');
    });
    this.classList.add('active');
    const targetUrl = this.getAttribute('href'); // Sẽ lấy full URL (do fixRelativeUrls đã chạy)
    
    // Chỉ chuyển trang nếu URL khác
    if (window.location.href !== targetUrl) {
        window.location.href = targetUrl;
    }
}
function fixRelativeUrls() {
    const navItems = document.querySelectorAll('#bottom-bar a');
    const currentDomain = getCurrentDomain(); // Lấy https://ten-mien-cua-ban.com
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        
        // Hàm này sẽ tìm các link bắt đầu bằng / và gắn tên miền vào
        if (href && href.startsWith('/')) { 
            item.setAttribute('href', currentDomain + href);
        }
    });
}

function setupPopupClose() {
    const closeBtn = document.querySelector('.popup-close');
    const popup = document.getElementById('bottom-popup');
    
    if (closeBtn && popup) {
        closeBtn.addEventListener('click', function() {
            popup.style.display = 'none';
            document.body.style.paddingBottom = '75px';
        });
    }
}

// Gán sự kiện click (giữ nguyên)
document.querySelectorAll('#bottom-bar a').forEach(item => {
    item.addEventListener('click', handleNavigation);
});

// Chạy các hàm khi trang tải xong (giữ nguyên)
document.addEventListener('DOMContentLoaded', function() {
    fixRelativeUrls(); // Chạy hàm fix URL của bạn
    newActiveState();
    setupPopupClose();
});

// Gán sự kiện cho nút back/forward (giữ nguyên)
window.addEventListener('popstate', newActiveState);