$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});



$('form[Pawver1-requests="order"]').on('submit', function (e) {
    e.preventDefault();
    const form = $(this);
    const url = form.attr('action');
    const method = form.attr('method'); 
    const data = form.serialize();
    const btn = form.find('button[type="submit"]');
    const btnText = btn.html();

    Swal.fire({
        title: 'Xác nhận thanh toán ?',
        html: `Bạn có muốn thanh toán đơn hàng?, chúng tôi sẽ không hoàn tiền với đơn đã thanh toán.`,
        icon: 'warning',
        showCloseButton: !0,
        showCancelButton: !0,
        confirmButtonText: "Thanh toán",
        cancelButtonColor: "rgb(224, 56, 56)",
        cancelButtonText: "Hủy"
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: "warning",
                title: "Đơn hàng đang được xử lý, nghiêm cấm tắt trình duyệt, F5 tránh hụt đơn mất tiền!",
                timer: 15000,
                timerProgressBar: true,
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            $.ajax({
                url: url,
                method: method,
                headers: {
                    'X-ACCESS-TOKEN': $('meta[name="access-token"]').attr('content')
                },
                data: data,
                dataType: 'json',
                beforeSend: function () {
                    btn.html('<i class="fas fa-spinner fa-spin"></i> Đang xử lý').attr('disabled', true);
                },
                success: function (response) {
                    if (response.code === '200' && response.status === 'success') {
                        Swal.fire({
                    icon: 'success',
                    title: "Thông báo",
                    text: response.message,
                    confirmButtonText: "Đồng ý !",
                      }).then(() => {
                    window.history.back(); // hoặc window.history.go(-1);
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
                },
                complete: function () {
                    btn.html(btnText).attr('disabled', false);
                }
            })

        }
    })

});



 