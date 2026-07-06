(function() {
    'use strict';
    
    // Kiểm tra nếu là desktop thì không chạy code
    if (window.innerWidth >= 769) {
        return;
    }
    
    // Biến toàn cục cho bottom bar
    let bottomBar = null;
    let lastScrollY = 0;
    let isCompact = false;
    let isHidden = false;
    let ticking = false;
    
    // Hàm khởi tạo
    function initBottomBar() {
        bottomBar = document.getElementById('bottom-bar');
        if (!bottomBar) return;
        
        // Setup scroll listener đơn giản
        setupScrollListener();
        
        // Setup navigation
        setupNavigation();
        
        // Kiểm tra theme đơn giản
        checkTheme();
        
        // Update active state
        updateActiveState();
        
        // Fix URLs
        fixUrls();
    }
    
    // Scroll listener tối ưu với hiệu ứng mượt
    function setupScrollListener() {
        let lastTime = 0;
        const throttleDelay = 16; // ~60fps
        
        window.addEventListener('scroll', function() {
            const now = Date.now();
            
            if (now - lastTime >= throttleDelay) {
                lastTime = now;
                
                if (!ticking) {
                    window.requestAnimationFrame(function() {
                        handleScroll();
                        ticking = false;
                    });
                    ticking = true;
                }
            }
        }, { passive: true });
    }
    
    function handleScroll() {
        const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDelta = currentScrollY - lastScrollY;
        
        // Ẩn khi scroll xuống, hiện khi scroll lên
        if (scrollDelta > 5 && currentScrollY > 100 && !isHidden) {
            bottomBar.classList.add('hidden');
            isHidden = true;
        } else if (scrollDelta < -5 && isHidden) {
            bottomBar.classList.remove('hidden');
            isHidden = false;
        }
        
        // Thu gọn khi scroll xuống sâu
        if (currentScrollY > 80 && !isCompact) {
            bottomBar.classList.add('compact');
            isCompact = true;
        } else if (currentScrollY <= 80 && isCompact) {
            bottomBar.classList.remove('compact');
            isCompact = false;
        }
        
        lastScrollY = currentScrollY;
    }
    
    // Navigation với hiệu ứng click
    function setupNavigation() {
        const links = bottomBar.querySelectorAll('a');
        
        links.forEach(link => {
            // Touch start để feedback ngay lập tức
            link.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            // Touch end để reset
            link.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
            
            // Touch cancel để reset
            link.addEventListener('touchcancel', function() {
                this.style.transform = '';
            }, { passive: true });
            
            // Click handler
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Hiệu ứng click
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
                
                // Update active state
                links.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Navigate sau 200ms để người dùng thấy feedback
                setTimeout(() => {
                    const href = this.getAttribute('href');
                    if (href && href !== window.location.pathname) {
                        window.location.href = href;
                    }
                }, 200);
            }, { passive: false });
        });
    }
    
    // Kiểm tra theme đơn giản
    function checkTheme() {
        // Chỉ kiểm tra khi load trang
        const html = document.documentElement;
        const body = document.body;
        
        // Kiểm tra các class phổ biến cho dark mode
        if (html.classList.contains('dark') || 
            body.classList.contains('dark') ||
            html.classList.contains('dark-mode') || 
            body.classList.contains('dark-mode') ||
            html.getAttribute('data-theme') === 'dark' ||
            body.getAttribute('data-theme') === 'dark') {
            
            // Thêm class dark-mode cho body
            document.body.classList.add('dark-mode');
        }
    }
    
    // Update active state
    function updateActiveState() {
        const currentPath = window.location.pathname;
        const links = bottomBar.querySelectorAll('a');
        
        let foundActive = false;
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            const dataPath = link.getAttribute('data-path');
            
            if (href && currentPath.includes(href.replace(window.location.origin, ''))) {
                link.classList.add('active');
                foundActive = true;
            } else if (dataPath && currentPath.includes(dataPath)) {
                link.classList.add('active');
                foundActive = true;
            } else {
                link.classList.remove('active');
            }
        });
        
        if (!foundActive && links.length > 0) {
            links[0].classList.add('active');
        }
    }
    
    // Fix URLs
    function fixUrls() {
        const links = bottomBar.querySelectorAll('a');
        const origin = window.location.origin;
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            if (href && href.startsWith('/') && !href.startsWith('//')) {
                if (!href.startsWith(origin)) {
                    link.setAttribute('href', origin + href);
                }
            }
        });
    }
    
    // Chạy khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBottomBar);
    } else {
        initBottomBar();
    }
    
    // Update khi URL thay đổi
    window.addEventListener('popstate', updateActiveState);
    
    // Xử lý resize
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 769) {
            if (bottomBar) bottomBar.style.display = 'none';
        } else {
            if (bottomBar) bottomBar.style.display = 'flex';
        }
    });
    
})();