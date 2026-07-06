$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
var voucher_discount = 0;

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

    const massLinks = (orderType === 'mass')
        ? (form.find('#mass_object_id').val() || '')
            .split(/\r?\n/)
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line !== ''; })
        : [];

    if (orderType === 'mass') {
        if (massLinks.length === 0) {
            swal('Vui lòng nhập ít nhất 1 link/UID cho Đơn hàng loạt!', 'error');
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
                    title: 'Kết quả đặt hàng loạt',
                    html: `<b>Thành công:</b> ${successCount}/${massLinks.length}<br><b>Thất bại:</b> ${failCount}/${massLinks.length}${failPreview}`,
                    showCancelButton: successCount > 0,
                    confirmButtonText: successCount > 0 ? 'Tải lại trang' : 'Đồng ý',
                    cancelButtonText: successCount > 0 ? 'Đặt tiếp' : undefined,
                    customClass: {
                        confirmButton: 'btn btn-dalymmocom_success btn-success',
                        cancelButton: 'btn btn-dalymmocom_cancel btn-secondary'
                    }
                }).then((result) => {
                    if (successCount > 0 && result.isConfirmed) {
                        window.location.reload();
                    }
                });
                return;
            }

            const link = massLinks[current];
            const dataArr = form.serializeArray().filter(function (item) {
                return item.name !== 'object_id' && item.name !== 'mass_object_id';
            });
            dataArr.push({ name: 'object_id', value: link });
            const payload = $.param(dataArr);

            sendAjax(payload, {
                beforeSend: function () {
                    btn.html(`&ensp;Đang xử lý ${current + 1}/${massLinks.length}`);
                },
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
        return;
    }

    sendAjax(form.serialize(), {
        beforeSend: function () {
            btn.html('&ensp;Đang xử lý').attr('disabled', true);
        },
        success: function (response) {
            if (response.code === '200' && response.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: "Thông báo",
                    text: response.message,
                    showCancelButton: true, 
                    confirmButtonText: "Tải lại trang", 
                    cancelButtonText: "Đặt tiếp", 
                    customClass: {
                        confirmButton: 'btn btn-dalymmocom_success btn-success',
                        cancelButton: 'btn btn-dalymmocom_cancel btn-secondary' 
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.reload(); 
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        console.log("Đặt tiếp, không reload trang!");
                    }
                });
            } else {
                swal(response.message, 'error');
            }
        },
        error: function (xhr) {
            swal((xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Có lỗi xảy ra', 'error');
        },
        complete: function () {
            btn.html(btnText).attr('disabled', false);
        }
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
    var lam = provider_server.data('details') || '';
    var baohanh_text = provider_server.data('baohanh') === 'on' ? '<b class="text-white">Có</b>' : '<b class="text-white">Không</b>';
    var huy_text = provider_server.data('huy') === 'on' ? '<b class="text-white">Có</b>' : '<b class="text-white">Không</b>';
    var price_1000 = Intl.NumberFormat().format(price * 1000);

    elm.append(`
        <div class="alert alert-info bg-info text-white" id="informationServer" style="border: 1px dashed #fff;">
            <div><i class="fas fa-bolt"></i> Tốc độ hoàn thành trung bình: <span id="info_avg_time">Đang phân tích...</span></div>
            <div><i class="fas fa-shield-alt"></i> Bảo hành: ${baohanh_text}</div>
            <div><i class="fas fa-undo"></i> Hủy Đơn hoàn phần thừa: ${huy_text}</div>
            <div><i class="fas fa-shopping-cart"></i> Tăng 1000 hết: <b>${price_1000} đ</b></div>
            <hr style="margin: 10px 0; border-top: 1px dashed #fff;">
            <div style="white-space: pre-wrap;">${lam}</div>
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

        $('#break-price').html(Intl.NumberFormat().format(price) + ' ₫');
        $('#break-quantity').html(Intl.NumberFormat().format(quantity));
        $('#break-subtotal').html(Intl.NumberFormat().format(subtotal) + ' ₫');
        $('#break-discount').html(`${voucher_discount}% = -${Intl.NumberFormat().format(discount_amount)} ₫`);

        $('#voucher-details').show();
        $('#total_pay').html(`${Intl.NumberFormat().format(final_pay)}`);
    } else {
        $('#voucher-details').hide();
        $('#total_pay').html(`${Intl.NumberFormat().format(totalPay)}`);
    }
}

function showElm(elm, status) {
    if (status === 'on') {
        elm.show();
    } else {
        elm.hide();
    }
}

function showReaction() {
    const provider_server = $('input[name="provider_server"]:checked');
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

function cancelScheduledOrder(order_code) {
    Swal.fire({
        title: 'Xác nhận hủy hẹn giờ?',
        text: "Bạn chắc chắn muốn hủy hẹn giờ cho đơn hàng này?",
        icon: 'warning',
        showCloseButton: !0,
        showCancelButton: !0,
        confirmButtonText: "Hủy hẹn giờ",
        cancelButtonColor: "rgb(224, 56, 56)",
        cancelButtonText: "Đóng"
    }).then(result => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/api/v1/order/cancel-scheduled',
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
                            confirmButtonText: "Đồng ý !",
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý !",
                        });
                    }
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: "Thông báo",
                        text: xhr.responseJSON.message,
                        confirmButtonText: "Đồng ý !",
                    });
                }
            })
        }
    })
}

function refundOrder(order_code) {
    Swal.fire({
        title: 'Xác nhận hoàn tiền ?,
        text: "Bạn chắc chắn muốn hoàn tiền cho đơn hàng này và sẽ trừ 1000 vnd vào tài khoản của bạn ?",
        icon: 'warning',
        showCloseButton: !0,
        showCancelButton: !0,
        confirmButtonText: "Hoàn tiền",
        cancelButtonColor: "rgb(224, 56, 56)",
        cancelButtonText: "Há»§y"
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
                            confirmButtonText: "Đồng ý !",
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý !",
                        });
                    }
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: "Thông báo",
                        text: xhr.responseJSON.message,
                        confirmButtonText: "Đồng ý !",
                    });
                }
            })
        }
    })
}

function warrantyOrder(order_code) {
    Swal.fire({
        title: 'Xác nhận bảo hành ?,
        text: "Bạn chắc chắn muốn bảo hành cho đơn hàng này ?",
        icon: 'warning',
        showCloseButton: !0,
        showCancelButton: !0,
        confirmButtonText: "Bảo hành",
        cancelButtonColor: "rgb(224, 56, 56)",
        cancelButtonText: "Há»§y"
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
                            confirmButtonText: "Đồng ý !",
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý !",
                        });
                    }
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: "Thông báo",
                        text: xhr.responseJSON.message,
                        confirmButtonText: "Đồng ý !",
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
                    confirmButtonText: "Đồng ý !",
                }).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: "Thông báo",
                    text: response.message,
                    confirmButtonText: "Đồng ý !",
                });
            }
        },
        error: function (xhr) {
            Swal.fire({
                icon: 'error',
                title: "Thông báo",
                text: xhr.responseJSON.message,
                confirmButtonText: "Đồng ý !",
            });
        }
    })
}

function renewsOrder(order_code){
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
        cancelButtonText: "Há»§y",
        didOpen: () => {
            $('#renews').on('input', function(){
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
                            confirmButtonText: "Đồng ý !",
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: "Thông báo",
                            text: response.message,
                            confirmButtonText: "Đồng ý !",
                        });
                    }
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: "Thông báo",
                        text: xhr.responseJSON.message,
                        confirmButtonText: "Đồng ý !",
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
                        confirmButtonText: "Đồng ý !",
                    });
                }
            },
            error: function (xhr) {
                Swal.fire({
                    icon: 'error',
                    title: "Thông báo",
                    text: xhr.responseJSON.message,
                    confirmButtonText: "Đồng ý !",
                });
            }
        })
    }

}

function checkVoucher() {
    const voucher = $('#voucher_code').val();
    if (!voucher || voucher.length < 3) {
        voucher_discount = 0;
        $('#voucher_message').html('');
        checkPrice();
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
                checkPrice();
            } else {
                voucher_discount = 0;
                $('#voucher_message').removeClass('text-success').addClass('text-danger').html('<i class="fas fa-times-circle"></i> ' + (res.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn!'));
                checkPrice();
            }
        },
        error: function () {
            voucher_discount = 0;
            $('#voucher_message').removeClass('text-success').addClass('text-danger').html('<i class="fas fa-times-circle"></i> Có lỗi xảy ra khi kiểm tra mã!');
            checkPrice();
        }
    });
}
