console.log(
  "%cF12 làm cái chó gì Trộm Code à đm mày 👀",
  "color: #fff; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 20px; border-radius: 10px; font-weight: bold; font-size: 16px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
);

 console.log(
      "%c🌳 Name：NGuyễn Công Hiệp | Bio：Sayy Hello",
      "font-family: ;color:rgb(199, 240, 14); background: linear-gradient(270deg,rgb(4, 70, 253),rgb(7, 152, 50), #8695e6, #986fee); padding: 8px 15px; border-radius: 8px"
    );

console.log(
  `%c⚠ Cảnh báo vui lòng đóng F12`,
  "font-family: 'Segoe UI', Arial, sans-serif; color: #fff; background: #1877f2; padding: 15px; border-radius: 6px; font-size: 13px; line-height: 1.4; border-left: 4px solid #f02849; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-weight: 500;"
);
console.log(
  `%c⚠ Thời gian: ${new Date().toLocaleString('vi-VI')}`,
  "font-family: 'Segoe UI', Arial, sans-serif; color: #fff; background: #1877f2; padding: 15px; border-radius: 6px; font-size: 13px; line-height: 1.4; border-left: 4px solid #f02849; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-weight: 500;"
);


$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});

function swal(text, icon) {
    if (icon == "success") {
        Swal.fire({
            heightAuto: false,
            icon: icon,
            title: `<h3>Thông báo</h3>`,
            html: `${text}`,
            confirmButtonText: "Ok, got it!",
            customClass: {
                confirmButton: 'swal2-confirm btn btn-success'  // Thêm class Bootstrap cho nút confirm
            }
        });
    } else {
        Swal.fire({
            heightAuto: false,
            icon: icon,
            title: `<h3>Thông báo</h3>`,
            html: `${text}`,
            confirmButtonText: "Ok, got it!",
            customClass: {
                confirmButton: 'swal2-confirm btn btn-danger'  // Thêm class Bootstrap cho nút confirm
            }
        });
    }
}

const coppy = (element) => {
    const textArea = document.createElement("textarea");
    textArea.value = element;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    swal(`Sao chép thành công`, "success");
}

const toastrNotify = (text, icon) => {
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "10000",
        "extendedTimeOut": "10000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    toastr[icon](text, 'Thông báo!');
}

const copyToClipboard = (element) => {
    const $temp = $("<input>");
    $("body").append($temp);
    $temp.val(element).select();
    document.execCommand("copy");
    $temp.remove();
    swal(`Sao chép thành công `, "success");
}