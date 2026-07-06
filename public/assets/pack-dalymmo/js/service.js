$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});

var voucher_discount = 0;

function normalizeServerDetailsHtml(raw) {
    let details = raw == null ? '' : String(raw);

    details = details
        .replace(/<\s*\/\s*p\s*>\s*<\s*p[^>]*>/gi, '<br>')
        .replace(/<\s*\/?\s*p[^>]*>/gi, '')
        .replace(/<\s*\/\s*div\s*>\s*<\s*div[^>]*>/gi, '<br>')
        .replace(/<\s*\/?\s*div[^>]*>/gi, '')
        .replace(/<\s*li[^>]*>/gi, '')
        .replace(/<\s*\/\s*li\s*>/gi, '<br>');

    details = details
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n+/g, '<br>')
        .replace(/(?:<\s*br\s*\/?\s*>\s*){2,}/gi, '<br>');

    details = details
        .replace(/^(?:\s*<\s*br\s*\/?\s*>\s*)+/i, '')
        .replace(/(?:\s*<\s*br\s*\/?\s*>\s*)+$/i, '');

    return details.trim();
}

$('form[dalymmocom-request="order"]').on('submit', function (e) {
    e.preventDefault();
    const form = $(this);
    const url = form.attr('action');
    const method = form.attr('method');
    const btn = form.find('button[type="submit"]');
    const btnText = btn.html();
    const orderType = (form.find('input[name="order_type"]:checked').val() || 'single').toLowerCase();

    const sendAjax = function (payload, callbacks = {}) {
        $.ajax({
            url: url,
            method: method,
            headers: {
                'X-ACCESS-TOKEN': $('meta[name="access-token"]').attr('content')
            },
            data: payload,
            dataType: 'json',
            beforeSend: function () {
                if (typeof callbacks.beforeSend === 'function') callbacks.beforeSend();
            },
            success: function (response) {
                if (typeof callbacks.success === 'function') callbacks.success(response);
            },
            error: function (xhr) {
                if (typeof callbacks.error === 'function') callbacks.error(xhr);
            },
            complete: function () {
                if (typeof callbacks.complete === 'function') callbacks.complete();
            }
        });
    };

    const buildMassPayload = function (link) {
        const dataArr = form.serializeArray().filter(function (item) {
            return item.name !== 'object_id' && item.name !== 'mass_object_id';
        });
        dataArr.push({ name: 'object_id', value: link });
        return $.param(dataArr);
    };

    const massLinks = (orderType === 'mass')
        ? (form.find('#mass_object_id').val() || '')
            .split(/\r?\n/)
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line !== ''; })
        : [];

    if (orderType === 'mass' && massLinks.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'Thông báo',
            text: 'Vui lòng nhập ít nhất 1 link/UID cho đơn hàng loạt.',
            confirmButtonText: 'Đồng ý'
        });
        return;
    }

    const totalPreview = $('#total_pay').html() || $('#quantity_amount2').html() || '0';
    Swal.fire({
        title: orderType === 'mass' ? 'Xác nhận đặt đơn hàng loạt?' : 'Xác nhận thanh toán?',
        html: orderType === 'mass'
            ? `<b class="text-danger">Số lượng đặt: ${massLinks.length}</b><br><small class="text-muted">Tổng dự kiến: ${totalPreview}</small>`
            : `<b class="text-danger">Tổng thanh toán: ${totalPreview} VND</b>`,
        icon: 'warning',
        showCloseButton: true,
        showCancelButton: true,
        confirmButtonText: 'Thanh toán',
        cancelButtonColor: 'rgb(224, 56, 56)',
        cancelButtonText: 'Hủy'
    }).then(function (result) {
        if (!result.isConfirmed) {
            return;
        }

        if (orderType !== 'mass') {
            Swal.fire({
                icon: 'warning',
                title: 'Đơn hàng đang được xử lý, nghiêm cấm tắt trình duyệt, F5 tránh mất đơn mất tiền!',
                timer: 15000,
                timerProgressBar: true,
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: function () {
                    Swal.showLoading();
                }
            });

            sendAjax(form.serialize(), {
                beforeSend: function () {
                    btn.html('Đang xử lý').attr('disabled', true);
                },
                success: function (response) {
                    if (response.code === '200' && response.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: 'Thông báo',
                            text: response.message,
                            showCancelButton: true,
                            confirmButtonText: 'Tải lại trang',
                            cancelButtonText: 'Đặt tiếp',
                            reverseButtons: true
                        }).then(function (resultReload) {
                            if (resultReload.isConfirmed) {
                                window.location.reload();
                            }
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Thông báo',
                            text: response.message || 'Không thể tạo đơn.',
                            confirmButtonText: 'Đồng ý!'
                        });
                    }
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Thông báo',
                        text: (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Có lỗi xảy ra.',
                        confirmButtonText: 'Đồng ý!'
                    });
                },
                complete: function () {
                    btn.html(btnText).attr('disabled', false);
                }
            });
            return;
        }

        let current = 0;
        let successCount = 0;
        let failCount = 0;
        const failMessages = [];
        btn.attr('disabled', true);

        const processNext = function () {
            if (current >= massLinks.length) {
                btn.html(btnText).attr('disabled', false);
                const failPreview = failMessages.length ? `<br><small class="text-danger">${failMessages.slice(0, 3).join(' | ')}</small>` : '';
                Swal.fire({
                    icon: successCount > 0 ? 'success' : 'error',
                    title: 'Kết quả đơn hàng loạt',
                    html: `<b>Thành công:</b> ${successCount}/${massLinks.length}<br><b>Thất bại:</b> ${failCount}/${massLinks.length}${failPreview}`,
                    showCancelButton: successCount > 0,
                    confirmButtonText: successCount > 0 ? 'Tải lại trang' : 'Đồng ý',
                    cancelButtonText: successCount > 0 ? 'Đặt tiếp' : undefined
                }).then(function (finalResult) {
                    if (successCount > 0 && finalResult.isConfirmed) {
                        window.location.reload();
                    }
                });
                return;
            }

            const link = massLinks[current];
            btn.html(`Đang xử lý ${current + 1}/${massLinks.length}`);

            sendAjax(buildMassPayload(link), {
                success: function (response) {
                    if (response.code === '200' && response.status === 'success') {
                        successCount++;
                    } else {
                        failCount++;
                        failMessages.push(response.message || `Lỗi dòng ${current + 1}`);
                    }
                },
                error: function (xhr) {
                    failCount++;
                    failMessages.push((xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : `Lỗi dòng ${current + 1}`);
                },
                complete: function () {
                    current++;
                    processNext();
                }
            });
        };

        processNext();
    });
});

