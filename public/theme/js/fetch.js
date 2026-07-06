console.log(
  "%cF12 làm cái chó gì Trộm Code à đm mày 👀",
  "color: #fff; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 20px; border-radius: 10px; font-weight: bold; font-size: 16px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
);

 console.log(
      "%c🌳 Name：DVSLAM | Bio：Sayy Hello",
      "font-family: ;color:rgb(199, 240, 14); background: linear-gradient(270deg,rgb(4, 70, 253),rgb(7, 152, 50), #8695e6, #986fee); padding: 8px 15px; border-radius: 8px"
    );



// =============================================================================================================================================================================================

$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});

const loadTable = (elm, key, columns, url = null) => {
    const dtable = $(elm).DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            url: url ? url : '/user/get-data?model=' + key,
            type: 'GET',
            data: {
                key: key
            },
            error: function (xhr, error, code) {
                Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu, vui lòng thử lại sau", "error");
            }
        },
        columns: columns,
        "order": [[0, "desc"]],
        "language": {
            "sProcessing": "Đang xử lý...",
            "sLengthMenu": "Xem _MENU_ mục",
            "sZeroRecords": "Không tìm thấy dòng nào phù hợp",
            "sInfo": "Đang xem _START_ đến _END_ trong tổng số _TOTAL_ mục",
            "sInfoEmpty": "Đang xem 0 đến 0 trong tổng số 0 mục",
            "sInfoFiltered": "(được lọc từ _MAX_ mục)",
            "sSearch": "",
            "sEmptyTable": "Không có dữ liệu",
        },
        // "scrollX": true,
        "lengthMenu": [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "Tất cả"]
        ],
    });


    return dtable;
}  
function swal(text, icon) {
    if (icon == "success") {
        Swal.fire({
            heightAuto: false,
            icon: icon,
            title: `<h3>Thông báo</h3>`,
            html: `${text}`,
            confirmButtonText: "Ok, got it!",
            customClass: {
                confirmButton: 'swal2-confirm btn btn-success'
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
                confirmButton: 'swal2-confirm btn btn-danger' 
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