$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});



$('form[Pawver1-request="order"]').on('submit', function (e) {
    e.preventDefault();
    const form = $(this);
    const url = form.attr('action');
    const method = form.attr('method');
    const data = form.serialize();
    const btn = form.find('button[type="submit"]');
    const btnText = btn.html();

    
            

            $.ajax({
                url: url,
                method: method,
                headers: {
                    'X-ACCESS-TOKEN': $('meta[name="access-token"]').attr('content')
                },
                
                data: data,
                dataType: 'json',
                beforeSend: function () {
                    btn.html('<i class="fas fa-spinner fa-spin"></i>&ensp;Đang xử lý').attr('disabled', true);
                },
                success: function (response) {
                    if (response.code === '200' && response.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: "Thông báo",
                            text: response.message,
                             
                            confirmButtonText: "Ok, got it!",
                            customClass: {
                                confirmButton: 'btn btn-Pawver1_success btn-success'  // Thêm class Bootstrap cho nút confirm
                            }
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        swal(response.message, 'error');
                    }
                },
                error: function (xhr) {
                    swal(xhr.responseJSON.message, 'error');
                    // Swal.fire({
                    //     icon: 'error',
                    //     title: "Thông báo",
                    //     text: xhr.responseJSON.message,
                    //     confirmButtonText: "Đồng ý !",
                    // });
                },
                complete: function () {
                    btn.html(btnText).attr('disabled', false);
                }
            

        
    })

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
    $('#informationServer').html(provider_server.data('details')).addClass('alert bg-warning text-white');
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
    let totalPay = price * quantity;

    if (minutes && provider_server.data('minute') === 'on') {
        totalPay = totalPay * minutes;
    }

    if (duration && provider_server.data('time') === 'on') {
        totalPay = totalPay * duration;
    }

    if (posts && provider_server.data('posts') === 'on') {
        totalPay = totalPay * posts;
    }

    let totalPay1 = totalPay.toFixed(0);
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
    $('#total_pay').html(`${Intl.NumberFormat().format(totalPay1)}`);
}

function formatNumber(nStr, decSeperate = ".", groupSeperate = ",") {
    nStr += "";
    x = nStr.split(decSeperate);
    x1 = x[0];
    x2 = x.length > 1 ? "." + x[1] : "";
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, "$1" + groupSeperate + "$2");
    }
    return x1 + x2;
}
function checkPriceLt() {
 
    const provider_server = $('select[name="provider_server"] option:selected');
    let price = provider_server.data('price');
    if (!(price)) return;  

    showElm($('#reactions_type'), provider_server.data('reaction'));
    showElm($('#quantity_type'), provider_server.data('quantity'));
    showElm($('#comments_type'), provider_server.data('comment'));
    showElm($('#minute_type'), provider_server.data('minute'));
    showElm($('#time_type'), provider_server.data('time'))
    showElm($('#posts_type'), provider_server.data('posts'));
    showReaction();

    let object_id = $('[name="object_id"]').val();
    if (provider_server.data('getuid') === 'on') {
        // nếu có object_id và object_id không phải là số
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

    if (minutes && provider_server.data('minute') === 'on') {
        totalPay *= minutes;
    }

    if (duration && provider_server.data('time') === 'on') {
        totalPay *= duration;
    }

    if (posts && provider_server.data('posts') === 'on') {
        totalPay *= posts;
    }

    // $('#quantity_limit').html(
    //     `(${Intl.NumberFormat().format(provider_server.data('min') || 0)} ~ ${Intl.NumberFormat().format(provider_server.data('max') || 0)})`
    // );
    // $('#quantity_limitss').html(
    //     `(${Intl.NumberFormat().format(provider_server.data('min') || 0)} ~ ${Intl.NumberFormat().format(provider_server.data('max') || 0)})`
    // );
    $('#comment-alert').html(provider_server.data('comment_type') || 'Không có');
    $('#counter_comment').html(Intl.NumberFormat().format(quantity));
    // $('#total_quantity').html(Intl.NumberFormat().format(quantity));
    // $('#current_price').html(Intl.NumberFormat().format(price));
    const selectedCurrencsy = localStorage.getItem('selectedCurrency') || 'VND';
                   
    var price_te_2;
    if(selectedCurrencsy ==='USD'){
         
        price_te_2 = '$';
    }
    else{
        
        price_te_2 = 'VND';

    }
    $('#quantity_amount').html(`${Intl.NumberFormat().format(totalPay)} ${price_te_2}`);
}


function showElm(elm, status) {
    if (status === 'on') {
        elm.show();
    } else {
        elm.hide();
    }
}

function showReaction() {
    const provider_server = $('select[name="provider_server"] option:selected'); // Adjust selector if needed
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
        title: 'Xác nhận hoàn tiền ?',
        text: "Bạn chắc chắn muốn hoàn tiền cho đơn hàng này ?",
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
                             
                            confirmButtonText: "Ok, got it!",
                            customClass: {
                                confirmButton: 'btn btn-dalymmocom_success btn-success'  // Thêm class Bootstrap cho nút confirm
                            }
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
        title: 'Xác nhận bảo hành ?',
        text: "Bạn chắc chắn muốn bảo hành cho đơn hàng này ?",
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
                             
                            confirmButtonText: "Ok, got it!",
                            customClass: {
                                confirmButton: 'btn btn-dalymmocom_success btn-success'  // Thêm class Bootstrap cho nút confirm
                            }
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
        cancelButtonText: "Hủy",
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
                             
                            confirmButtonText: "Ok, got it!",
                            customClass: {
                                confirmButton: 'btn btn-dalymmocom_success btn-success'  // Thêm class Bootstrap cho nút confirm
                            }
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