function checkPrice() {
    const provider_server = $('input[name="provider_server"]:checked');
    let price = provider_server.data('price');
    if (!price) return;
    showElm($('#reactions_type'), provider_server.data('reaction'));
    showElm($('#quantity_type'), provider_server.data('quantity'));
    showElm($('#comments_type'), provider_server.data('comment'));
    showElm($('#minute_type'), provider_server.data('minute'));
    showElm($('#time_type'), provider_server.data('time'))
    showElm($('#posts_type'), provider_server.data('posts'));
    showReaction();

    $('#informationServer').remove();
    let elm = provider_server.parent().parent();
    var lam = normalizeServerDetailsHtml(provider_server.data('details') || '');
    var baohanh_text = provider_server.data('baohanh') === 'on' ? '<b class="text-white">Có</b>' : '<b class="text-white">Không</b>';
    var huy_text = provider_server.data('huy') === 'on' ? '<b class="text-white">Có</b>' : '<b class="text-white">Không</b>';
    var price_unit = Intl.NumberFormat().format(price);

    var min_quantity = Intl.NumberFormat().format(provider_server.data('min'));
    var max_quantity = Intl.NumberFormat().format(provider_server.data('max'));

    elm.append(`
        <div class="alert mb-3 p-3 rounded" id="informationServer" style="border: 1px dashed #0DCAF0; background: rgba(13,202,240,.06); font-size: .85rem; line-height: 1.35;">
            <div class="mb-1"><i class="fas fa-bolt text-primary me-1"></i> <span class="fw-semibold">Tốc độ hoàn thành trung bình:</span> <span id="info_avg_time" class="fw-bold">Đang phân tích...</span></div>
            <div class="mb-1"><i class="fas fa-shield-alt text-primary me-1"></i> <span class="fw-semibold">Bảo hành:</span> <span class="fw-bold">${baohanh_text}</span></div>
            <div class="mb-1"><i class="fas fa-undo text-primary me-1"></i> <span class="fw-semibold">Hủy đơn hoàn phần thừa:</span> <span class="fw-bold">${huy_text}</span></div>
            <div class="mb-1"><i class="fas fa-shopping-cart text-primary me-1"></i> <span class="fw-semibold">Giá:</span> <b class="fw-bold text-danger">${price_unit} </b></div>
            <div class="mb-1"><i class="fas fa-arrow-down text-info me-1"></i> <span class="fw-semibold">Số lượng nhỏ nhất:</span> <b>${min_quantity}</b></div>
            <div class="mb-0"><i class="fas fa-arrow-up text-info me-1"></i> <span class="fw-semibold">Số lượng lớn nhất:</span> <b>${max_quantity}</b></div>
            <hr style="margin: 10px 0; border-top: 1px dashed #0DCAF0;">
            <div style="white-space: normal; line-height: 1.5;" class="small text-muted">${lam}</div>
        </div>
      `);
    let object_id = $('[name="object_id"]').val();

    if (provider_server.data('getuid') === 'on') {
        // nếu có object_id và object_id không phải là số
        if (!Number.isInteger(object_id)) {
            getUid();
        }
    }

    let quantity = $('[name="quantity"]').val() || 0;
    $('[name="comments"]').val() && (quantity = $('[name="comments"]').val().split("\n").filter(item => item)
        .length, $(".comment-count").html(quantity));
    let minutes = $('[name="minutes"]').val() || 0;
    let duration = $('[name="duration"]').val() || 0;
    let posts = $('[name="posts"]').val() == 'unlimited' ? 0 : $('[name="posts"]').val() || 0;

    // Calculate Base Total
    let totalPay = price * quantity;
    if (minutes > 0 && provider_server.data('minute') === 'on') totalPay *= minutes;
    if (duration > 0 && provider_server.data('time') === 'on') totalPay *= duration;
    if (posts > 0 && provider_server.data('posts') === 'on') totalPay *= posts;

    // Average Time API Call
    let serverId = provider_server.data('id');
    if (serverId) {
        $.ajax({
            url: "/api/server/average-time",
            type: "POST",
            dataType: "json",
            data: {
                server_id: serverId
            },
            success: function (res) {
                if (res.status === 'success') {
                    $('#info_avg_time').html('<b class="text-white">' + res.time + '</b>');
                } else {
                    $('#info_avg_time').text('Chưa có dữ liệu');
                }
            },
            error: function () {
                $('#info_avg_time').text('Lỗi kết nối');
            }
        });
    }

    $('#quantity_limit').html(
        `(${Intl.NumberFormat().format(provider_server.data('min'))} ~ ${Intl.NumberFormat().format(provider_server.data('max'))})`
    );
    $('#quantity_limitss').html(
        `(${Intl.NumberFormat().format(provider_server.data('min'))} ~ ${Intl.NumberFormat().format(provider_server.data('max'))})`
    );
    $('#comment-alert').html(provider_server.data('comment_type') || 'Không có');
    $('#counter_comment').html(Intl.NumberFormat().format(quantity));
    $('#total_quantity').html(Intl.NumberFormat().format(quantity));
    $('#current_price').html(Intl.NumberFormat().format(price));

    // Voucher Breakdown
    if (voucher_discount > 0) {
        let subtotal = totalPay;
        let discount_amount = (subtotal * voucher_discount) / 100;
        let final_pay = subtotal - discount_amount;

        $('#break-price').html(Intl.NumberFormat().format(price) + ' ');
        $('#break-quantity').html(Intl.NumberFormat().format(quantity));
        $('#break-subtotal').html(Intl.NumberFormat().format(subtotal) + ' ');
        $('#break-discount').html(`${voucher_discount}% = -${Intl.NumberFormat().format(discount_amount)} `);

        $('#voucher-details').show();
        $('#total_pay').html(`${Intl.NumberFormat().format(final_pay)} đ`);
    } else {
        $('#voucher-details').hide();
        $('#total_pay').html(`${Intl.NumberFormat().format(totalPay)} đ`);
    }
}

