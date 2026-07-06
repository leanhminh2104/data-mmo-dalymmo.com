$(document).ready(function () {
    $.ajaxSetup({
        headers: {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
        },
    });

    const currentPath = window.location.pathname;
    const links = $(".sidebar-link");

    links.each(function () {
        const link = $(this);
        const href = link.attr("href");
        const linkPath = new URL(href).pathname;
        if (linkPath === currentPath) {
            link.addClass("active");
        }
    });
});