function checkPriceLt() {
    const provider_server = $('select[name="provider_server"] option:selected');
    let price = provider_server.data('price');
    if (!price) return;

    showElm($('#reactions_type'), provider_server.data('reaction'));
    showElm($('#quantity_type'), provider_server.data('quantity'));
    showElm($('#comments_type'), provider_server.data('comment'));
    showElm($('#minute_type'), provider_server.data('minute'));
    showElm($('#time_type'), provider_server.data('time'));
    showElm($('#posts_type'), provider_server.data('posts'));
    showReaction();

    $('#informationServer').remove();
    var lam = normalizeServerDetailsHtml(provider_server.data('details') || '');
    var baohanh_text = provider_server.data('baohanh') === 'on' ? '<b class="text-white">Có</b>' : '<b class="text-white">Không</b>';
    var huy_text = provider_server.data('huy') === 'on' ? '<b class="text-white">Có</b>' : '<b class="text-white">Không</b>';
    var price_unit = Intl.NumberFormat().format(price);
    var min_quantity = Intl.NumberFormat().format(provider_server.data('min'));
    var max_quantity = Intl.NumberFormat().format(provider_server.data('max'));

    $('select[name="provider_server"]').closest('.form-group').after(`
        <div class="alert mb-3 p-3 rounded" id="informationServer" style="border: 1px dashed #0DCAF0; background: rgba(13,202,240,.06); font-size: .85rem; line-height: 1.35;">
            <div class="mb-1"><i class="fas fa-bolt text-primary me-1"></i> <span class="fw-semibold">Tốc độ hoàn thành trung bình:</span> <span id="info_avg_time" class="fw-bold">Đang phân tích...</span></div>
            <div class="mb-1"><i class="fas fa-shield-alt text-primary me-1"></i> <span class="fw-semibold">Bảo hành:</span> <span class="fw-bold">${baohanh_text}</span></div>
            <div class="mb-1"><i class="fas fa-undo text-primary me-1"></i> <span class="fw-semibold">Hủy đơn hoàn phần thừa:</span> <span class="fw-bold">${huy_text}</span></div>
            <div class="mb-1"><i class="fas fa-shopping-cart text-primary me-1"></i> <span class="fw-semibold">Giá:</span> <b class="fw-bold text-danger">${price_unit} </b></div>
            <div class="mb-1"><i class="fas fa-arrow-down text-info me-1"></i> <span class="fw-semibold">Số lượng nhỏ nhất:</span> <b>${min_quantity}</b></div>
            <div class="mb-0"><i class="fas fa-arrow-up text-info me-1"></i> <span class="fw-semibold">Số lượng lớn nhất:</span> <b>${max_quantity}</b></div>
            <hr style="margin: 10px 0; border-top: 1px dashed #0DCAF0;">
            <div style="white-space: normal; line-height: 1.5;" class="small text-muted">${lam}</div>
        </div>
    `);

    let object_id = $('[name="object_id"]').val();
    if (provider_server.data('getuid') === 'on') {
        if (!Number.isInteger(object_id)) {
            getUid();
        }
    }

    let quantity = parseInt($('[name="quantity"]').val(), 10) || 0;
    if ($('[name="comments"]').val()) {
        quantity = $('[name="comments"]').val().split("\n").filter(item => item).length;
        $(".comment-count").html(quantity);
    }

    let minutes = parseFloat($('[name="minutes"]').val()) || 0;
    let duration = parseFloat($('[name="duration"]').val()) || 0;
    let posts = $('[name="posts"]').val() === 'unlimited' ? 0 : parseInt($('[name="posts"]').val(), 10) || 0;
    let totalPay = price * quantity;

    if (minutes > 0 && provider_server.data('minute') === 'on') totalPay *= minutes;
    if (duration > 0 && provider_server.data('time') === 'on') totalPay *= duration;
    if (posts > 0 && provider_server.data('posts') === 'on') totalPay *= posts;

    // Average Time API Call
    let serverId = provider_server.data('id');
    if (serverId) {
        $.ajax({
            url: "/api/server/average-time",
            type: "POST",
            dataType: "json",
            data: { server_id: serverId },
            success: function (res) {
                if (res.status === 'success') {
                    $('#info_avg_time').html('<b class="text-white">' + res.time + '</b>');
                } else {
                    $('#info_avg_time').text('Chưa có dữ liệu');
                }
            },
            error: function () {
                $('#info_avg_time').text('Lỗi kết nối');
            }
        });
    }

    $('#comment-alert').html(provider_server.data('comment_type') || 'Không có');
    $('#counter_comment').html(Intl.NumberFormat().format(quantity));
    $('#total_quantity').html(Intl.NumberFormat().format(quantity));
    $('#current_price').html(Intl.NumberFormat().format(price));

    // Voucher Breakdown
    if (voucher_discount > 0) {
        let subtotal = totalPay;
        let discount_amount = (subtotal * voucher_discount) / 100;
        let final_pay = subtotal - discount_amount;

        $('#break-price').html(Intl.NumberFormat().format(price) + ' ');
        $('#break-quantity').html(Intl.NumberFormat().format(quantity));
        $('#break-subtotal').html(Intl.NumberFormat().format(subtotal) + ' ');
        $('#break-discount').html(`${voucher_discount}% = -${Intl.NumberFormat().format(discount_amount)} `);

        $('#voucher-details').show();
        $('#quantity_amount2').html(`${Intl.NumberFormat().format(final_pay)}đ`);
    } else {
        $('#voucher-details').hide();
        $('#quantity_amount2').html(`${Intl.NumberFormat().format(totalPay)}đ`);
    }
}

function checkVoucher() {
    var _recalc = $('select[name="provider_server"]').length ? checkPriceLt : checkPrice;
    const voucher = $('#voucher_code').val();
    if (!voucher || voucher.length < 3) {
        voucher_discount = 0;
        $('#voucher_message').html('');
        _recalc();
        return;
    }
    $.ajax({
        url: '/voucher/check',
        method: 'POST',
        data: { voucher: voucher },
        success: function (res) {
            if (res.status === 'success') {
                voucher_discount = res.data.percent;
                $('#voucher_message').removeClass('text-danger').addClass('text-success').html('<i class="fas fa-check-circle"></i> Áp dụng mã giảm giá ' + voucher_discount + '% thành công!');
                _recalc();
            } else {
                voucher_discount = 0;
                $('#voucher_message').removeClass('text-success').addClass('text-danger').html('<i class="fas fa-times-circle"></i> ' + (res.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn!'));
                _recalc();
            }
        },
        error: function () {
            voucher_discount = 0;
            $('#voucher_message').removeClass('text-success').addClass('text-danger').html('<i class="fas fa-times-circle"></i> Có lỗi xảy ra khi kiểm tra mã!');
            _recalc();
        }
    });
}

function showElm(elm, status) {
    if (status === 'on') {
        elm.show();
    } else {
        elm.hide();
    }
}

function showReaction() {
    let provider_server = $('input[name="provider_server"]:checked');
    if (!provider_server.length) {
        provider_server = $('select[name="provider_server"] option:selected');
    }
    const reaction_type = provider_server.data('reaction_type');
    const reactions = $('[name="reaction"]');
    if (reaction_type === 'all') {
        reactions.each(function () {
            $(this).parent().show();
        });
    } else {
        const reaction_types = reaction_type.split(',').map(item => item.toLowerCase());
        reactions.each(function () {
            // dữ liệu có trong mảng đều thành chữ thường
            if (reaction_types.includes($(this).val())) {
                $(this).parent().show();
            } else {
                $(this).parent().hide();
            }
        });
    }
}

function refundOrder(order_code) {
    Swal.fire({
        title: 'Xác nhận hoàn tiền?',
        text: "Bạn chắc chắn muốn hoàn tiền cho đơn hàng này và sẽ trừ 1000 VND vào tài khoản của bạn?",
        icon: 'warning',
        showCloseButton: !0,
        showCancelButton: !0,
        confirmButtonText: "Hoàn tiền",
        cancelButtonColor: "rgb(224, 56, 56)",
        cancelButtonText: "Hủy"
    }).then(result => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/api/v1/order/refund',
                method: 'POST',
                data: {
                    order_code
                },
                headers: {
                    'X-ACCESS-TOKEN': $('meta[name="access-token"]').attr('content')
                },
                dataType: 'json',
                beforeSend: function () {
                    Swal.fire({
                        title: 'Đang xử lý...',
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });
                },
                success: function (response) {
                    if (response.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý!",
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý!",
                        });
                    }
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: "Thông báo",
                        text: xhr.responseJSON.message,
                        confirmButtonText: "Đồng ý!",
                    });
                }
            })
        }
    })
}

function warrantyOrder(order_code) {
    Swal.fire({
        title: 'Xác nhận bảo hành?',
        text: "Bạn chắc chắn muốn bảo hành cho đơn hàng này?",
        icon: 'warning',
        showCloseButton: !0,
        showCancelButton: !0,
        confirmButtonText: "Bảo hành",
        cancelButtonColor: "rgb(224, 56, 56)",
        cancelButtonText: "Hủy"
    }).then(result => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/api/v1/order/warranty',
                method: 'POST',
                data: {
                    order_code
                },
                headers: {
                    'X-ACCESS-TOKEN': $('meta[name="access-token"]').attr('content')
                },
                dataType: 'json',
                beforeSend: function () {
                    Swal.fire({
                        title: 'Đang xử lý...',
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });
                },
                success: function (response) {
                    if (response.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý!",
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý!",
                        });
                    }
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: "Thông báo",
                        text: xhr.responseJSON.message,
                        confirmButtonText: "Đồng ý!",
                    });
                }
            })
        }
    })
}

function updateOrder(order_code) {
    $.ajax({
        url: '/api/v1/order/update',
        method: 'POST',
        data: {
            order_code
        },
        headers: {
            'X-ACCESS-TOKEN': $('meta[name="access-token"]').attr('content')
        },
        dataType: 'json',
        beforeSend: function () {
            Swal.fire({
                title: 'Đang xử lý...',
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
        },
        success: function (response) {
            if (response.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: "Thông báo",
                    text: response.message,
                    confirmButtonText: "Đồng ý!",
                }).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: "Thông báo",
                    text: response.message,
                    confirmButtonText: "Đồng ý!",
                });
            }
        },
        error: function (xhr) {
            Swal.fire({
                icon: 'error',
                title: "Thông báo",
                text: xhr.responseJSON.message,
                confirmButtonText: "Đồng ý!",
            });
        }
    })
}

function renewsOrder(order_code) {
    // swal.fire input thêm, alert html tính giá tiền

    Swal.fire({
        title: 'Gia hạn đơn hàng',
        html: `
            <div class="form-group mb-3">
                <label for="days">Nhập số ngày cần gia hạn</label>
                <select class="form-control" id="days" name="days">
                    <option value="30">1 tháng</option>
                    <option value="60">2 tháng</option>
                    <option value="90">3 tháng</option>
                    <option value="120">4 tháng</option>
                    <option value="150">5 tháng</option>
                    <option value="180">6 tháng</option>
                    <option value="210">7 tháng</option>
                    <option value="240">8 tháng</option>
                    <option value="270">9 tháng</option>
                    <option value="300">10 tháng</option>
                    <option value="330">11 tháng</option>
                    <option value="360">12 tháng</option>
                </select>
            </div>
        `,
        icon: 'warning',
        showCloseButton: !0,
        showCancelButton: !0,
        confirmButtonText: "Gia hạn",
        cancelButtonColor: "rgb(224, 56, 56)",
        cancelButtonText: "Hủy",
        didOpen: () => {
            $('#renews').on('input', function () {
                const renews = $(this).val();
                const price = $('#current_price').html().replace(/\./g, '');
                $('#renew_price').html(Intl.NumberFormat().format(renews * price));
            })
        }
    }).then(result => {
        if (result.isConfirmed) {
            const days = $('#days').val();
            $.ajax({
                url: '/api/v1/order/renews',
                method: 'POST',
                data: {
                    order_code,
                    days
                },
                headers: {
                    'X-ACCESS-TOKEN': $('meta[name="access-token"]').attr('content')
                },
                dataType: 'json',
                beforeSend: function () {
                    Swal.fire({
                        title: 'Đang xử lý...',
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });
                },
                success: function (response) {
                    if (response.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý!",
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý!",
                        });
                    }
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: "Thông báo",
                        text: xhr.responseJSON.message,
                        confirmButtonText: "Đồng ý!",
                    });
                }
            })
        }
    })
}

function getUid() {

    const object_id = $('[name="object_id"]').val();
    if (!object_id) {
        toastrNotify("Vui lòng nhập đường dẫn bài viết hoặc ID buff!", "error");
        return;
    }
    if (Number.isInteger(object_id)) {
        return;
    }
    else if (object_id.match(/https:\/\/|http:\/\//)) {
        $.ajax({
            url: '/api/v1/tools/get-uid',
            method: 'GET',
            data: {
                link: object_id
            },
            dataType: 'json',
            beforeSend: function () {
                Swal.fire({
                    title: 'Đang lấy UID...',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                });
            },
            success: function (response) {
                if (response.status === 'success') {
                    $('[name="object_id"]').val(response.data.id);
                    Swal.close();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: "Thông báo",
                        text: response.message,
                        confirmButtonText: "Đồng ý!",
                    });
                }
            },
            error: function (xhr) {
                Swal.fire({
                    icon: 'error',
                    title: "Thông báo",
                    text: xhr.responseJSON.message,
                    confirmButtonText: "Đồng ý!",
                });
            }
        })
    }

}
